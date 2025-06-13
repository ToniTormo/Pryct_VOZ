function argprin(v) {
    // Calcula el argumento principal de v
    let w = (Math.atan2(Math.sin(v), Math.cos(v)) + Math.PI) % (2 * Math.PI) - Math.PI;
    return w;
}

function convolve(signal, kernel) {
    const result = [];
    const kernelSize = kernel.length;
    const signalSize = signal.length;

    for (let i = 0; i < signalSize; i++) {
        let sum = 0;
        for (let j = 0; j < kernelSize; j++) {
            const index = i - Math.floor(kernelSize / 2) + j;
            if (index >= 0 && index < signalSize) {
                sum += signal[index] * kernel[j];
            }
        }
        result.push(sum);
    }

    return result;
}