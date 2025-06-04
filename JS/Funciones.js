var audioContext = new (window.AudioContext || window.webkitAudioContext)();
var source = audioContext.createBufferSource();

function modifyVoice() {
    var gainNode = audioContext.createGain();
    var biquadFilter = audioContext.createBiquadFilter();

    biquadFilter.type = 'lowshelf';
    biquadFilter.frequency.value = 1000;
    biquadFilter.gain.value = 25;

    source.connect(biquadFilter);
    biquadFilter.connect(gainNode);
    gainNode.connect(audioContext.destination);
}