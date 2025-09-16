/*
  AudioEngine.js
  Purpose: Extracted recording-related functions & variables from main.js.
  This module centralizes recording lifecycle and delegates effect building/rendering
  to an injected EffectsProcessor implementation.

  NOTE: Many blocks below were adapted from main.js (recording lifecycle, render, download handler,
  bufferToWave). Calls to in-file chorus/eco/reverb/aplicar_efectos were replaced by calls to
  EffectsProcessorRef (injected via initAudioEngine).
*/

// Module-level variables (copied/adapted from main.js lines referenced in the task)
let audioStream = null;
let audioRecorder = null; // placeholder if needed
let mediaRecorder = null;
let audioElement = null; // document.getElementById('repro') will be assigned in startRecording
let ctx = null;
let sourceNode = null;
let grabando = false;
let audioUrl = null;
let offlineContext = null;
let offlineSource = null;
let audioBuffer = null;
let wavBlob = null;

// Reference to injected EffectsProcessor implementation
let EffectsProcessorRef = null;

// Helper to get AudioContext in cross-browser manner
function createAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  return new AudioCtx();
}

// startRecording: adapted from main.js lines ~33-89
// Sets up media stream, audio context, source node, mediaRecorder and delegates effect setup
async function startRecording() {
  try {
    // Acquire microphone stream
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Ensure we have an audio element to preview/playback
    audioElement = document.getElementById('repro');
    if (!audioElement) {
      // create a minimal audio element if missing to avoid later failures
      audioElement = document.createElement('audio');
      audioElement.id = 'repro';
      audioElement.controls = true;
      document.body.appendChild(audioElement);
    }

    // Create audio context and source node
    ctx = createAudioContext();
    sourceNode = ctx.createMediaStreamSource(audioStream);

    // If EffectsProcessorRef provides a setup hook, call it to build effect graph in the live context
    if (EffectsProcessorRef && typeof EffectsProcessorRef.setupEffects === 'function') {
      // Pass relevant nodes/contexts so EffectsProcessor can wire nodes (live processing)
      try {
        EffectsProcessorRef.setupEffects({ ctx, offlineContext: null, sourceNode, audioBuffer: null });
      } catch (err) {
        console.warn('EffectsProcessor.setupEffects threw an error:', err);
      }
    }

    // Create MediaRecorder to capture audio for later processing
    // Prefer the stream directly
    mediaRecorder = new MediaRecorder(audioStream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    // When recording stops, create blob, URL and decode to AudioBuffer for offline rendering
    mediaRecorder.onstop = async () => {
      try {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        wavBlob = blob; // raw recorded blob (may be webm/ogg depending on browser)

        // Create object URL for quick playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        audioUrl = URL.createObjectURL(blob);
        audioElement.src = audioUrl;

        // Decode audio data to an AudioBuffer for offline processing (render)
        const arrayBuffer = await blob.arrayBuffer();
        // Use a temporary AudioContext to decode if original ctx is suspended/closed
        const decodeCtx = ctx || createAudioContext();
        try {
          audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer.slice(0));
        } catch (decodeErr) {
          // Some older browsers use callback API
          audioBuffer = await new Promise((resolve, reject) => {
            decodeCtx.decodeAudioData(arrayBuffer, resolve, reject);
          });
        }

        // If EffectsProcessorRef has a post-record setup, call it with audioBuffer
        if (EffectsProcessorRef && typeof EffectsProcessorRef.postRecord === 'function') {
          try {
            EffectsProcessorRef.postRecord({ ctx, offlineContext: null, sourceNode, audioBuffer });
          } catch (err) {
            console.warn('EffectsProcessor.postRecord threw an error:', err);
          }
        }
      } catch (err) {
        console.error('Error processing recorded data:', err);
      }
    };

    // Start recording
    mediaRecorder.start();
    grabando = true;

    // Update UI if start/stop button exists
    const startBtn = document.getElementById('startButton');
    if (startBtn) startBtn.textContent = 'Stop';

    return true;
  } catch (err) {
    console.error('startRecording error:', err);
    grabando = false;
    return false;
  }
}

// stopRecording: adapted from main.js lines ~92-100
async function stopRecording() {
  try {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }

    // Stop all tracks on the stream
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
    }

    grabando = false;

    // Update start button UI if present
    const startBtn = document.getElementById('startButton');
    if (startBtn) startBtn.textContent = 'Start';

    return true;
  } catch (err) {
    console.error('stopRecording error:', err);
    return false;
  }
}

// start_stop: adapted from main.js lines ~102-111
function start_stop() {
  if (grabando) {
    stopRecording();
  } else {
    startRecording();
  }
}

// initAudioEngine registers button and injects EffectsProcessor; adapted from main.js lines ~114-115
function initAudioEngine({ EffectsProcessor }) {
  EffectsProcessorRef = EffectsProcessor || null;
  const startBtn = document.getElementById('startButton');
  if (startBtn) {
    startBtn.addEventListener('click', start_stop);
  }
}

// render: adapted from main.js lines ~241-297
// Renders recorded audio with offline effects via EffectsProcessorRef.renderOffline
async function render() {
  if (!audioBuffer) {
    throw new Error('No recorded audioBuffer available. Record first.');
  }

  // Create an OfflineAudioContext matching the recording
  const sampleRate = audioBuffer.sampleRate || (ctx && ctx.sampleRate) || 44100;
  const length = audioBuffer.length;
  offlineContext = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(audioBuffer.numberOfChannels || 2, length, sampleRate);

  // Create a buffer source in offline context
  offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = audioBuffer;

  // Delegate the effect graph construction and rendering to EffectsProcessorRef
  if (!EffectsProcessorRef || typeof EffectsProcessorRef.renderOffline !== 'function') {
    // If no effects processor registered, simply render dry signal to keep compatibility
    offlineSource.connect(offlineContext.destination);
    offlineSource.start(0);
    const rendered = await offlineContext.startRendering();
    return rendered;
  }

  // EffectsProcessor is expected to connect the offlineSource into effect chain and return a Promise resolving to rendered buffer
  const renderedBuffer = await EffectsProcessorRef.renderOffline(offlineContext, offlineSource, audioBuffer);

  return renderedBuffer;
}

// download handler logic: creates WAV from buffer and triggers download (adapted from main.js lines ~300-314)
async function downloadRendered(filename = 'rendered.wav') {
  try {
    const rendered = await render();

    // Convert rendered AudioBuffer to WAV Blob
    const wav = bufferToWave(rendered, rendered.length);

    // Trigger download
    const url = URL.createObjectURL(wav);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (err) {
    console.error('downloadRendered error:', err);
    return false;
  }
}

// bufferToWave: adapted from main.js lines ~316-366
// Converts an AudioBuffer to a WAV Blob (16-bit PCM)
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);

  /* RIFF identifier */
  writeUTFBytes(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + len * numOfChan * 2, true);
  /* RIFF type */
  writeUTFBytes(view, 8, 'WAVE');
  /* format chunk identifier */
  writeUTFBytes(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, numOfChan, true);
  /* sample rate */
  view.setUint32(24, abuffer.sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, abuffer.sampleRate * numOfChan * 2, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numOfChan * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeUTFBytes(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, len * numOfChan * 2, true);

  // Write interleaved PCM samples
  let offset = 44;
  const interleaved = interleave(abuffer);

  // PCM 16-bit
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, interleaved[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });

  // helpers
  function writeUTFBytes(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function interleave(inputBuffer) {
    const channels = [];
    for (let i = 0; i < inputBuffer.numberOfChannels; i++) {
      channels.push(inputBuffer.getChannelData(i));
    }
    const length = inputBuffer.length;
    const result = new Float32Array(length * numOfChan);
    let index = 0;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numOfChan; ch++) {
        result[index++] = channels[ch][i];
      }
    }
    return result;
  }
}

// Exported API: keep functions available as requested
module.exports = { initAudioEngine, startRecording, stopRecording, start_stop, render, bufferToWave, downloadRendered };

// Attach to window for browser global access if available
if (typeof window !== 'undefined') {
  window.AudioEngine = module.exports;
}
