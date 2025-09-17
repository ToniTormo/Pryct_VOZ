// START OF AudioEngine.js
(function(){
  // State variables (moved from main.js)
  let audioStream = null;
  let mediaRecorder = null;
  let audioRecorder = null;
  let ctx = null;
  let audioElement = (typeof window !== 'undefined') ? document.getElementById('repro') : null;
  let sourceNode = null;
  let audioBuffer = null;
  let offlineContext = null;
  let offlineSource = null;
  let wavBlob = null;
  let grabando = false;

  // Public API object
  const API = {
    getState: () => ({grabando, audioBuffer, wavBlob}),

    async startRecording(effects) {
      // effects is optional object that may contain setup callbacks
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        throw new Error('getUserMedia not available');
      }

      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioElement = audioElement || document.getElementById('repro');
      if (!sourceNode && audioElement) sourceNode = ctx.createMediaElementSource(audioElement);

      const source = ctx.createMediaStreamSource(audioStream);
      audioRecorder = ctx.createMediaStreamDestination();
      source.connect(audioRecorder);

      mediaRecorder = new MediaRecorder(audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond: 256000 });
      let chunks = [];
      mediaRecorder.ondataavailable = async function (ev) {
        chunks.push(ev.data);
        const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
        const arrayBuffer = await blob.arrayBuffer();
        if (!audioBuffer) {
          audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        }
        // set buffer to sourceNode if available
        if (sourceNode && sourceNode.buffer !== undefined) {
          try { sourceNode.buffer = audioBuffer; } catch(e){ /* ignore in browsers where read-only */ }
        }
        chunks = [];

        // prepare offline context lazily
        if (!offlineContext && audioBuffer) {
          offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
        }

        // store wavBlob when rendering is done by render()
      };

      mediaRecorder.start();
      grabando = true;
      return;
    },

    stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
      if (audioStream) audioStream.getTracks().forEach(track => track.stop());
      grabando = false;
    },

    async render(effects) {
      // Render processed audio into wavBlob using offlineContext and effects provided
      if (!audioBuffer) throw new Error('No audioBuffer to render');
      if (!offlineContext) {
        offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
      }
      // Create offline source
      offlineSource = offlineContext.createBufferSource();
      offlineSource.buffer = audioBuffer;

      // If an effects object provides a wiring function for offline context, call it
      if (effects && typeof effects.wireOffline === 'function') {
        await effects.wireOffline({ offlineContext, offlineSource });
      } else {
        // default: connect directly to destination
        offlineSource.connect(offlineContext.destination);
      }

      offlineSource.start();
      const renderedBuffer = await offlineContext.startRendering();
      wavBlob = API.bufferToWave(renderedBuffer);
      return wavBlob;
    },

    bufferToWave(abuffer) {
      const numOfChan = abuffer.numberOfChannels;
      const length = abuffer.length * numOfChan * 2 + 44;
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      const channels = [];
      let offset = 0;
      let pos = 0;

      function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
      function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }

      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8);
      setUint32(0x45564157); // "WAVE"
      setUint32(0x20746d66); // "fmt " chunk
      setUint32(16);
      setUint16(1);
      setUint16(numOfChan);
      setUint32(abuffer.sampleRate);
      setUint32(abuffer.sampleRate * 2 * numOfChan);
      setUint16(numOfChan * 2);
      setUint16(16);

      setUint32(0x61746164); // "data"
      setUint32(length - pos - 4);

      for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

      while (pos < length) {
        for (let i = 0; i < numOfChan; i++) {
          let sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
          sample = sample * 32767.5;
          view.setInt16(pos, sample, true);
          pos += 2;
        }
        offset++;
      }
      return new Blob([buffer], { type: 'audio/wav' });
    },

    disconnectAll() {
      try {
        if (sourceNode && typeof sourceNode.disconnect === 'function') sourceNode.disconnect();
      } catch(e){}
      // We leave other effect disconnects to the EffectsProcessor which can be called separately
    }
  };

  // Attach to global/window for browser use
  if (typeof window !== 'undefined') {
    window.AudioEngine = API;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = API;
  }
})();

// END OF AudioEngine.js
