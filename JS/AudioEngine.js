// AudioEngine.js - recording related logic
(function (global) {
  const AudioEngine = {};

  // internal shared state
  let ctx;
  let audioStream;
  let audioRecorder;
  let mediaRecorder;
  let chunks = [];
  let audioBuffer = null;
  let audioElement = (typeof window !== 'undefined') ? document.getElementById('repro') : null;
  let offlineContext = null;
  let offlineSource = null;
  let wavBlob = null;
  let EffectsProcessor = null;

  AudioEngine.init = function ({ audioElement: el, EffectsProcessor: ep } = {}) {
    if (el) audioElement = el;
    if (ep) EffectsProcessor = ep;
  };

  AudioEngine.startRecording = async function () {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (!audioStream) throw new Error('No audio stream');

    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();

    const source = ctx.createMediaStreamSource(audioStream);
    audioRecorder = ctx.createMediaStreamDestination();
    source.connect(audioRecorder);

    mediaRecorder = new MediaRecorder(audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond: 256000 });
    chunks = [];
    mediaRecorder.start();

    mediaRecorder.ondataavailable = async function (e) {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      const arrayBuffer = await blob.arrayBuffer();
      if (!audioBuffer) audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // prepare offline context
      if (!offlineContext) {
        offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
      }

      // call EffectsProcessor to rebuild nodes for the live element if present
      if (EffectsProcessor && EffectsProcessor.prepareFromAudioBuffer) {
        EffectsProcessor.prepareFromAudioBuffer({ audioBuffer, ctx, offlineContext });
      }

      chunks = [];
      wavBlob = null; // invalidate previous render
      // update audioElement preview
      const audioUrl = window.URL.createObjectURL(blob);
      if (audioElement) audioElement.src = audioUrl;
    };

    return mediaRecorder;
  };

  AudioEngine.stopRecording = async function () {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
    if (audioStream) audioStream.getTracks().forEach(t => t.stop());
  };

  AudioEngine.start_stop = async function () {
    const startBtnImg = (typeof document !== 'undefined') ? document.getElementById('startImg') : null;
    const startButton = (typeof document !== 'undefined') ? document.getElementById('startButton') : null;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      if (startBtnImg) startBtnImg.src = "../img/cuadrado.png";
      await AudioEngine.startRecording();
      if (startButton) startButton.disabled = true;
    } else {
      if (startBtnImg) startBtnImg.src = "../img/micro.png";
      await AudioEngine.stopRecording();
      if (startButton) startButton.disabled = false;
    }
  };

  // Render offline and return a wav Blob (used for download)
  AudioEngine.renderAndGetWavBlob = async function () {
    if (!offlineContext || !EffectsProcessor || !EffectsProcessor.renderOffline) {
      throw new Error('Offline renderer not available');
    }
    if (wavBlob) return wavBlob; // cached
    wavBlob = await EffectsProcessor.renderOffline();
    return wavBlob;
  };

  // Helper: convert buffer to WAV (ported from old main.js)
  AudioEngine.bufferToWave = function (abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let pos = 0;
    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
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
    for (let i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));
    let offset = 0;
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
  };

  // export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
  }
  if (typeof global !== 'undefined') {
    global.AudioEngine = AudioEngine;
  }
}(typeof window !== 'undefined' ? window : global));
