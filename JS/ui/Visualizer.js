export default class Visualizer {
    constructor(bus) {
        this.bus = bus;
        this.canvasWave = document.getElementById('waveCanvas');
        this.canvasSpec = document.getElementById('spectrogramCanvas');
        this.ledL = document.getElementById('led-left');
        this.ledR = document.getElementById('led-right');
        this.ctxWave = this.canvasWave.getContext('2d');
        this.ctxSpec = this.canvasSpec.getContext('2d');
        this.running = false;
        this.audioCtx = null;
        this.analyser = null;
        this.freqData = null;
        this.timeData = null;
        this.specPos = 0;
        this.bus.on('recordingStarted', () => this._connectAnalyser());
        this.bus.on('recordingStopped', () => this._connectAnalyser());
        this.bus.on('bufferChanged', () => {});
    }

    start() { if (this.running) return; this.running = true; requestAnimationFrame(() => this._draw()); }

    _connectAnalyser() {
        if (!this.audioCtx) this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.analyser) return;
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
        this.timeData = new Uint8Array(this.analyser.fftSize);
        // Connect a MediaElement or microphone stream when available by listening to bus events external modules will emit
        // The AudioProcessor will emit 'streamForVisualization' with an AudioNode; subscribe for it
        this.bus.on('visualizeNode', node => {
            try { node.connect(this.analyser); } catch(e) { console.warn('visualize node connect failed', e); }
        });
    }

    _draw() {
        if (!this.running) return;
        if (this.analyser) {
            this.analyser.getByteTimeDomainData(this.timeData);
            this.analyser.getByteFrequencyData(this.freqData);
            this._drawWave();
            this._drawSpectrogram();
            this._updateLEDs();
        }
        requestAnimationFrame(() => this._draw());
    }

    _drawWave() {
        const ctx = this.ctxWave; const w = this.canvasWave.width; const h = this.canvasWave.height;
        ctx.clearRect(0,0,w,h);
        ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(220,220,54,0.95)';
        ctx.beginPath();
        const slice = Math.floor(this.timeData.length / w) || 1;
        for (let i=0;i<w;i++){
            const v = (this.timeData[i*slice] - 128) / 128;
            const y = (v * 0.45 + 0.5) * h;
            if (i===0) ctx.moveTo(i,y); else ctx.lineTo(i,y);
        }
        ctx.stroke();
    }

    _drawSpectrogram() {
        // shift draw left by 1 px and draw current frequency column on the right
        const ctx = this.ctxSpec; const w = this.canvasSpec.width; const h = this.canvasSpec.height;
        const image = ctx.getImageData(1,0,w-1,h);
        ctx.putImageData(image,0,0);
        // draw new column at x = w-1
        for (let y=0;y<h;y++){
            const idx = Math.floor((y / h) * this.freqData.length);
            const val = this.freqData[idx];
            const color = this._colorForValue(val);
            ctx.fillStyle = color; ctx.fillRect(w-1, h-1-y, 1, 1);
        }
    }

    _colorForValue(v){ const g = v; return `rgb(${Math.min(255,g*1.2)}, ${Math.max(24, 150 - g)}, ${Math.max(15, 180 - g)})`; }

    _updateLEDs() {
        const leftLevel = this.freqData.slice(0, this.freqData.length/4).reduce((a,b)=>a+b,0)/ (this.freqData.length/4*255);
        const rightLevel = this.freqData.slice(this.freqData.length/2).reduce((a,b)=>a+b,0)/ (this.freqData.length/2*255);
        if (leftLevel > 0.06) this.ledL.classList.add('on'); else this.ledL.classList.remove('on');
        if (rightLevel > 0.06) this.ledR.classList.add('on'); else this.ledR.classList.remove('on');
    }
}
