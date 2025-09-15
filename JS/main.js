/* main.js - module bootstrap for Pryct_VOZ modern demo */
import EventBus from './core/EventBus.js';
import AudioProcessor from './core/AudioProcessor.js';
import Visualizer from './ui/Visualizer.js';
import ThemeManager from './ui/ThemeManager.js';
import NoiseReducer from './algorithms/NoiseReducer.js';
import Compressor from './algorithms/Compressor.js';
import FormatConverter from './utils/FormatConverter.js';

// Create singletons
const bus = new EventBus();
const audioProc = new AudioProcessor(bus);
const visualizer = new Visualizer(bus);
const themeManager = new ThemeManager();

// Wire UI elements
const startBtn = document.getElementById('startButton');
const downloadBtn = document.getElementById('downloadButton');
const playPause = document.getElementById('play-pause');
const repro = document.getElementById('repro');
const themeToggle = document.getElementById('themeToggle');

// Start/Stop record toggle
startBtn.addEventListener('click', async () => {
    try {
        if (!audioProc.isRecording) {
            startBtn.disabled = true; // prevent double-press
            startBtn.querySelector('img').src = '../img/cuadrado.png';
            await audioProc.startRecording();
            startBtn.disabled = false;
        } else {
            startBtn.querySelector('img').src = '../img/micro.png';
            await audioProc.stopRecording();
        }
    } catch (err) {
        console.error('Recording error', err);
        alert('Error accessing the microphone. Check permissions.');
    }
});

// Play/Pause logic
playPause.addEventListener('click', () => {
    if (repro.paused) repro.play(); else repro.pause();
});

// Download -> request render then convert to selected format
downloadBtn.addEventListener('click', async () => {
    downloadBtn.disabled = true;
    const rendered = await audioProc.renderWithEffects();
    // simulated MP3: convert via FormatConverter (in-demo simulation) or provide WAV
    const blob = await FormatConverter.toWaveBlob(rendered);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'grabacion.wav';
    document.body.appendChild(a); a.click(); a.remove();
    downloadBtn.disabled = false;
});

// Theme toggle
themeToggle.addEventListener('click', () => themeManager.toggleTheme());

// Expose bus for debugging
window.Pryct = { bus, audioProc, visualizer, themeManager };

// Start visualizer; it will subscribe to the audio pipeline via EventBus
visualizer.start();

// Inform user of modular architecture
console.info('Pryct_VOZ modern bootstrap ready.');
