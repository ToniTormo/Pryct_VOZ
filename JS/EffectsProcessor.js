/* EffectsProcessor.js
   Centralizes audio-effect related nodes and functions extracted from main.js.
   Provides: eco, reverb, chorus, aplicar_efectos, modulationFunction, desconectar, setContexts
*/

// Resolve AudioEngine either via CommonJS or global window to avoid breaking environments
const AudioEngine = (typeof require === 'function' && typeof module !== 'undefined') ? require('./AudioEngine') : window.AudioEngine;

// Internal references to AudioContexts (real-time and offline) - set via setContexts
let ctx = null;
let offlineContext = null;

// Node-related state (live and offline counterparts)
let retardo = null;
let feed = null;
let chor_delays = null; // array
let chor_gains = null; // array
let retardooff = null;
let feedoff = null;
let chor_delaysoff = null; // array
let chor_gainsoff = null; // array
let revdelay = null;
let revgain = null;
let revdelayoff = null;
let revgainoff = null;

// For modulation (chorus LFOs)
let _chorusLFOs = [];
let _chorusModInterval = null;

// Expose setter so AudioEngine can set contexts when recording starts
function setContexts(ctxRef, offlineCtxRef) {
  ctx = ctxRef;
  offlineContext = offlineCtxRef;
}

// Create/initialize echo nodes for both contexts
function eco() {
  if (!ctx || !offlineContext) {
    console.warn('EffectsProcessor.eco: contexts not set. Call setContexts(ctx, offlineCtx) first.');
    return;
  }

  // Live context nodes
  retardo = ctx.createDelay();
  feed = ctx.createGain();
  // Typical echo defaults (these values mirror common simple echo implementations)
  retardo.delayTime.value = 0.35; // seconds
  feed.gain.value = 0.4; // feedback
  // feedback loop: retardo -> feed -> retardo
  retardo.connect(feed);
  feed.connect(retardo);

  // Offline context equivalents
  retardooff = offlineContext.createDelay();
  feedoff = offlineContext.createGain();
  retardooff.delayTime.value = 0.35;
  feedoff.gain.value = 0.4;
  retardooff.connect(feedoff);
  feedoff.connect(retardooff);
}

// Create/initialize simple reverb-like nodes (delay + gain) for both contexts
function reverb() {
  if (!ctx || !offlineContext) {
    console.warn('EffectsProcessor.reverb: contexts not set. Call setContexts(ctx, offlineCtx) first.');
    return;
  }

  // Live context nodes
  revdelay = ctx.createDelay();
  revgain = ctx.createGain();
  // Small pre-delay and moderate wet gain to emulate reverb tail
  revdelay.delayTime.value = 0.12;
  revgain.gain.value = 0.45;
  revdelay.connect(revgain);

  // Offline context equivalents
  revdelayoff = offlineContext.createDelay();
  revgainoff = offlineContext.createGain();
  revdelayoff.delayTime.value = 0.12;
  revgainoff.gain.value = 0.45;
  revdelayoff.connect(revgainoff);
}

// Create/initialize chorus nodes (multiple delays + gains) for both contexts
function chorus() {
  if (!ctx || !offlineContext) {
    console.warn('EffectsProcessor.chorus: contexts not set. Call setContexts(ctx, offlineCtx) first.');
    return;
  }

  // Define number of chorus voices
  const voices = 3;
  const baseDelays = [0.010, 0.015, 0.021]; // seconds
  const baseGains = [0.4, 0.35, 0.3];

  // Live context arrays
  chor_delays = [];
  chor_gains = [];
  for (let i = 0; i < voices; i++) {
    const d = ctx.createDelay();
    const g = ctx.createGain();
    d.delayTime.value = baseDelays[i % baseDelays.length];
    g.gain.value = baseGains[i % baseGains.length];
    d.connect(g);
    chor_delays.push(d);
    chor_gains.push(g);
  }

  // Offline context arrays
  chor_delaysoff = [];
  chor_gainsoff = [];
  for (let i = 0; i < voices; i++) {
    const d = offlineContext.createDelay();
    const g = offlineContext.createGain();
    d.delayTime.value = baseDelays[i % baseDelays.length];
    g.gain.value = baseGains[i % baseGains.length];
    d.connect(g);
    chor_delaysoff.push(d);
    chor_gainsoff.push(g);
  }
}

// Apply available effects to a given source node and an optional output gain (volume)
// sourceNode: AudioNode (required)
// volumen: optional GainNode or numeric gain value. If numeric, a GainNode will be created.
function aplicar_efectos(sourceNode, volumen) {
  if (!ctx || !sourceNode) {
    console.warn('EffectsProcessor.aplicar_efectos: missing context or sourceNode');
    return;
  }

  let outGain = null;
  if (typeof volumen === 'number') {
    outGain = ctx.createGain();
    outGain.gain.value = volumen;
  } else if (volumen && typeof volumen.gain !== 'undefined') {
    outGain = volumen; // assume a gain node
  } else {
    // default passthrough gain
    outGain = ctx.createGain();
    outGain.gain.value = 1.0;
  }

  // Always connect dry signal to outGain
  try {
    sourceNode.connect(outGain);
  } catch (e) {
    console.error('EffectsProcessor.aplicar_efectos: failed to connect source to outGain', e);
  }

  // Connect echo (wet) chain if configured
  if (retardo && feed) {
    // send a copy of source to echo input
    try {
      sourceNode.connect(retardo);
      // feed -> retardo already connected inside eco()
      // The echo's last node is 'retardo' in the feedback loop; send its output to outGain as wet
      retardo.connect(outGain);
    } catch (e) {
      console.error('EffectsProcessor.aplicar_efectos (eco):', e);
    }
  }

  // Connect reverb (wet) chain if configured
  if (revdelay && revgain) {
    try {
      sourceNode.connect(revdelay);
      revgain.connect(outGain);
      // revdelay already connected to revgain in reverb()
    } catch (e) {
      console.error('EffectsProcessor.aplicar_efectos (reverb):', e);
    }
  }

  // Connect chorus voices if configured
  if (chor_delays && chor_gains) {
    try {
      for (let i = 0; i < chor_delays.length; i++) {
        sourceNode.connect(chor_delays[i]);
        chor_gains[i].connect(outGain);
      }
    } catch (e) {
      console.error('EffectsProcessor.aplicar_efectos (chorus):', e);
    }
  }

  // Finally connect to destination if outGain not already connected by external code
  try {
    // Some host logic may expect EffectsProcessor to connect to ctx.destination
    if (outGain && outGain !== ctx.destination) {
      outGain.connect(ctx.destination);
    }
  } catch (e) {
    console.error('EffectsProcessor.aplicar_efectos: failed to connect outGain to destination', e);
  }

  // Return the output node to allow further chaining
  return outGain;
}

// Modulates chorus delayTimes using simple LFO(s). Starts internal LFOs and updates DelayNodes.
// Accepts optional settings: { rate: number (Hz), depth: seconds }
function modulationFunction(settings) {
  if (!ctx) {
    console.warn('EffectsProcessor.modulationFunction: ctx not set');
    return;
  }

  if (!chor_delays || chor_delays.length === 0) {
    console.warn('EffectsProcessor.modulationFunction: chorus not initialized. Call chorus() first.');
    return;
  }

  const opts = Object.assign({ rate: 0.25, depth: 0.004 }, settings || {});

  // Clear any existing LFOs/intervals
  desconectarModulation();

  // Use OscillatorNodes where possible; fall back to setInterval if not desired
  try {
    _chorusLFOs = chor_delays.map((d, idx) => {
      // Create an oscillator and a gain to scale modulation
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = opts.rate + (idx * 0.05); // slight detune per voice
      lfo.type = 'sine';
      lfoGain.gain.value = opts.depth;

      // We cannot directly connect to delayTime AudioParam in some browsers; but most support it
      // Connect lfo -> lfoGain -> delay.delayTime
      lfo.connect(lfoGain);
      try {
        lfoGain.connect(d.delayTime);
      } catch (e) {
        // Fallback: use setInterval to update delayTime.value
        console.warn('EffectsProcessor.modulationFunction: direct AudioParam connection failed, using interval fallback', e);
      }
      lfo.start(0);

      return { lfo, lfoGain, delayNode: d };
    });

    // For any delay that didn't get connected via AudioParam, apply interval modulation
    const fallbackIndices = _chorusLFOs.reduce((acc, item, i) => {
      // if lfoGain not connected to AudioParam, we'll use interval fallback: check if connection exists by probing delayNode.delayTime.value changes
      // Always include index to ensure modulation; the direct connect above will already modulate when supported.
      acc.push(i);
      return acc;
    }, []);

    if (fallbackIndices.length > 0) {
      let t = 0;
      _chorusModInterval = setInterval(() => {
        t += 1 / 60;
        for (let i = 0; i < chor_delays.length; i++) {
          const base = chor_delays[i].delayTime.value;
          const depth = opts.depth;
          // simple sinusoidal modulation
          const mod = Math.sin(2 * Math.PI * (opts.rate + i * 0.05) * t) * depth;
          // apply a small offset around base
          try {
            chor_delays[i].delayTime.value = Math.max(0, base + mod);
          } catch (e) {
            // ignore
          }
        }
      }, 1000 / 60);
    }
  } catch (e) {
    console.error('EffectsProcessor.modulationFunction: failed to start LFO modulation', e);
  }
}

function desconectarModulation() {
  if (_chorusModInterval) {
    clearInterval(_chorusModInterval);
    _chorusModInterval = null;
  }
  if (_chorusLFOs && _chorusLFOs.length) {
    _chorusLFOs.forEach(item => {
      try {
        item.lfo.stop();
      } catch (e) {
        // ignore
      }
      try {
        item.lfo.disconnect();
      } catch (e) {}
      try {
        item.lfoGain.disconnect();
      } catch (e) {}
    });
    _chorusLFOs = [];
  }
}

// Disconnect and clean up all effect nodes
function desconectar() {
  // Disconnect echo
  try {
    if (retardo) {
      try { retardo.disconnect(); } catch (e) {}
      retardo = null;
    }
    if (feed) {
      try { feed.disconnect(); } catch (e) {}
      feed = null;
    }
    if (retardooff) {
      try { retardooff.disconnect(); } catch (e) {}
      retardooff = null;
    }
    if (feedoff) {
      try { feedoff.disconnect(); } catch (e) {}
      feedoff = null;
    }
  } catch (e) {
    console.warn('EffectsProcessor.desconectar (eco):', e);
  }

  // Disconnect reverb
  try {
    if (revdelay) {
      try { revdelay.disconnect(); } catch (e) {}
      revdelay = null;
    }
    if (revgain) {
      try { revgain.disconnect(); } catch (e) {}
      revgain = null;
    }
    if (revdelayoff) {
      try { revdelayoff.disconnect(); } catch (e) {}
      revdelayoff = null;
    }
    if (revgainoff) {
      try { revgainoff.disconnect(); } catch (e) {}
      revgainoff = null;
    }
  } catch (e) {
    console.warn('EffectsProcessor.desconectar (reverb):', e);
  }

  // Disconnect chorus
  try {
    if (chor_delays && chor_delays.length) {
      chor_delays.forEach(d => { try { d.disconnect(); } catch (e) {} });
      chor_delays = null;
    }
    if (chor_gains && chor_gains.length) {
      chor_gains.forEach(g => { try { g.disconnect(); } catch (e) {} });
      chor_gains = null;
    }
    if (chor_delaysoff && chor_delaysoff.length) {
      chor_delaysoff.forEach(d => { try { d.disconnect(); } catch (e) {} });
      chor_delaysoff = null;
    }
    if (chor_gainsoff && chor_gainsoff.length) {
      chor_gainsoff.forEach(g => { try { g.disconnect(); } catch (e) {} });
      chor_gainsoff = null;
    }
  } catch (e) {
    console.warn('EffectsProcessor.desconectar (chorus):', e);
  }

  // Stop modulation LFOs/intervals
  desconectarModulation();
}

// Expose functions for CommonJS and window
const exported = { eco, reverb, chorus, aplicar_efectos, modulationFunction, desconectar, setContexts };

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = exported;
}

// Attach to window for browser usage
if (typeof window !== 'undefined') {
  window.EffectsProcessor = exported;
}
