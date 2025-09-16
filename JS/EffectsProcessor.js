/* EffectsProcessor.js - echo/chorus/reverb processing (UMD) */
(function(root) {
  const EP = {};

  // Local state
  EP.ctx = null; // real-time audio context (set by AudioEngine or created lazily)
  EP.sourceNode = null;
  EP.retardo = null;
  EP.feed = null;
  EP.chor_delays = [];
  EP.chor_gains = [];
  EP.retardooff = null;
  EP.feedoff = null;
  EP.chor_delaysoff = [];
  EP.chor_gainsoff = [];
  EP.revdelay = null;
  EP.revgain = null;
  EP.revdelayoff = null;
  EP.revgainoff = null;
  EP.offlineContext = null;
  EP.offlineSource = null;

  EP.initContext = function(ctx, offlineContext) {
    EP.ctx = ctx || EP.ctx || (window.AudioContext ? new AudioContext() : null);
    EP.offlineContext = offlineContext || EP.offlineContext;
  };

  EP.modulationFunction = function(modDepth, modFreq, time) {
    return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
  };

  EP.eco = function() {
    if (!EP.ctx || !EP.offlineContext) return;
    EP.retardo = EP.ctx.createDelay();
    EP.retardo.delayTime.value = parseFloat(document.getElementById('valueEcho').value);
    EP.feed = EP.ctx.createGain();
    EP.feed.gain.value = parseFloat(document.getElementById('valueEcho').value) / 2;

    EP.retardooff = EP.offlineContext.createDelay();
    EP.retardooff.delayTime.value = parseFloat(document.getElementById('valueEcho').value);
    EP.feedoff = EP.offlineContext.createGain();
    EP.feedoff.gain.value = parseFloat(document.getElementById('valueEcho').value) / 2;
  };

  EP.reverb = function() {
    if (!EP.ctx || !EP.offlineContext) return;
    EP.revdelay = EP.ctx.createDelay();
    EP.revdelay.delayTime.value = 0.01;
    EP.revgain = EP.ctx.createGain();
    EP.revgain.gain.value = parseFloat(document.getElementById('valueReverb').value);

    EP.revdelayoff = EP.offlineContext.createDelay();
    EP.revdelayoff.delayTime.value = 0.02;
    EP.revgainoff = EP.offlineContext.createGain();
    EP.revgainoff.gain.value = parseFloat(document.getElementById('valueReverb').value) / 2;
  };

  EP.chorus = function() {
    if (!EP.ctx || !EP.offlineContext) return;
    EP.chor_delays = [];
    EP.chor_gains = [];
    EP.chor_delaysoff = [];
    EP.chor_gainsoff = [];

    const modFreq = 0.2;
    const modDepth = 0.02;
    const numVoices = parseInt(document.getElementById('valueChorus').value, 10) || 0;

    for (let i = 0; i < numVoices; i++) {
      const delayModulated = EP.ctx.createDelay();
      const gm = EP.ctx.createGain();
      gm.gain.value = 0.4 + Math.random() * 0.4;
      delayModulated.delayTime.value = Math.random() * 0.1;
      EP.chor_delays.push(delayModulated);
      EP.chor_gains.push(gm);

      const delayModulatedoff = EP.offlineContext.createDelay();
      const gmoff = EP.offlineContext.createGain();
      gmoff.gain.value = 0.4 + Math.random() * 0.4;
      delayModulatedoff.delayTime.value = Math.random() * 0.1;
      EP.chor_delaysoff.push(delayModulatedoff);
      EP.chor_gainsoff.push(gmoff);
    }

    const currentTime = EP.ctx.currentTime;
    EP.chor_delays.forEach(function(delay) {
      delay.delayTime.setValueAtTime(delay.delayTime.value + EP.modulationFunction(modDepth, modFreq, currentTime), currentTime);
    });
    EP.chor_delaysoff.forEach(function(delay) {
      delay.delayTime.setValueAtTime(delay.delayTime.value + EP.modulationFunction(modDepth, modFreq, currentTime), currentTime);
    });
  };

  EP.aplicar_efectos = function() {
    if (!EP.sourceNode) return;
    try { EP.sourceNode.disconnect(); } catch(e){}

    EP.chor_delays.forEach(function(delay) {
      EP.sourceNode.connect(delay);
    });
    if (EP.retardo) EP.sourceNode.connect(EP.retardo);

    for (let i = 0; i < EP.chor_delays.length; i++) {
      EP.chor_delays[i].connect(EP.chor_gains[i]);
    }

    EP.chor_gains.forEach(function(gain) { if (EP.retardo) gain.connect(EP.retardo); });

    if (EP.retardo) {
      EP.retardo.connect(EP.feed);
      EP.feed.connect(EP.retardo);
      EP.retardo.connect(EP.revdelay);
    }

    if (EP.revdelay) {
      EP.revdelay.connect(EP.revgain);
      EP.revgain.connect(EP.revdelay);
      EP.revdelay.connect(EP.ctx.destination);
    }
  };

  EP.desconectar = function() {
    try { EP.sourceNode.disconnect(); } catch(e) {}
    EP.chor_delays.forEach(d => { try { d.disconnect(); } catch(e) {} });
    EP.chor_gains.forEach(g => { try { g.disconnect(); } catch(e) {} });
    try { EP.retardo.disconnect(); } catch(e) {}
    try { EP.feed.disconnect(); } catch(e) {}
    try { EP.revdelay.disconnect(); } catch(e) {}
    try { EP.revgain.disconnect(); } catch(e) {}
    EP.chor_delays = [];
    EP.chor_gains = [];
  };

  EP.render = async function(audioBuffer, offlineContext) {
    if (!audioBuffer) return null;
    if (!offlineContext && EP.offlineContext) offlineContext = EP.offlineContext;
    if (!offlineContext) return null;

    // create a buffer source connected to offline graph
    EP.offlineSource = offlineContext.createBufferSource();
    EP.offlineSource.buffer = audioBuffer;

    // connect offline nodes
    EP.chor_delaysoff.forEach(dly => { EP.offlineSource.connect(dly); });
    EP.offlineSource.connect(EP.retardooff);
    for (let i = 0; i < EP.chor_delaysoff.length; i++) {
      EP.chor_delaysoff[i].connect(EP.chor_gainsoff[i]);
    }
    EP.chor_gainsoff.forEach(g => { g.connect(EP.retardooff); });
    EP.retardooff.connect(EP.feedoff);
    EP.feedoff.connect(EP.retardooff);
    EP.retardooff.connect(EP.revdelayoff);
    EP.revdelayoff.connect(EP.revgainoff);
    EP.revgainoff.connect(EP.revdelayoff);
    EP.revdelayoff.connect(offlineContext.destination);

    EP.offlineSource.start();
    const renderedBuffer = await offlineContext.startRendering();

    EP.wavBlob = EP.bufferToWave(renderedBuffer);
    return EP.wavBlob;
  };

  EP.bufferToWave = function(abuffer) {
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

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

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

  // Expose
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EP;
  } else {
    root.EffectsProcessor = EP;
  }
})(this);
