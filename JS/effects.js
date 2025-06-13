import { modificaPitch, trayectoriaPitch_stft } from './pitch.js';

export function autotune(audioBuffer) {
    const fs = 44100;
    const NFFT = 2048;
    const H = 512;
    const fmax = 2000;

    const audioData = audioBuffer.getChannelData(0);

    const [f0, f0nota, a] = trayectoriaPitch_stft(audioData, fs, NFFT, H, fmax);

    const B = 1024;
    const fmin = 100;
    const A_corrected = modificaPitch(audioData, fs, B, H, f0, f0nota, fmin);

    const audioContext = new AudioContext();
    const newBuffer = audioContext.createBuffer(1, A_corrected.length, fs);
    const newData = newBuffer.getChannelData(0);
    newData.set(A_corrected);

    return newBuffer;
}