// AudioMath.js - helper math functions
(function(global){
  function argprin(v) {
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

  function generarFrecuenciasNotas(fmin, fmax) {
    const notas = [];
    let f = fmin;
    while (f <= fmax) {
      notas.push(f);
      f *= Math.pow(2, 1/12);
    }
    return notas;
  }

  function frecuenciaMasCercana(f, notas) {
    let closest = notas[0];
    let minDiff = Math.abs(f - closest);
    for (const nota of notas) {
      const diff = Math.abs(f - nota);
      if (diff < minDiff) {
        closest = nota;
        minDiff = diff;
      }
    }
    return closest;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { argprin, convolve, generarFrecuenciasNotas, frecuenciaMasCercana };
  }
  if (typeof window !== 'undefined') {
    window.AudioMath = { argprin, convolve, generarFrecuenciasNotas, frecuenciaMasCercana };
  }
})(typeof window !== 'undefined' ? window : global);
