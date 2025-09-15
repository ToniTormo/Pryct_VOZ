// AudioEngine.js - recording & rendering helpers
(function(global){
  async function startRecording(contextHelpers, EffectsModule) {
    // contextHelpers: { ctxRef, setCtx, audioElementRef, setSourceNode, getSourceNode, setAudioBuffer, getAudioBuffer }
    let ctx = contextHelpers.ctxRef();
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      contextHelpers.setCtx(ctx);
    }
    const audioElement = contextHelpers.audioElementRef();
    if (!contextHelpers.getSourceNode()) {
      try {
        const sourceNode = ctx.createMediaElementSource(audioElement);
        contextHelpers.setSourceNode(sourceNode);
      } catch (e) {
        // ignore when element has no media
      }
    }

    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(audioStream);
    const audioRecorder = ctx.createMediaStreamDestination();
    source.connect(audioRecorder);
    const mediaRecorder = new MediaRecorder(audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond : 256000 });
    let chunks = [];
    mediaRecorder.ondataavailable = async (e) => {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const arrayBuffer = await blob.arrayBuffer();
      if (!contextHelpers.getAudioBuffer()) {
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        contextHelpers.setAudioBuffer(decoded);
      }
      audioElement.src = window.URL.createObjectURL(blob);
      chunks = [];
      // re-create effects (EffectsModule expected to react to state when main.js calls wrappers)
      if (EffectsModule && typeof EffectsModule.applyOfflineEffects === 'function') {
        // It's OK if not present; main.js will manage calling specific effect nodes
        EffectsModule.applyOfflineEffects(contextHelpers.getAudioBuffer());
      }
    };
    mediaRecorder.start();
    // expose objects for stop
    return { audioStream, mediaRecorder };
  }

  function stopRecording(mediaRecorderRef) {
    if (mediaRecorderRef && mediaRecorderRef.state === 'recording') mediaRecorderRef.stop();
  }

  function bufferToWave(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;
    let pos = 0;

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    setUint32(0x46464952);
    setUint32(length - 8);
    setUint32(0x45564157);
    setUint32(0x20746d66);
    setUint32(16);
    setUint16(1);
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164);
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = sample * 32767.5;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }
    return new Blob([buffer], { type: 'audio/wav' });
  }

  // Exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { startRecording, stopRecording, bufferToWave };
  }
  if (typeof window !== 'undefined') {
    window.AudioEngine = { startRecording, stopRecording, bufferToWave };
  }
})(typeof window !== 'undefined' ? window : global);
