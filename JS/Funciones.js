

function changePitch(audioCtx, source, pitch) {
    var biquadFilter = audioCtx.createBiquadFilter();
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.value = pitch;
    source.connect(biquadFilter);
    return biquadFilter;
}