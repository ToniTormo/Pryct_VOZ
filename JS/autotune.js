const AudioMath = (typeof require === 'function' && typeof module !== 'undefined') ? require('./utils/AudioMath') : (typeof window !== 'undefined' ? window.AudioMath : undefined);
const SignalProcessing = (typeof require === 'function' && typeof module !== 'undefined') ? require('./utils/SignalProcessing') : (typeof window !== 'undefined' ? window.SignalProcessing : undefined);

function autotune(audioBuffer) {
    try {
        if (!SignalProcessing) {
            throw new Error('SignalProcessing utils module not found. Expected ./utils/SignalProcessing or window.SignalProcessing.');
        }
        if (!AudioMath) {
            // AudioMath may not be strictly necessary for autotune if SignalProcessing wraps math calls,
            // but provide a warning if missing.
            console.warn('AudioMath utils module not found. Expected ./utils/AudioMath or window.AudioMath.');
        }

        // Parámetros para el cálculo del espectrograma (manteniendo comportamiento previo)
        const fs = 44100; // Frecuencia de muestreo del audio
        const NFFT = 2048; // Tamaño de la ventana de FFT
        const H = 512; // Paso entre ventanas
        const fmax = 2000; // Frecuencia máxima considerada para el análisis

        // Obtener la señal de audio del buffer
        if (!audioBuffer || typeof audioBuffer.getChannelData !== 'function') {
            throw new Error('Invalid audioBuffer provided to autotune');
        }
        const audioData = audioBuffer.getChannelData(0);

        // Obtener la trayectoria del pitch delegando a SignalProcessing
        let trajResult = SignalProcessing.trayectoriaPitch_stft(audioData, fs, NFFT, H, fmax);
        // Support both array and object return conventions
        let f0, f0nota, a;
        if (Array.isArray(trajResult)) {
            [f0, f0nota, a] = trajResult;
        } else if (trajResult && typeof trajResult === 'object') {
            f0 = trajResult.f0 || trajResult[0];
            f0nota = trajResult.f0nota || trajResult[1];
            a = trajResult.a || trajResult[2];
        } else {
            throw new Error('Unexpected return value from SignalProcessing.trayectoriaPitch_stft');
        }

        // Parámetros para la modificación de pitch (manteniendo valores anteriores)
        const B = 1024; // Tamaño de bloque para la modificación de pitch
        const fmin = 100; // Frecuencia mínima para la modificación de pitch

        // Delegar la modificación de pitch a SignalProcessing
        let A_corrected = SignalProcessing.modificaPitch(audioData, fs, B, H, f0, f0nota, fmin);
        // If the util returns an object with property, support that
        if (A_corrected && typeof A_corrected === 'object' && !Array.isArray(A_corrected) && !(A_corrected instanceof Float32Array)) {
            // attempt common patterns
            if (Array.isArray(A_corrected.data)) A_corrected = A_corrected.data;
            else if (A_corrected.output) A_corrected = A_corrected.output;
        }

        if (!A_corrected) {
            throw new Error('SignalProcessing.modificaPitch returned no data');
        }

        // Ensure A_corrected is a Float32Array for audio buffer consumption
        let correctedFloat32;
        if (A_corrected instanceof Float32Array) {
            correctedFloat32 = A_corrected;
        } else if (Array.isArray(A_corrected) || ArrayBuffer.isView(A_corrected)) {
            try {
                correctedFloat32 = Float32Array.from(A_corrected);
            } catch (e) {
                // fallback: create new Float32Array and copy
                correctedFloat32 = new Float32Array(A_corrected.length);
                for (let i = 0; i < A_corrected.length; i++) correctedFloat32[i] = A_corrected[i] || 0;
            }
        } else {
            throw new Error('Unexpected A_corrected format from SignalProcessing.modificaPitch');
        }

        // Crear un nuevo buffer de audio con la señal corregida
        let audioContext;
        if (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)) {
            const AC = window.AudioContext || window.webkitAudioContext;
            audioContext = new AC();
        } else if (typeof AudioContext !== 'undefined') {
            audioContext = new AudioContext();
        } else {
            throw new Error('AudioContext is not available in this environment. autotune requires a browser AudioContext.');
        }

        const newBuffer = audioContext.createBuffer(1, correctedFloat32.length, fs);
        const newData = newBuffer.getChannelData(0);
        newData.set(correctedFloat32);

        return newBuffer;
    } catch (err) {
        console.error('autotune error:', err);
        throw err;
    }
}

if (typeof module !== 'undefined') module.exports = { autotune };
if (typeof window !== 'undefined') window.autotune = autotune;
