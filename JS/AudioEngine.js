/* AudioEngine.js
 * Recording & offline rendering orchestration moved from main.js
 */

const EffectsProcessor = (typeof require === 'function' && typeof module !== 'undefined') ? require('./EffectsProcessor') : (typeof window !== 'undefined' ? window.EffectsProcessor : undefined);

// Recorder state variables
let audioStream = null;
let mediaRecorder = null;
let audioRecorder = [];
let audioBuffer = null;
let offlineContext = null;
let offlineSource = null;
let wavBlob = null;
let audioElement = (typeof document !== 'undefined') ? document.getElementById('repro') : null;

// Start recording from microphone
function startRecording() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error('getUserMedia not supported in this browser.');
    return Promise.reject(new Error('getUserMedia not supported'));
  }

  return navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      audioStream = stream;
      try {
        mediaRecorder = new MediaRecorder(stream);
      } catch (e) {
        console.error('MediaRecorder creation failed:', e);
        throw e;
      }

      audioRecorder = [];

      mediaRecorder.ondataavailable = (ev) => {
        if (ev && ev.data && ev.data.size > 0) audioRecorder.push(ev.data);
      };

      mediaRecorder.onstop = () => {
        // assemble blob (wav by mime if supported fallback to webm/webm-audio)
        wavBlob = new Blob(audioRecorder, { type: 'audio/wav' });
        // create object URL for playback element
        if (audioElement) {
          audioElement.src = URL.createObjectURL(wavBlob);
        }
      };

      mediaRecorder.start();
      return Promise.resolve();
    })
    .catch(err => {
      console.error('startRecording error:', err);
      return Promise.reject(err);
    });
}

// Stop recording and finalize blob
function stopRecording() {
  return new Promise((resolve, reject) => {
    try {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }

      if (audioStream) {
        try {
          audioStream.getTracks().forEach(t => t.stop());
        } catch (e) {
          // ignore
        }
        audioStream = null;
      }

      // If wavBlob already set by onstop, resolve; otherwise wait a tick
      if (wavBlob) return resolve(wavBlob);
      setTimeout(() => resolve(wavBlob), 100);
    } catch (err) {
      console.error('stopRecording error:', err);
      reject(err);
    }
  });
}

// Toggle start/stop
function start_stop() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    return stopRecording();
  }
  return startRecording();
}

// Offline rendering orchestration: decode recorded blob, create OfflineAudioContext, apply effects, render and export wav
function render() {
  return new Promise((resolve, reject) => {
    if (!wavBlob) {
      reject(new Error('No recorded audio to render.'));
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = function () {
      const arrayBuffer = this.result;

      // Create an AudioContext only to decode; use sampleRate from decoded buffer to build OfflineAudioContext
      const audioCtx = (typeof window !== 'undefined' && window.AudioContext) ? new window.AudioContext() : null;
      const decodePromise = audioCtx ? audioCtx.decodeAudioData(arrayBuffer.slice(0)) : Promise.reject(new Error('AudioContext not available'));

      decodePromise.then(decodedBuffer => {
        audioBuffer = decodedBuffer;

        const channels = audioBuffer.numberOfChannels || 1;
        const sampleRate = audioBuffer.sampleRate || 44100;
        const length = audioBuffer.length;

        // Create offline context
        try {
          offlineContext = new (typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext) ? (window.OfflineAudioContext || window.webkitOfflineAudioContext) : function () {}) (channels, length, sampleRate);
        } catch (e) {
          // In environments without OfflineAudioContext constructor
          reject(new Error('OfflineAudioContext not available: ' + e.message));
          return;
        }

        // create source in offline context and copy buffer
        offlineSource = offlineContext.createBufferSource();
        const offlineBuffer = offlineContext.createBuffer(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
          offlineBuffer.getChannelData(ch).set(audioBuffer.getChannelData(ch));
        }
        offlineSource.buffer = offlineBuffer;

        // Apply effects via EffectsProcessor functions if available
        try {
          if (EffectsProcessor) {
            // call individual effects if present
            if (typeof EffectsProcessor.echo === 'function') {
              EffectsProcessor.echo(offlineContext, offlineSource);
            }
            if (typeof EffectsProcessor.chorus === 'function') {
              EffectsProcessor.chorus(offlineContext, offlineSource);
            }
            if (typeof EffectsProcessor.reverb === 'function') {
              EffectsProcessor.reverb(offlineContext, offlineSource);
            }
            if (typeof EffectsProcessor.aplicar_efectos === 'function') {
              EffectsProcessor.aplicar_efectos(offlineContext, offlineSource);
            }
          }
        } catch (e) {
          // Log but continue connecting
          console.warn('EffectsProcessor calls failed:', e);
        }

        // If EffectsProcessor functions did not connect nodes to destination, ensure default connection
        try {
          // If offlineSource has no outputs or was not connected, connect it to destination
          // Some EffectsProcessor implementations may return processed node; handle that
          if (offlineSource && typeof offlineSource.connect === 'function') {
            offlineSource.connect(offlineContext.destination);
          }
        } catch (e) {
          console.warn('Could not connect source to destination:', e);
        }

        offlineSource.start(0);

        offlineContext.startRendering().then(renderedBuffer => {
          // convert to wav
          try {
            const wav = bufferToWave(renderedBuffer, renderedBuffer.length);
            wavBlob = new Blob([wav], { type: 'audio/wav' });
            if (audioElement) {
              audioElement.src = URL.createObjectURL(wavBlob);
            }
            resolve({ renderedBuffer, wavBlob });
          } catch (e) {
            reject(e);
          }
        }).catch(renderErr => {
          reject(renderErr);
        });

      }).catch(decodeErr => {
        reject(decodeErr);
      });
    };

    fileReader.onerror = function (e) {
      reject(e);
    };

    fileReader.readAsArrayBuffer(wavBlob);
  });
}

// Convert AudioBuffer to WAV file ArrayBuffer (Float32 -> PCM16)
function bufferToWave(abuffer, len) {
  const numOfChannels = abuffer.numberOfChannels;
  const sampleRate = abuffer.sampleRate;
  let numSamples = len * numOfChannels;

  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  let offset = 0;

  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + numSamples * 2, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4; // Subchunk1Size (16 for PCM)
  view.setUint16(offset, 1, true); offset += 2; // AudioFormat (1 = PCM)
  view.setUint16(offset, numOfChannels, true); offset += 2;
  view.setUint32(offset, sampleRate, true); offset += 4;
  view.setUint32(offset, sampleRate * numOfChannels * 2, true); offset += 4; // ByteRate
  view.setUint16(offset, numOfChannels * 2, true); offset += 2; // BlockAlign
  view.setUint16(offset, 16, true); offset += 2; // BitsPerSample
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, numSamples * 2, true); offset += 4;

  // Write interleaved PCM samples
  const interleaved = new Int16Array(numSamples);
  let idx = 0;

  for (let i = 0; i < abuffer.length; i++) {
    for (let channel = 0; channel < numOfChannels; channel++) {
      const sample = abuffer.getChannelData(channel)[i];
      let s = Math.max(-1, Math.min(1, sample));
      interleaved[idx] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      idx++;
    }
  }

  // write samples
  for (let i = 0; i < interleaved.length; i++, offset += 2) {
    view.setInt16(44 + i * 2, interleaved[i], true);
  }

  return buffer;
}

// UMD style exports
if (typeof window !== 'undefined') {
  window.AudioEngine = { startRecording, stopRecording, start_stop, render, bufferToWave };
}

if (typeof module !== 'undefined') {
  module.exports = { startRecording, stopRecording, start_stop, render, bufferToWave };
}
