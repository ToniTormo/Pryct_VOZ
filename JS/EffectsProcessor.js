(function (global) {
  const EffectsProcessor = {};
  let ctx = null;
  let audioElement = (typeof document !== 'undefined') ? document.getElementById('repro') : null;
  let sourceNode = null;

  // nodes for live playback
  let retardo, feed, revdelay, revgain, chor_delays = [], chor_gains = [];

  // offline nodes/state
  let offlineContext = null;
  let offlineSource = null;
  let retardooff, feedoff, revdelayoff, revgainoff, chor_delaysoff = [], chor_gainsoff = [];
  let audioBuffer = null;

  EffectsProcessor.init = function ({ audioElement: el } = {}) {
    if (el) audioElement = el;
  };

  EffectsProcessor.prepareFromAudioBuffer = function ({ audioBuffer: abuf, ctx: ac, offlineContext: oc } = {}) {
    audioBuffer = abuf; ctx = ac; offlineContext = oc;
    // create or update a media element source for live playback
    try {
      if (!sourceNode && audioElement && ctx) sourceNode = ctx.createMediaElementSource(audioElement);
    } catch (e) {
      // createMediaElementSource may throw if same element used more than once
    }
  };

  EffectsProcessor.modulationFunction = function (modDepth, modFreq, time) {
    return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
  };

  EffectsProcessor.eco = function () {
    if (!ctx) return;
    retardo = ctx.createDelay();
    retardo.delayTime.value = document.getElementById('valueEcho').value;
    feed = ctx.createGain();
    feed.gain.value = document.getElementById('valueEcho').value / 2;
    if (offlineContext) {
      retardooff = offlineContext.createDelay();
      retardooff.delayTime.value = document.getElementById('valueEcho').value;
      feedoff = offlineContext.createGain();
      feedoff.gain.value = document.getElementById('valueEcho').value / 2;
    }
  };

  EffectsProcessor.reverb = function () {
    if (!ctx) return;
    revdelay = ctx.createDelay();
    revdelay.delayTime.value = 0.01;
    revgain = ctx.createGain();
    revgain.gain.value = document.getElementById('valueReverb').value;
    if (offlineContext) {
      revdelayoff = offlineContext.createDelay();
      revdelayoff.delayTime.value = 0.02;
      revgainoff = offlineContext.createGain();
      revgainoff.gain.value = document.getElementById('valueReverb').value / 2;
    }
  };

  EffectsProcessor.chorus = function () {
    if (!ctx) return;
    const modFreq = 0.2;
    const modDepth = 0.02;
    const numVoices = Number(document.getElementById('valueChorus').value) || 0;
    chor_delays = [];
    chor_gains = [];
    chor_delaysoff = [];
    chor_gainsoff = [];
    for (let i = 0; i < numVoices; i++) {
      const delayModulated = ctx.createDelay();
      const gm = ctx.createGain();
      gm.gain.value = 0.4 + Math.random() * 0.4;
      delayModulated.delayTime.value = Math.random() * 0.1;
      chor_delays.push(delayModulated);
      chor_gains.push(gm);
      if (offlineContext) {
        const delayModulatedoff = offlineContext.createDelay();
        const gmoff = offlineContext.createGain();
        gmoff.gain.value = gm.gain.value;
        delayModulatedoff.delayTime.value = delayModulated.delayTime.value;
        chor_delaysoff.push(delayModulatedoff);
        chor_gainsoff.push(gmoff);
      }
    }
    const currentTime = ctx.currentTime;
    chor_delays.forEach(d => d.delayTime.setValueAtTime(d.delayTime.value + EffectsProcessor.modulationFunction(modDepth, modFreq, currentTime), currentTime));
    chor_delaysoff.forEach(d => d.delayTime.setValueAtTime(d.delayTime.value + EffectsProcessor.modulationFunction(modDepth, modFreq, currentTime), currentTime));
  };

  EffectsProcessor.aplicar_efectos = function () {
    if (!sourceNode || !ctx) return;
    try { sourceNode.disconnect(); } catch (e) {}

    chor_delays.forEach(function (delay) { sourceNode.connect(delay); });
    sourceNode.connect(retardo);
    for (let i = 0; i < chor_delays.length; i++) chor_delays[i].connect(chor_gains[i]);
    chor_gains.forEach(g => g.connect(retardo));
    retardo.connect(feed);
    feed.connect(retardo);
    retardo.connect(revdelay);
    revdelay.connect(revgain);
    revgain.connect(revdelay);
    revdelay.connect(ctx.destination);
  };

  EffectsProcessor.desconectar = function () {
    if (sourceNode) try { sourceNode.disconnect(); } catch (e) {}
    chor_delays.forEach(d => { try { d.disconnect(); } catch (e) {} });
    chor_gains.forEach(g => { try { g.disconnect(); } catch (e) {} });
    if (retardo) try { retardo.disconnect(); } catch (e) {}
    if (feed) try { feed.disconnect(); } catch (e) {}
    if (revdelay) try { revdelay.disconnect(); } catch (e) {}
    if (revgain) try { revgain.disconnect(); } catch (e) {}
    chor_delays = [];
    chor_gains = [];
  };

  // offline render: builds offline graph using audioBuffer and nodes we created for offline (chor_delaysoff, retardooff, ...)
  EffectsProcessor.renderOffline = async function () {
    if (!offlineContext || !audioBuffer) throw new Error('No offline context or audioBuffer available');
    // create offline source and connect offline effect graph similar to original code
    offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = audioBuffer;

    chor_delaysoff.forEach(dly => offlineSource.connect(dly));
    offlineSource.connect(retardooff);
    for (let i = 0; i < chor_delaysoff.length; i++) chor_delaysoff[i].connect(chor_gainsoff[i]);
    chor_gainsoff.forEach(g => g.connect(retardooff));
    retardooff.connect(feedoff);
    feedoff.connect(retardooff);
    retardooff.connect(revdelayoff);
    revdelayoff.connect(revgainoff);
    revgainoff.connect(revdelayoff);
    revdelayoff.connect(offlineContext.destination);

    offlineSource.start();
    const renderedBuffer = await offlineContext.startRendering();

    // convert to wav blob
    const blob = (typeof window !== 'undefined' && window.AudioEngine && window.AudioEngine.bufferToWave) ? window.AudioEngine.bufferToWave(renderedBuffer) : (function () {
      // fallback minimal WAV converter (same as in AudioEngine)
      return window.AudioEngine.bufferToWave(renderedBuffer);
    }());

    // cleanup offline nodes created during render
    try { offlineSource.disconnect(); } catch (e) {}
    chor_delaysoff.forEach(d => { try { d.disconnect(); } catch (e) {} });
    chor_gainsoff.forEach(g => { try { g.disconnect(); } catch (e) {} });
    try { retardooff.disconnect(); feedoff.disconnect(); revdelayoff.disconnect(); revgainoff.disconnect(); } catch (e) {}
    chor_delaysoff = [];
    chor_gainsoff = [];

    return blob;
  };

  // export
  if (typeof module !== 'undefined' && module.exports) module.exports = EffectsProcessor;
  if (typeof global !== 'undefined') global.EffectsProcessor = EffectsProcessor;
}(typeof window !== 'undefined' ? window : global));
