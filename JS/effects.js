function chorus(signal, depth, rate) {
    const chorusSignal = new Array(signal.length).fill(0);
    for (let i = 0; i < signal.length; i++) {
        const modulatedIndex = Math.floor(i + depth * Math.sin(2 * Math.PI * rate * i));
        if (modulatedIndex < signal.length) {
            chorusSignal[i] = signal[i] + signal[modulatedIndex];
        } else {
            chorusSignal[i] = signal[i];
        }
    }
    return chorusSignal;
}function aplicar_efectos(signal, effects) {
    let processedSignal = [...signal];
    for (const effect of effects) {
        if (effect.type === 'eco') {
            processedSignal = eco(processedSignal, effect.delay, effect.decay);
        } else if (effect.type === 'reverb') {
            processedSignal = reverb(processedSignal, effect.decay);
        }
    }
    return processedSignal;
}function reverb(signal, decay) {
    const reverbSignal = new Array(signal.length).fill(0);
    for (let i = 0; i < signal.length; i++) {
        reverbSignal[i] = signal[i] * (1 - decay);
    }
    return reverbSignal;
}function eco(signal, delay, decay) {
    const delayedSignal = new Array(signal.length).fill(0);
    for (let i = delay; i < signal.length; i++) {
        delayedSignal[i] = signal[i] + decay * signal[i - delay];
    }
    return delayedSignal;
}