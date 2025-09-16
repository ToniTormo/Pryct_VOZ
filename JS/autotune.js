const AudioMath = require('./utils/AudioMath');
const SignalProcessing = require('./utils/SignalProcessing');

// Re-export autotune for backward compatibility
const autotune = SignalProcessing.autotune;

module.exports = autotune;

if (typeof window !== 'undefined') {
    try {
        window.autotune = autotune;
    } catch (e) {
        // If assignment to window fails, silently ignore to preserve compatibility
    }
}
