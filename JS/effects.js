const { modificaPitch } = require('./pitch');

function autotune(audioBuffer) {
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

module.exports = { autotune };