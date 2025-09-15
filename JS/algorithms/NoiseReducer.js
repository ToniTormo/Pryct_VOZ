export default class NoiseReducer {
    /**
     * Apply a lightweight noise reduction to an AudioBuffer using an OfflineAudioContext
     * and a lowshelf BiquadFilter as a pragmatic approximation of spectral subtraction.
     *
     * @param {AudioBuffer} audioBuffer - Input buffer to process
     * @param {Object} opts - Options
     * @param {number} opts.reductionDb - Amount in dB to attenuate below the cutoff (default 6)
     * @returns {Promise<AudioBuffer>} - Rendered AudioBuffer with noise reduction applied
     */
    static async processBuffer(audioBuffer, opts = { reductionDb: 6 }) {
        // Validate input
        if (!audioBuffer || typeof audioBuffer.numberOfChannels !== 'number' || typeof audioBuffer.sampleRate !== 'number') {
            throw new TypeError('NoiseReducer.processBuffer: audioBuffer must be a valid AudioBuffer');
        }

        const reductionDb = (opts && typeof opts.reductionDb === 'number') ? opts.reductionDb : 6;
        const numCh = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;

        // Ensure OfflineAudioContext is available
        const OfflineCtx = (typeof window !== 'undefined' && (window.OfflineAudioContext || window.webkitOfflineAudioContext))
            ? (window.OfflineAudioContext || window.webkitOfflineAudioContext)
            : null;

        if (!OfflineCtx) {
            throw new Error('NoiseReducer.processBuffer: OfflineAudioContext is not available in this environment.');
        }

        try {
            // Create an offline context and route audio through a lowshelf filter
            // that attenuates frequencies below ~200Hz. This provides a lightweight
            // broadband noise reduction suitable for demo purposes.
            const offlineCtx = new OfflineCtx(numCh, length, sampleRate);
            const src = offlineCtx.createBufferSource();
            src.buffer = audioBuffer;

            const biquad = offlineCtx.createBiquadFilter();
            biquad.type = 'lowshelf';
            biquad.frequency.value = 200; // cutoff frequency for low-frequency noise
            // Use negative gain to attenuate lows; ensure it's a finite number
            biquad.gain.value = -Math.abs(Number(reductionDb)) || -6;

            src.connect(biquad);
            biquad.connect(offlineCtx.destination);

            src.start(0);

            const rendered = await offlineCtx.startRendering();
            if (!rendered) {
                throw new Error('NoiseReducer.processBuffer: rendering returned no buffer');
            }

            return rendered;
        } catch (err) {
            // Add context to the error and rethrow for upstream handling
            throw new Error(`NoiseReducer.processBuffer failed: ${err && err.message ? err.message : String(err)}`);
        }
    }
}
