// EffectsProcessor.js - encapsulates echo, chorus, reverb and node wiring
(function(global){
  let ctxLocal;
  let offlineContextLocal;
  let chor_delays = [];
  let chor_gains = [];
  let chor_delaysoff = [];
  let chor_gainsoff = [];
  let retardo, feed, revdelay, revgain, retardooff, feedoff, revdelayoff, revgainoff, sourceNodeRef;

  function setContexts(ctxRef, offlineCtxRef) {
    ctxLocal = ctxRef();
    offlineContextLocal = offlineCtxRef();
  }

  function modulationFunction(modDepth, modFreq, time) {
    return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
  }

  function eco(contextRefs) {
    // expects ctxRef & offlineContextRef getters
    const ctx = contextRefs.ctxRef();
    const offlineContext = contextRefs.offlineContextRef();
    retardo = ctx.createDelay();
    retardo.delayTime.value = document.getElementById('valueEcho').value;
    feed = ctx.createGain();
    feed.gain.value = document.getElementById('valueEcho').value / 2;
    retardooff = offlineContext.createDelay();
    retardooff.delayTime.value = document.getElementById('valueEcho').value;
    feedoff = offlineContext.createGain();
    feedoff.gain.value = document.getElementById('valueEcho').value / 2;
  }

  function reverb(contextRefs) {
    const ctx = contextRefs.ctxRef();
    const offlineContext = contextRefs.offlineContextRef();
    revdelay = ctx.createDelay();
    revdelay.delayTime.value = 0.01;
    revgain = ctx.createGain();
    revgain.gain.value = document.getElementById('valueReverb').value;
    revdelayoff = offlineContext.createDelay();
    revdelayoff.delayTime.value = 0.02;
    revgainoff = offlineContext.createGain();
    revgainoff.gain.value = document.getElementById('valueReverb').value / 2;
  }

  function chorus(contextRefs) {
    const ctx = contextRefs.ctxRef();
    const offlineContext = contextRefs.offlineContextRef();
    var modFreq = 0.2;
    var modDepth = 0.02;
    var numVoices = document.getElementById('valueChorus').value;
    chor_delays = [];
    chor_gains = [];
    chor_delaysoff = [];
    chor_gainsoff = [];
    for (var i = 0; i < numVoices; i++) {
      var delayModulated = ctx.createDelay();
      var gm = ctx.createGain();
      gm.gain.value = 0.4 + Math.random() * 0.4;
      delayModulated.delayTime.value = Math.random() * 0.1;
      chor_delays.push(delayModulated);
      chor_gains.push(gm);
    }
    for (var i = 0; i < numVoices; i++) {
      var delayModulatedoff = offlineContext.createDelay();
      var gmoff = offlineContext.createGain();
      gmoff.gain.value = 0.4 + Math.random() * 0.4;
      delayModulatedoff.delayTime.value = Math.random() * 0.1;
      chor_delaysoff.push(delayModulatedoff);
      chor_gainsoff.push(gmoff);
    }
    var currentTime = ctx.currentTime;
    chor_delays.forEach(function(delay) {
      delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth, modFreq, currentTime), currentTime);
    });
    chor_delaysoff.forEach(function(delay) {
      delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth, modFreq, currentTime), currentTime);
    });
  }

  function aplicar_efectos(sourceNode) {
    // sourceNode is expected (MediaElementSource or OfflineSource)
    if (!sourceNode) return;
    sourceNode.disconnect();
    chor_delays.forEach(function(delay) { sourceNode.connect(delay); });
    sourceNode.connect(retardo);
    for (var i = 0; i < chor_delays.length; i++) {
      chor_delays[i].connect(chor_gains[i]);
    }
    chor_gains.forEach(function(gain) { gain.connect(retardo); });
    retardo.connect(feed);
    feed.connect(retardo);
    retardo.connect(revdelay);
    revdelay.connect(revgain);
    revgain.connect(revdelay);
    revdelay.connect(ctxLocal.destination);
  }

  function desconectar() {
    try {
      if (sourceNodeRef) sourceNodeRef.disconnect();
    } catch (e) {}
    chor_delays.forEach(function(delay) { try { delay.disconnect(); } catch(e) {} });
    chor_gains.forEach(function(gain) { try { gain.disconnect(); } catch(e) {} });
    try { retardo.disconnect(); } catch (e) {}
    try { feed.disconnect(); } catch (e) {}
    try { revdelay.disconnect(); } catch (e) {}
    try { revgain.disconnect(); } catch (e) {}
    chor_delays = [];
    chor_gains = [];
  }

  // helper to wire offline graph; used by main.js render wrapper
  function applyOfflineGraph(offlineSource) {
    chor_delaysoff.forEach(function(dly) { offlineSource.connect(dly); });
    offlineSource.connect(retardooff);
    for (var i = 0; i < chor_delaysoff.length; i++) {
      chor_delaysoff[i].connect(chor_gainsoff[i]);
    }
    chor_gainsoff.forEach(function(gain) { gain.connect(retardooff); });
    retardooff.connect(feedoff);
    feedoff.connect(retardooff);
    retardooff.connect(revdelayoff);
    revdelayoff.connect(revgainoff);
    revgainoff.connect(revdelayoff);
    revdelayoff.connect(offlineContextLocal.destination);
  }

  // Exports
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setContexts, eco, reverb, chorus, modulationFunction, aplicar_efectos, desconectar, applyOfflineGraph };
  }
  if (typeof window !== 'undefined') {
    window.EffectsProcessor = { setContexts, eco, reverb, chorus, modulationFunction, aplicar_efectos, desconectar, applyOfflineGraph };
  }
})(typeof window !== 'undefined' ? window : global);
