/* UIController.js
 * Centralizes UI event wiring for recording, playback, base selection and download.
 * Uses UMD-style lookups for AudioEngine and EffectsProcessor so it works both in Node-style bundlers and plain browser globals.
 */

/* Resolve dependencies via UMD-style lookups */
const AudioEngine = (typeof require === 'function' && typeof module !== 'undefined') ? require('./AudioEngine') : window.AudioEngine;
const EffectsProcessor = (typeof require === 'function' && typeof module !== 'undefined') ? require('./EffectsProcessor') : window.EffectsProcessor;
const audioElement = (typeof document !== 'undefined') ? document.getElementById('repro') : null;

function safeCall(fn, ...args) {
    if (typeof fn === 'function') {
        try {
            return fn(...args);
        } catch (err) {
            console.error('UIController: error calling function', err);
        }
    }
}

function formatTime(seconds) {
    if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

function initUI() {
    if (typeof document === 'undefined') return;

    const startButton = document.getElementById('startButton');
    const playPause = document.getElementById('play-pause');
    const downloadButton = document.getElementById('downloadButton');
    const basesSelect = document.getElementById('bases');
    const botonBases = document.getElementById('botonBases');
    const baseAudio = document.getElementById('base');
    const estadoAudio = document.getElementById('estado-audio');

    // Helper to toggle a button disabled state safely
    function setEnabled(el, enabled) {
        if (!el) return;
        try {
            el.disabled = !enabled;
        } catch (e) {
            // ignore
        }
    }

    // ----- start/stop recording button -----
    if (startButton) {
        // track recording state locally since AudioEngine.start_stop might be opaque
        startButton.dataset.recording = 'false';
        startButton.addEventListener('click', (ev) => {
            ev.preventDefault();
            try {
                safeCall(AudioEngine && AudioEngine.start_stop);
            } catch (err) {
                console.error('Error toggling recording via AudioEngine.start_stop', err);
            }

            // toggle UI state
            const isRecording = startButton.dataset.recording === 'true';
            if (isRecording) {
                // was recording -> now stop
                startButton.dataset.recording = 'false';
                // revert icon if present
                if (startButton.tagName === 'BUTTON') {
                    startButton.classList.remove('recording');
                    startButton.setAttribute('aria-pressed', 'false');
                    // if it contains an <img> swap alt/title if needed
                    const img = startButton.querySelector('img');
                    if (img) img.src = img.src.replace('stop', 'record');
                }
                // enable playback/download/buttons when recording stops
                setEnabled(playPause, true);
                setEnabled(downloadButton, true);
                setEnabled(botonBases, true);
            } else {
                // was stopped -> now start recording
                startButton.dataset.recording = 'true';
                if (startButton.tagName === 'BUTTON') {
                    startButton.classList.add('recording');
                    startButton.setAttribute('aria-pressed', 'true');
                    const img = startButton.querySelector('img');
                    if (img) img.src = img.src.replace('record', 'stop');
                }
                // while recording disable playback/download/base controls
                setEnabled(playPause, false);
                setEnabled(downloadButton, false);
                setEnabled(botonBases, false);
            }
        });
    }

    // ----- play / pause button -----
    if (playPause && audioElement) {
        playPause.addEventListener('click', (ev) => {
            ev.preventDefault();

            try {
                // Re-configure effects before playback as required
                safeCall(EffectsProcessor && EffectsProcessor.desconectar);
                // apply per-effect configuration functions if available
                // Attempt to call chorus/eco/reverb in the expected order
                try { safeCall(EffectsProcessor && EffectsProcessor.chorus); } catch (e) { /* ignore */ }
                try { safeCall(EffectsProcessor && EffectsProcessor.eco); } catch (e) { /* ignore */ }
                try { safeCall(EffectsProcessor && EffectsProcessor.reverb); } catch (e) { /* ignore */ }
                // finally apply them
                safeCall(EffectsProcessor && EffectsProcessor.aplicar_efectos);
            } catch (err) {
                console.error('Error configuring EffectsProcessor before playback', err);
            }

            // Toggle playback
            if (audioElement.paused) {
                audioElement.play().catch((err) => {
                    console.error('Error playing audioElement', err);
                });
                // update UI icon if present
                if (playPause.tagName === 'BUTTON') {
                    playPause.classList.add('playing');
                    playPause.setAttribute('aria-pressed', 'true');
                    const img = playPause.querySelector('img');
                    if (img) img.src = img.src.replace('play', 'pause');
                }
            } else {
                audioElement.pause();
                if (playPause.tagName === 'BUTTON') {
                    playPause.classList.remove('playing');
                    playPause.setAttribute('aria-pressed', 'false');
                    const img = playPause.querySelector('img');
                    if (img) img.src = img.src.replace('pause', 'play');
                }
            }
        });
    }

    // ----- download button -----
    if (downloadButton) {
        downloadButton.addEventListener('click', async (ev) => {
            ev.preventDefault();
            setEnabled(downloadButton, false);
            try {
                // AudioEngine.render is expected to return a Promise that resolves to a Blob
                let blob = null;
                if (AudioEngine && typeof AudioEngine.render === 'function') {
                    const maybe = AudioEngine.render();
                    // handle both promise and direct value
                    if (maybe && typeof maybe.then === 'function') {
                        blob = await maybe;
                    } else {
                        blob = maybe;
                    }
                }

                // Fallback: some implementations set AudioEngine.wavBlob
                if (!blob && AudioEngine && AudioEngine.wavBlob) {
                    blob = AudioEngine.wavBlob;
                }

                if (!blob) {
                    throw new Error('No wav blob returned from AudioEngine.render()');
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mix.wav';
                // For Firefox it needs to be in DOM
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    try { document.body.removeChild(a); } catch (e) { /* ignore */ }
                }, 1000);
            } catch (err) {
                console.error('Error rendering/downloading audio', err);
                alert('Error generating download: ' + (err && err.message ? err.message : err));
            } finally {
                setEnabled(downloadButton, true);
            }
        });
    }

    // ----- audio timeupdate -----
    if (audioElement && estadoAudio) {
        audioElement.addEventListener('timeupdate', () => {
            const cur = audioElement.currentTime || 0;
            const dur = audioElement.duration || 0;
            let text = '';
            // If duration is finite show elapsed / duration, otherwise show elapsed
            if (isFinite(dur) && dur > 0) {
                text = formatTime(cur) + ' / ' + formatTime(dur);
            } else {
                text = formatTime(cur);
            }
            estadoAudio.textContent = text;
        });
    }

    // ----- bases select and play/pause for base -----
    if (basesSelect && baseAudio) {
        // initialize botonBases disabled depending on selection
        function updateBotonBasesState() {
            const selected = basesSelect.value;
            if (!selected || selected === 'none') {
                setEnabled(botonBases, false);
            } else {
                setEnabled(botonBases, true);
            }
        }

        basesSelect.addEventListener('change', (ev) => {
            const val = basesSelect.value;
            if (val && val !== 'none') {
                // set base src and try to load it
                baseAudio.src = val;
                try { baseAudio.load(); } catch (e) { /* ignore */ }
                setEnabled(botonBases, true);
            } else {
                baseAudio.removeAttribute('src');
                try { baseAudio.load(); } catch (e) { /* ignore */ }
                setEnabled(botonBases, false);
            }
        });

        // botonBases toggles play/pause of the base audio element
        if (botonBases) {
            botonBases.addEventListener('click', (ev) => {
                ev.preventDefault();
                if (!baseAudio.src) return;
                if (baseAudio.paused) {
                    baseAudio.play().catch((err) => console.error('Error playing base audio', err));
                    botonBases.classList.add('playing');
                    botonBases.setAttribute('aria-pressed', 'true');
                } else {
                    baseAudio.pause();
                    botonBases.classList.remove('playing');
                    botonBases.setAttribute('aria-pressed', 'false');
                }
            });
        }

        // ensure initial state
        updateBotonBasesState();
    }

    // ----- Wire sliders (effect control wiring) -----
    // Sliders' UI updates (text) are handled in info.js, but actual wiring is done here.
    const ecoSlider = document.getElementById('eco');
    const chorusSlider = document.getElementById('chorus');
    const reverbSlider = document.getElementById('reverb');

    if (ecoSlider) {
        ecoSlider.addEventListener('input', (ev) => {
            const v = parseFloat(ev.target.value);
            // Prefer explicit setter if provided, otherwise try to call eco(v)
            if (EffectsProcessor) {
                if (typeof EffectsProcessor.setEco === 'function') {
                    safeCall(EffectsProcessor.setEco, v);
                } else if (typeof EffectsProcessor.eco === 'function') {
                    safeCall(EffectsProcessor.eco, v);
                }
            }
        });
    }

    if (chorusSlider) {
        chorusSlider.addEventListener('input', (ev) => {
            const v = parseFloat(ev.target.value);
            if (EffectsProcessor) {
                if (typeof EffectsProcessor.setChorus === 'function') {
                    safeCall(EffectsProcessor.setChorus, v);
                } else if (typeof EffectsProcessor.chorus === 'function') {
                    safeCall(EffectsProcessor.chorus, v);
                }
            }
        });
    }

    if (reverbSlider) {
        reverbSlider.addEventListener('input', (ev) => {
            const v = parseFloat(ev.target.value);
            if (EffectsProcessor) {
                if (typeof EffectsProcessor.setReverb === 'function') {
                    safeCall(EffectsProcessor.setReverb, v);
                } else if (typeof EffectsProcessor.reverb === 'function') {
                    safeCall(EffectsProcessor.reverb, v);
                }
            }
        });
    }

    // Provide a light guard for global usage
    console.info('UIController initialized');
}

// Exports for CommonJS and browser global
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = { initUI };
}
if (typeof window !== 'undefined') {
    window.UIController = window.UIController || {};
    window.UIController.initUI = initUI;
}

// Auto-initialize at load time as requested
try {
    initUI();
} catch (err) {
    console.error('UIController: failed to initialize on load', err);
}
