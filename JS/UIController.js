'use strict';

/**
 * UIController
 * Centralizes DOM wiring: play/pause, stop, bases select, startButton -> AudioEngine,
 * tooltips and sliders controlling EffectsProcessor.
 * Exports: initUI({AudioEngine, EffectsProcessor})
 */

function safeGet(id, altSelector) {
  if (!id && !altSelector) return null;
  let el = null;
  if (id) el = document.getElementById(id) || document.querySelector(id);
  if (!el && altSelector) el = document.querySelector(altSelector);
  return el;
}

function createTooltipBox(text) {
  const box = document.createElement('div');
  box.className = 'ui-info-box';
  box.style.position = 'absolute';
  box.style.zIndex = 10000;
  box.style.pointerEvents = 'none';
  box.style.maxWidth = '320px';
  box.style.padding = '8px 10px';
  box.style.background = 'rgba(0,0,0,0.8)';
  box.style.color = '#fff';
  box.style.borderRadius = '6px';
  box.style.fontSize = '12px';
  box.style.lineHeight = '1.3';
  box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
  box.textContent = text || '';
  box.setAttribute('role', 'tooltip');
  box.setAttribute('aria-hidden', 'true');
  document.body.appendChild(box);
  return box;
}

function positionTooltipBox(box, hostEl) {
  if (!box || !hostEl) return;
  const rect = hostEl.getBoundingClientRect();
  const margin = 8;
  // Prefer above, fallback below
  const topAbove = rect.top - box.offsetHeight - margin;
  const topBelow = rect.bottom + margin;
  let top = topAbove >= 0 ? topAbove : topBelow;
  // Horizontal center
  let left = rect.left + (rect.width - box.offsetWidth) / 2;
  // constrain to viewport
  left = Math.max(6, Math.min(left, window.innerWidth - box.offsetWidth - 6));
  // apply
  box.style.top = Math.round(top + window.scrollY) + 'px';
  box.style.left = Math.round(left + window.scrollX) + 'px';
}

function crearInfoBoxForElement(el, text) {
  if (!el) return;
  let box = null;
  function show() {
    if (!box) box = createTooltipBox(text || el.getAttribute('data-info') || el.title || '');
    box.setAttribute('aria-hidden', 'false');
    box.style.display = 'block';
    positionTooltipBox(box, el);
  }
  function hide() {
    if (!box) return;
    box.setAttribute('aria-hidden', 'true');
    box.style.display = 'none';
  }
  // mouse interactions
  el.addEventListener('mouseenter', show);
  el.addEventListener('focus', show);
  el.addEventListener('mouseleave', hide);
  el.addEventListener('blur', hide);
  // reposition on scroll/resize
  window.addEventListener('resize', function () { if (box && box.style.display !== 'none') positionTooltipBox(box, el); });
  window.addEventListener('scroll', function () { if (box && box.style.display !== 'none') positionTooltipBox(box, el); }, true);
}

function wireSlidersAndSpans(EffectsProcessor) {
  const echo = document.getElementById('valueEcho');
  const chorus = document.getElementById('valueChorus');
  const reverb = document.getElementById('valueReverb');
  const spanEcho = document.getElementById('spanEcho');
  const spanChorus = document.getElementById('spanChorus');
  const spanReverb = document.getElementById('spanReverb');

  function updateSpans() {
    if (spanEcho && echo) spanEcho.textContent = echo.value;
    if (spanChorus && chorus) spanChorus.textContent = chorus.value;
    if (spanReverb && reverb) spanReverb.textContent = reverb.value;
  }

  function updateProcessor() {
    if (!EffectsProcessor || typeof EffectsProcessor.updateParameters !== 'function') return;
    const params = {};
    if (echo) params.echo = Number(echo.value);
    if (chorus) params.chorus = Number(chorus.value);
    if (reverb) params.reverb = Number(reverb.value);
    try {
      EffectsProcessor.updateParameters(params);
    } catch (err) {
      // don't crash UI if EffectsProcessor misbehaves
      console.error('EffectsProcessor.updateParameters error', err);
    }
  }

  [echo, chorus, reverb].forEach(function (slider) {
    if (!slider) return;
    slider.addEventListener('input', function () {
      updateSpans();
      updateProcessor();
    });
    // also update on change for stepper devices
    slider.addEventListener('change', function () {
      updateSpans();
      updateProcessor();
    });
  });

  // initialize display
  updateSpans();
}

function safeCall(fn) {
  try {
    if (typeof fn === 'function') fn();
  } catch (err) {
    console.error('UIController safeCall', err);
  }
}

function initUI(deps) {
  if (!deps) deps = {};
  const AudioEngine = deps.AudioEngine;
  const EffectsProcessor = deps.EffectsProcessor;

  // DOM elements (try multiple common id variants for robustness)
  const audio = safeGet('repro', 'audio');
  const playPauseBtn = safeGet('play-pause', '.play-pause, #playPause, .btn-play');
  const stopBtn = safeGet('stopButton', '#stop');
  const startBtn = safeGet('startButton', '#start');
  const basesSelect = safeGet('bases', 'select[name="bases"]');
  const baseAudio = safeGet('base-audio', '#baseAudio');
  const progressBar = safeGet('progress', '.progress');
  const currentTimeEl = safeGet('timeCurrent', '.time-current');
  const totalTimeEl = safeGet('timeTotal', '.time-total');

  // Play/Pause toggle
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!audio) return;
      // toggle playback
      if (audio.paused) {
        audio.play().then(function () {
          playPauseBtn.classList.add('playing');
          // Apply effects via EffectsProcessor when playback starts
          if (EffectsProcessor && typeof EffectsProcessor.applyEffects === 'function') {
            safeCall(function () { EffectsProcessor.applyEffects(); });
          }
          // Optionally render via AudioEngine
          if (AudioEngine && typeof AudioEngine.render === 'function') {
            safeCall(function () { AudioEngine.render(); });
          }
        }).catch(function (err) {
          console.error('Audio play failed:', err);
        });
      } else {
        audio.pause();
        playPauseBtn.classList.remove('playing');
      }
    });
  }

  // Stop button
  if (stopBtn) {
    stopBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (!audio) return;
      audio.pause();
      try { audio.currentTime = 0; } catch (e) { console.warn('Unable to reset audio time', e); }
      if (playPauseBtn) playPauseBtn.classList.remove('playing');
      // When stopped, update AudioEngine if available
      if (AudioEngine && typeof AudioEngine.render === 'function') {
        safeCall(function () { AudioEngine.render(); });
      }
    });
  }

  // Start button delegates to AudioEngine.start_stop or toggles play
  if (startBtn) {
    startBtn.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (AudioEngine && typeof AudioEngine.start_stop === 'function') {
        try { AudioEngine.start_stop(); } catch (err) { console.error('AudioEngine.start_stop error', err); }
      } else if (audio) {
        // fallback: emulate start/stop
        if (audio.paused) {
          audio.play().catch(function (e) { console.error('fallback play failed', e); });
          if (playPauseBtn) playPauseBtn.classList.add('playing');
        } else {
          audio.pause();
          if (playPauseBtn) playPauseBtn.classList.remove('playing');
        }
      }
    });
  }

  // Bases select change
  if (basesSelect) {
    basesSelect.addEventListener('change', function () {
      const val = basesSelect.value;
      if (baseAudio) {
        baseAudio.src = val;
        try { baseAudio.load(); } catch (e) { /* ignore */ }
      }
      // re-render audio graph with new base
      if (AudioEngine && typeof AudioEngine.render === 'function') {
        safeCall(function () { AudioEngine.render(); });
      }
    });
  }

  // Audio timeupdate handling
  if (audio) {
    audio.addEventListener('timeupdate', function () {
      try {
        const cur = audio.currentTime || 0;
        const dur = audio.duration || 0;
        if (progressBar) {
          if (progressBar.tagName.toLowerCase() === 'progress') {
            progressBar.value = dur ? (cur / dur) : 0;
          } else {
            // assume a range input
            if (progressBar.max) progressBar.value = Math.floor((cur / (dur || 1)) * Number(progressBar.max));
          }
        }
        if (currentTimeEl) currentTimeEl.textContent = isFinite(cur) ? Math.floor(cur) + 's' : '0s';
        if (totalTimeEl) totalTimeEl.textContent = isFinite(dur) ? Math.floor(dur) + 's' : '--s';
        if (audio.ended) {
          if (playPauseBtn) playPauseBtn.classList.remove('playing');
        }
      } catch (err) {
        console.error('timeupdate handler error', err);
      }
    });
  }

  // Tooltips / Info boxes
  // Register tooltips for any element that has data-info attribute or title.
  (function registerTooltips() {
    // Common ids used elsewhere; attempt to attach to those as well for compatibility
    const idsToTry = [
      'info-play-pause', 'info-stop', 'info-start', 'info-bases',
      'info-echo', 'info-chorus', 'info-reverb'
    ];
    idsToTry.forEach(function (id) {
      const el = document.getElementById(id);
      if (el) crearInfoBoxForElement(el, el.getAttribute('data-info') || el.title || '');
    });

    // Attach to any element with data-info attribute
    const dataInfoEls = document.querySelectorAll('[data-info]');
    dataInfoEls.forEach(function (el) {
      crearInfoBoxForElement(el, el.getAttribute('data-info'));
    });

    // Attach to elements with class info-btn or info-icon
    const classEls = document.querySelectorAll('.info-btn, .info-icon');
    classEls.forEach(function (el) {
      crearInfoBoxForElement(el, el.getAttribute('data-info') || el.title || '');
    });
  })();

  // Wire sliders and live update of EffectsProcessor parameters
  wireSlidersAndSpans(EffectsProcessor);

  // Make initUI idempotent by returning a destroy/unwire helper
  return {
    destroy: function () {
      // Best-effort cleanup: remove listeners by reloading page or not supported here.
      // Keep minimal: we do not keep references to all closures for full removal.
      console.warn('UIController.destroy called - full cleanup not implemented. Reload page to fully remove UI wiring.');
    }
  };
}

// CommonJS export
module.exports = { initUI };
// also attach to window for browser usage
if (typeof window !== 'undefined') {
  try {
    window.UIController = module.exports;
  } catch (e) {
    // ignore
  }
}
