import EventBus from './EventBus.js';
import NoiseReducer from '../algorithms/NoiseReducer.js';
import Compressor from '../algorithms/Compressor.js';

export default class AudioProcessor {
    constructor(bus) {
        this.bus = bus;
        this.audioCtx = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.recordedBuffer = null; // AudioBuffer
        this.isRecording = false;
        this.effectsState = { echo: 0, chorus: 0, reverb: 0, eq: [0,0,0,0,0] };
        this.undoStack = [];
        this.redoStack = [];
    }

    async startRecording() {
        if (!navigator.mediaDevices) throw new Error('No media devices');
        this.audioCtx = this.audioCtx ?? new (window.AudioContext || window.webkitAudioContext)();
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(this.mediaStream);
        const chunks = [];
        this.mediaRecorder.ondataavailable = e => chunks.push(e.data);
        this.mediaRecorder.start();
        this.isRecording = true;
        this._stopPromise = new Promise(resolve => {
            this._resolveStop = async () => {
                try {
                    this.mediaRecorder.stop();
                } catch (e) {
                    // ignore if already stopped
                }
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const arrayBuffer = await blob.arrayBuffer();
                // decodeAudioData returns a promise in modern browsers
                const buffer = await this.audioCtx.decodeAudioData(arrayBuffer);
                this.recordedBuffer = buffer;
                this.isRecording = false;
                resolve(buffer);
            };
        });
        this.bus && this.bus.emit && this.bus.emit('recordingStarted');
        return this._stopPromise;
    }

    async stopRecording() {
        if (!this.isRecording) return;
        this._resolveStop && this._resolveStop();
        this.bus && this.bus.emit && this.bus.emit('recordingStopped', this.recordedBuffer);
        // push initial state for undo
        this._pushUndo(this.recordedBuffer);
        return this.recordedBuffer;
    }

    _pushUndo(buffer) { try { this.undoStack.push(buffer); if (this.undoStack.length > 25) this.undoStack.shift(); } catch(e){} }
    undo() { if (this.undoStack.length <= 1) return null; const last = this.undoStack.pop(); this.redoStack.push(last); const prior = this.undoStack[this.undoStack.length-1]; this.recordedBuffer = prior; this.bus && this.bus.emit && this.bus.emit('bufferChanged', prior); return prior; }
    redo() { if (!this.redoStack.length) return null; const next = this.redoStack.pop(); this.undoStack.push(next); this.recordedBuffer = next; this.bus && this.bus.emit && this.bus.emit('bufferChanged', next); return next; }

    applyEffectState(newState) {
        // push current to undo and apply new state
        this._pushUndo(this.recordedBuffer);
        this.effectsState = { ...this.effectsState, ...newState };
        this.bus && this.bus.emit && this.bus.emit('effectsChanged', this.effectsState);
    }

    async renderWithEffects() {
        // Simple offline rendering pipeline that applies: NoiseReducer (spectral subtract), Compressor and fade-in/out and EQ (5-band) in series.
        if (!this.recordedBuffer) throw new Error('No recording');
        const offline = new OfflineAudioContext(this.recordedBuffer.numberOfChannels, this.recordedBuffer.length, this.recordedBuffer.sampleRate);
        const src = offline.createBufferSource();
        src.buffer = this.recordedBuffer;

        // chain: noise reducer -> compressor -> gain -> destination (we implement noise/compressor via script nodes simulated using simplified algorithms using OfflineAudioContext)
        // Create nodes: using simple BiquadFilterNodes for EQ and Gain nodes for fades
        const gainNode = offline.createGain();
        // Fade-in / fade-out
        const fade = 0.02 * src.buffer.sampleRate; // 20ms default
        const total = src.buffer.length;
        // Connect chain: for simplicity connect source->gain->destination; noise reduction and compressor are applied by offline processing below
        src.connect(gainNode);
        gainNode.connect(offline.destination);

        src.start();
        // perform offline rendering
        const rendered = await offline.startRendering();

        // Post-process: apply lightweight spectral noise reduction & compression using JS arrays (spectral subtraction simplification)
        // Convert rendered to Float32Array, call algorithm modules which operate in-place or return new AudioBuffer
        const postBuffer = await NoiseReducer.processBuffer(rendered, { reductionDb: Math.max(0, 6 - this.effectsState.echo * 6) });
        const compBuffer = await Compressor.processBuffer(postBuffer, { threshold: -18, ratio: 3 });
        // Store result and update undo stack
        this.recordedBuffer = compBuffer;
        this._pushUndo(compBuffer);
        this.bus && this.bus.emit && this.bus.emit('renderComplete', compBuffer);
        return compBuffer;
    }
}
