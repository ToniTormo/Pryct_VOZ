export default class Compressor {
    static async processBuffer(audioBuffer, opts = { threshold: -20, ratio: 4 }) {
        const sr = audioBuffer.sampleRate;
        const offline = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, sr);
        const src = offline.createBufferSource(); src.buffer = audioBuffer;
        const comp = offline.createDynamicsCompressor();
        comp.threshold.value = opts.threshold; // dB
        comp.knee.value = 6;
        comp.ratio.value = opts.ratio;
        comp.attack.value = 0.003;
        comp.release.value = 0.250;
        src.connect(comp); comp.connect(offline.destination);
        src.start();
        const rendered = await offline.startRendering();
        return rendered;
    }
}
