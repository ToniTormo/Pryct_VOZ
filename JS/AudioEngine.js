/* AudioEngine.js - recording logic (UMD) */
(function(root) {
  const AudioEngine = {};

  // State (kept similar to original main.js variable names)
  AudioEngine.audioStream = null;
  AudioEngine.mediaRecorder = null;
  AudioEngine.audioRecorder = null;
  AudioEngine.audioBuffer = null;
  AudioEngine.audioUrl = null;
  AudioEngine.grabando = false;
  AudioEngine.ctx = null;
  AudioEngine.sourceNode = null;
  AudioEngine.offlineContext = null;
  AudioEngine.offlineSource = null;
  AudioEngine.wavBlob = null;

  // Start recording (async)
  AudioEngine.startRecording = async function() {
    AudioEngine.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!AudioEngine.audioStream) {
      console.warn('No audio stream available');
      return;
    }

    if (!AudioEngine.ctx) AudioEngine.ctx = new (window.AudioContext || window.webkitAudioContext)();

    const audioElement = document.getElementById('repro');
    if (!AudioEngine.sourceNode) {
      AudioEngine.sourceNode = AudioEngine.ctx.createMediaElementSource(audioElement);
    }

    const source = AudioEngine.ctx.createMediaStreamSource(AudioEngine.audioStream);
    AudioEngine.audioRecorder = AudioEngine.ctx.createMediaStreamDestination();
    source.connect(AudioEngine.audioRecorder);

    AudioEngine.mediaRecorder = new MediaRecorder(AudioEngine.audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond: 256000 });
    let chunks = [];

    AudioEngine.mediaRecorder.ondataavailable = async function(e) {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: AudioEngine.mediaRecorder.mimeType });
      const arrayBuffer = await blob.arrayBuffer();
      if (!AudioEngine.audioBuffer) {
        AudioEngine.audioBuffer = await AudioEngine.ctx.decodeAudioData(arrayBuffer);
      }
      // update player source
      AudioEngine.audioUrl = window.URL.createObjectURL(blob);
      audioElement.src = AudioEngine.audioUrl;
      chunks = [];

      // Prepare offline context lazily
      if (!AudioEngine.offlineContext) {
        AudioEngine.offlineContext = new OfflineAudioContext(
          AudioEngine.audioBuffer.numberOfChannels,
          AudioEngine.audioBuffer.length,
          AudioEngine.audioBuffer.sampleRate
        );
      }

      // Notify consumers (EffectsProcessor/UIController) by dispatching a custom event
      document.dispatchEvent(new CustomEvent('AudioEngine:bufferReady', { detail: { audioBuffer: AudioEngine.audioBuffer } }));
    };

    AudioEngine.mediaRecorder.start();
    document.getElementById('downloadButton').disabled = true;
  };

  AudioEngine.stopRecording = function() {
    if (AudioEngine.mediaRecorder && AudioEngine.mediaRecorder.state !== 'inactive') {
      AudioEngine.mediaRecorder.stop();
    }
    if (AudioEngine.audioStream) {
      AudioEngine.audioStream.getTracks().forEach(t => t.stop());
    }

    document.getElementById('startButton').disabled = false;
    document.getElementById('downloadButton').disabled = false;
    document.getElementById('stopButton').disabled = false;
  };

  AudioEngine.start_stop = function() {
    AudioEngine.grabando = !!AudioEngine.grabando;
    if (!AudioEngine.grabando) {
      document.getElementById('startImg').src = "../img/cuadrado.png";
      AudioEngine.startRecording();
      AudioEngine.grabando = true;
    } else {
      document.getElementById('startImg').src = "../img/micro.png";
      AudioEngine.stopRecording();
      AudioEngine.grabando = false;
    }
  };

  // Expose exports for both Node and browser global
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
  } else {
    root.AudioEngine = AudioEngine;
  }
})(this);
