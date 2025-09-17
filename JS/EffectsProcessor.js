// START OF EffectsProcessor.js
(function(){
  function create() {
    // runtime state
    let ctx = null;
    let sourceNode = null;

    // nodes (realtime)
    let retardo, feed, revdelay, revgain;
    let chor_delays = [], chor_gains = [];

    // offline nodes (render)
    let retardooff, feedoff, revdelayoff, revgainoff;
    let chor_delaysoff = [], chor_gainsoff = [];

    function modulationFunction(modDepth, modFreq, time) {
      return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
    }

    function updateParametersFromDOM() {
      // read DOM slider values, used before creating nodes
      return {
        echoVal: (typeof document !== 'undefined' && document.getElementById('valueEcho')) ? Number(document.getElementById('valueEcho').value) : 0,
        chorusVoices: (typeof document !== 'undefined' && document.getElementById('valueChorus')) ? Number(document.getElementById('valueChorus').value) : 0,
        reverbVal: (typeof document !== 'undefined' && document.getElementById('valueReverb')) ? Number(document.getElementById('valueReverb').value) : 0
      };
    }

    function setupRealtime(_ctx, _sourceNode) {
      ctx = _ctx;
      sourceNode = _sourceNode;
      // create nodes based on DOM parameters
      const params = updateParametersFromDOM();

      // echo
      retardo = ctx.createDelay();
      retardo.delayTime.value = params.echoVal;
      feed = ctx.createGain();
      feed.gain.value = params.echoVal / 2;

      // reverb (short delay to emulate)
      revdelay = ctx.createDelay();
      revdelay.delayTime.value = 0.01;
      revgain = ctx.createGain();
      revgain.gain.value = params.reverbVal;

      // chorus
      chor_delays = [];
      chor_gains = [];
      var modFreq = 0.2;
      var modDepth = 0.02;
      for (let i = 0; i < params.chorusVoices; i++) {
        const d = ctx.createDelay();
        const g = ctx.createGain();
        g.gain.value = 0.4 + Math.random() * 0.4;
        d.delayTime.value = Math.random() * 0.1;
        chor_delays.push(d);
        chor_gains.push(g);
      }

      // connect nodes similar to original aplicar_efectos
      if (sourceNode) {
        try { sourceNode.disconnect(); } catch(e){}
        chor_delays.forEach(d => sourceNode.connect(d));
        sourceNode.connect(retardo);
        for (let i = 0; i < chor_delays.length; i++) chor_delays[i].connect(chor_gains[i]);
        chor_gains.forEach(g => g.connect(retardo));
        retardo.connect(feed);
        feed.connect(retardo);
        retardo.connect(revdelay);
        revdelay.connect(revgain);
        revgain.connect(revdelay);
        revdelay.connect(ctx.destination);
      }

      // apply modulation snapshot
      const now = ctx.currentTime;
      chor_delays.forEach(function(delay) {
        delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth, modFreq, now), now);
      });

      return { retardo, feed, revdelay, revgain, chor_delays, chor_gains };
    }

    function wireOffline({ offlineContext, offlineSource }) {
      // Create offline nodes mirroring realtime topology
      const params = updateParametersFromDOM();
      retardooff = offlineContext.createDelay();
      retardooff.delayTime.value = params.echoVal;
      feedoff = offlineContext.createGain();
      feedoff.gain.value = params.echoVal / 2;

      revdelayoff = offlineContext.createDelay();
      revdelayoff.delayTime.value = 0.02;
      revgainoff = offlineContext.createGain();
      revgainoff.gain.value = params.reverbVal / 2;

      chor_delaysoff = [];
      chor_gainsoff = [];
      for (let i = 0; i < params.chorusVoices; i++) {
        const d = offlineContext.createDelay();
        const g = offlineContext.createGain();
        g.gain.value = 0.4 + Math.random() * 0.4;
        d.delayTime.value = Math.random() * 0.1;
        chor_delaysoff.push(d);
        chor_gainsoff.push(g);
      }

      // connect offline nodes
      try { offlineSource.disconnect(); } catch(e){}
      chor_delaysoff.forEach(d => offlineSource.connect(d));
      offlineSource.connect(retardooff);
      for (let i = 0; i < chor_delaysoff.length; i++) chor_delaysoff[i].connect(chor_gainsoff[i]);
      chor_gainsoff.forEach(g => g.connect(retardooff));
      retardooff.connect(feedoff);
      feedoff.connect(retardooff);
      retardooff.connect(revdelayoff);
      revdelayoff.connect(revgainoff);
      revgainoff.connect(revdelayoff);
      revdelayoff.connect(offlineContext.destination);

      return Promise.resolve();
    }

    function disconnectRealtime() {
      try { if (sourceNode) sourceNode.disconnect(); } catch(e){}
      chor_delays.forEach(d => { try{ d.disconnect(); }catch(e){} });
      chor_gains.forEach(g => { try{ g.disconnect(); }catch(e){} });
      try{ retardo.disconnect(); feed.disconnect(); revdelay.disconnect(); revgain.disconnect(); }catch(e){}
      chor_delays = []; chor_gains = [];
    }

    return {
      setupRealtime,
      wireOffline,
      updateParametersFromDOM,
      disconnectRealtime,
      getParams: updateParametersFromDOM
    };
  }

  if (typeof window !== 'undefined') window.EffectsProcessor = { create };
  if (typeof module !== 'undefined' && module.exports) module.exports = { create };
})();

// END OF EffectsProcessor.js
