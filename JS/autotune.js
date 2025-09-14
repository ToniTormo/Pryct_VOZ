// Begin insert (replace lines 1-353)
/* Import extracted utilities. Use CommonJS require when available (for tests/Node). In the browser this will attempt to resolve via bundler or fail gracefully. */
let argprin, segmentaf0, generarFrecuenciasNotas, frecuenciaMasCercana, trayectoriaPitch_stft, modificaPitch;
let convolve;
try {
  // Node / Jest environment
  const pitch = require('./utils/pitch');
  const effects = require('./utils/effects');
  argprin = pitch.argprin;
  segmentaf0 = pitch.segmentaf0;
  generarFrecuenciasNotas = pitch.generarFrecuenciasNotas;
  frecuenciaMasCercana = pitch.frecuenciaMasCercana;
  trayectoriaPitch_stft = pitch.trayectoriaPitch_stft;
  modificaPitch = pitch.modificaPitch;
  convolve = effects.convolve;
} catch (e) {
  // Browser runtime fallback: expect utilities to be available globally (project currently uses plain script tags).
  // If you later include JS/utils/*.js via <script> tags or a bundler, these will be taken from window.
  if (typeof window !== 'undefined') {
    argprin = window.argprin;
    segmentaf0 = window.segmentaf0;
    generarFrecuenciasNotas = window.generarFrecuenciasNotas;
    frecuenciaMasCercana = window.frecuenciaMasCercana;
    trayectoriaPitch_stft = window.trayectoriaPitch_stft;
    modificaPitch = window.modificaPitch;
    convolve = window.convolve;
  }
}

// End insertfunction autotune(audioBuffer) {
    // Parámetros para el cálculo del espectrograma
    const fs = 44100; // Frecuencia de muestreo del audio
    const NFFT = 2048; // Tamaño de la ventana de FFT
    const H = 512; // Paso entre ventanas
    const fmax = 2000; // Frecuencia máxima considerada para el análisis

    // Obtener la señal de audio del buffer
    const audioData = audioBuffer.getChannelData(0);

    // Obtener la trayectoria del pitch
    const [f0, f0nota, a] = trayectoriaPitch_stft(audioData, fs, NFFT, H, fmax);

    // Aplicar modificación de pitch
    const B = 1024; // Tamaño de bloque para la modificación de pitch
    const fmin = 100; // Frecuencia mínima para la modificación de pitch
    const A_corrected = modificaPitch(audioData, fs, B, H, f0, f0nota, fmin);

    // Crear un nuevo buffer de audio con la señal corregida
    const audioContext = new AudioContext();
    const newBuffer = audioContext.createBuffer(1, A_corrected.length, fs);
    const newData = newBuffer.getChannelData(0);
    newData.set(A_corrected);

    return newBuffer;
}
