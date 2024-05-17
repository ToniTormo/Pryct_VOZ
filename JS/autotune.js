function argprin(v) {
    // Calcula el argumento principal de v
    let w = (Math.atan2(Math.sin(v), Math.cos(v)) + Math.PI) % (2 * Math.PI) - Math.PI;
    return w;
}

function segmentaf0(fo, M=3, D=3, umbral=10) {
    // Definimos el filtro de promediado
    if (D > M) {
        D = M;
    }
    const h = new Array(2 * D + 1).fill(1 / (2 * D));
    h[D + 1] = 0;

    // Realizamos una doble diferenciación para detectar grandes variaciones en el pitch y las hacemos cero (sonidos sordos)
    let f0 = [...fo];
    let ruido = [];
    for (let i = 0; i < f0.length - 1; i++) {
        if (Math.abs(f0[i + 1] - f0[i]) > umbral) {
            ruido.push(i);
        }
    }
    ruido.forEach(idx => {
        f0[idx] = 0;
    });
    ruido = [];
    for (let i = 0; i < f0.length - 1; i++) {
        if (Math.abs(f0[i + 1] - f0[i]) > umbral) {
            ruido.push(i);
        }
    }
    ruido.forEach(idx => {
        f0[idx] = 0;
    });

    const Nbloques = f0.length;
    const sonoras = new Array(Nbloques + 1).fill(0);

    // Eliminamos los tramos sordos muy cortos interpolando
    for (let i = 0; i < Nbloques; i++) {
        sonoras[i] = f0[i] > 0 ? 1 : 0;
    }
    sonoras[Nbloques] = sonoras[Nbloques - 1] ? 0 : 1;

    const cambio = [];
    for (let i = 1; i < sonoras.length; i++) {
        cambio.push(sonoras[i] - sonoras[i - 1]);
    }
    const bloquecambio = cambio.reduce((acc, val, idx) => {
        if (val !== 0) acc.push(idx);
        return acc;
    }, []);

    let inicio = 0;
    bloquecambio.forEach(b => {
        const fin = b + 1;
        if (fin - inicio < M) {
            if (!sonoras[fin - 1]) {
                const interpolatedValues = Array.from({ length: fin - inicio + 1 }, (_, i) => f0[inicio - 1] + (f0[fin] - f0[inicio - 1]) * (i / (fin - inicio)));
                for (let i = inicio - 1; i < fin + 1; i++) {
                    f0[i] = interpolatedValues[i - inicio + 1];
                }
            }
        }
        inicio = fin;
    });

    // Eliminamos los tramos sonoros muy cortos
    for (let i = 0; i < Nbloques; i++) {
        sonoras[i] = f0[i] > 0 ? 1 : 0;
    }
    sonoras[Nbloques] = sonoras[Nbloques - 1] ? 0 : 1;

    const cambio2 = [];
    for (let i = 1; i < sonoras.length; i++) {
        cambio2.push(sonoras[i] - sonoras[i - 1]);
    }
    const bloquecambio2 = cambio2.reduce((acc, val, idx) => {
        if (val !== 0) acc.push(idx);
        return acc;
    }, []);

    inicio = 0;
    bloquecambio2.forEach(b => {
        const fin = b + 1;
        if (fin - inicio < M) {
            if (sonoras[fin - 1]) {
                for (let i = inicio; i < fin; i++) {
                    f0[i] = 0;
                }
            }
        }
        inicio = fin;
    });

    // Eliminamos anomalías
    for (let i = 0; i < Nbloques; i++) {
        sonoras[i] = f0[i] > 0 ? 1 : 0;
    }
    sonoras[Nbloques] = sonoras[Nbloques - 1] ? 0 : 1;

    const cambio3 = [];
    for (let i = 1; i < sonoras.length; i++) {
        cambio3.push(sonoras[i] - sonoras[i - 1]);
    }
    const bloquecambio3 = cambio3.reduce((acc, val, idx) => {
        if (val !== 0) acc.push(idx);
        return acc;
    }, []);

    inicio = 0;
    bloquecambio3.forEach(b => {
        const fin = b + 1;
        if (sonoras[fin - 1]) {
            const Bloquesonoro = f0.slice(inicio, fin);
            const Bloquesonoro_e = [...Bloquesonoro.slice(D, 0).reverse(), ...Bloquesonoro, ...Bloquesonoro.slice(-2, -2 - D, -1)];
            const Bloquesonoro_convolved = convolve(Bloquesonoro_e, h);
            const Bloquesonoro_filtered = Bloquesonoro_convolved.slice(2 * D, -2 * D);
            const anomalies = Bloquesonoro_filtered.reduce((acc, val, idx) => {
                if (Math.abs(val - Bloquesonoro[idx]) > umbral) acc.push(idx);
                return acc;
            }, []);
            anomalies.forEach(a => {
                Bloquesonoro[a] = Bloquesonoro_filtered[a];
            });
            for (let i = inicio; i < fin; i++) {
                f0[i] = Bloquesonoro[i - inicio];
            }
        }
        inicio = fin;
    });

    return f0;
}

// Función de convolución
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

function encuentra_fi_espectrograma(X, fs, N, H, umbral=30, pre_max=3, post_max=3, pre_avg=3, post_avg=3, delta=0.01, wait=2) {
    const [nf, nt] = X.shape;
    const picos = numeric.rep([nf, nt], 0);
    const fi = numeric.rep([nf, nt], 0);
    const Xm = numeric.abs(X);
    const max = 20 * Math.log10(numeric.max(numeric.max(Xm)));
    const lmin = Math.pow(10, (max - umbral) / 20);

    const phi_1 = numeric.angle(X.sub(numeric.getRange(X, [null, [0, -2]])));
    const phi_2 = numeric.angle(X.sub(numeric.getRange(X, [null, [1, -1]])));
    const index_k = numeric.linspace(0, nf - 1).reshape([-1, 1]);
    const kappa = argprin(phi_2.sub(phi_1).sub(2 * Math.PI * numeric.mul(index_k, H).div(N)));
    let F_coef_IF = numeric.mul(numeric.add(numeric.mul(2 * Math.PI, index_k), kappa), fs).div(2 * Math.PI * H);

    // Extendemos F_coef_IF copiando la última columna para obtener las mismas dimensiones que X
    F_coef_IF = numeric.hstack(F_coef_IF, numeric.rep([F_coef_IF.length, 1], F_coef_IF.get(-1)));

    for (let t = 0; t < nt; t++) {
        const peaks = librosa.util.peak_pick(Xm.pick(null, t), { pre_max, post_max, pre_avg, post_avg, delta, wait });
        if (peaks.length !== 0) {
            const peaku = numeric.where(Xm.pick(peaks, t).gt(lmin));
            if (peaku.length !== 0) {
                numeric.set(picos, [peaks[peaku], t], Xm.pick(peaks, t));
                numeric.set(fi, [peaks[peaku], t], F_coef_IF.pick(peaks[peaku], t));
            }
        }
    }

    return [picos, fi];
}

// Función para generar las frecuencias de las notas musicales en una escala
function generarFrecuenciasNotas(fmin, fmax) {
    const A4 = 440; // Frecuencia de la nota A4
    const notas = [];
    let f = fmin;
    while (f <= fmax) {
        notas.push(f);
        f *= Math.pow(2, 1/12); // Incrementar por un semitono
    }
    return notas;
}

// Función para encontrar la frecuencia más cercana en la escala musical
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

// Modificar trayectoriaPitch_stft para cuantizar a las notas más cercanas
function trayectoriaPitch_stft(x, fs, NFFT, H, fmax, umbral=30, pre_max=3, post_max=3, pre_avg=3, post_avg=3, delta=0.01, wait=2) {
    const noverlap = NFFT - H;
    const [f, t, Zxx] = signal.stft(x, fs, NFFT, noverlap);
    const kmax = Math.ceil(fmax * NFFT / fs);
    const [picos, fi] = encuentra_fi_espectrograma(Zxx.getRange([0, kmax], null), fs, NFFT, H, umbral, pre_max, post_max, pre_avg, post_avg, delta, wait);
    const [nk, nn] = fi.shape;
    const fpitch = numeric.rep([nn], 0);
    for (let n = 0; n < nn; n++) {
        const k = numeric.argwhere(fi.pick(null, n).gt(0));
        if (k.length > 0) {
            fpitch[n] = numeric.min(fi.pick(k, n));
        }
    }
    let f0 = segmentaf0(fpitch);

    // Generar la lista de frecuencias de notas musicales entre el rango mínimo y máximo de f0
    const fmin = Math.min(...f0.filter(v => v > 0)); // Obtener el valor mínimo de f0 que no sea cero
    const fnotas = generarFrecuenciasNotas(fmin, fmax);

    // Cuantizar f0 a la frecuencia más cercana en la escala musical
    f0 = f0.map(f => f > 0 ? frecuenciaMasCercana(f, fnotas) : 0);

    const n = numeric.argwhere(f0.gt(0)); // Bloques con Pitch válido
    const a = numeric.rep([f0.length], 0);
    const indices_k = numeric.rint(numeric.mul(f0.pick(n), NFFT / fs)).toInt();
    numeric.set(a, n, numeric.abs(Zxx.get(indices_k, n))); // Amplitud asociada a cada frecuencia fundamental

    const pfref = numeric.rep([f0.length], 0);
    numeric.set(pfref, n, numeric.rint(numeric.mul(12, numeric.log2(numeric.div(f0.pick(n), 440))).add(69)));

    const f0nota = numeric.rep([f0.length], 0);
    numeric.set(f0nota, n, numeric.mul(440, numeric.pow(2, numeric.div(numeric.sub(pfref.pick(n), 69), 12)))); // Calculamos las frecuencias nominales de las notas musicales más cercanas al pitch

    return [f0, f0nota, a];
}

function modificaPitch(xin, fs, B, H, f0, f02, fmin) {
    const pitchvalido = numeric.argwhere(numeric.isfinite(f02));
    const f02min = numeric.min(numeric.get(f02, pitchvalido));
    if (f02min < fs / B) {
        console.log('Para los valores de pitch introducidos, el tamaño de bloque debe ser mayor que', fs / f02min);
        return;
    }
    fmin = Math.max(fmin, fs / B);
    const alfamax = numeric.max(numeric.div(f02.get(pitchvalido), f0.get(pitchvalido)));

    const x = numeric.rep([Math.floor((f0.length) * H + (1 + alfamax) * B)], 0);
    numeric.set(x, [numeric.range(0, xin.length)], xin);

    const A_corrected = numeric.rep([x.length], 0);
    const alfa = numeric.rep([f0.length], 0);
    let max_acorr_shift = 0;
    let max_acorr_amp = 0;

    for (let bloque = 0; bloque < f0.length; bloque++) {
        const A = numeric.getRange(x, [bloque * H, bloque * H + B]);
        const tbloque = numeric.linspace(bloque * H, bloque * H + B, B).div(fs);
        let tbloque_i = numeric.clone(tbloque);
        let A_i = numeric.clone(A);

        if (!numeric.isnan(f0.get(bloque))) {
            alfa[bloque] = f02.get(bloque) / f0.get(bloque);
            const Nperiod1 = Math.ceil(1 / (f0.get(bloque) / fs));
            const Nperiod = Math.ceil(1 / (f02.get(bloque) / fs));
            let tbloque2 = numeric.clone(tbloque);

            tbloque_i = tbloque.map(t => numeric.mean(tbloque) + (t - numeric.mean(tbloque)) * alfa[bloque]);

            if (alfa[bloque] > 1) {
                tbloque2 = numeric.linspace(numeric.min(tbloque_i), numeric.max(tbloque_i) + 1 / fs, Math.ceil((numeric.max(tbloque_i) - numeric.min(tbloque_i)) * fs) + 1);
                A_i = numeric.rep([tbloque2.length], 0);
                const exceso = Math.ceil((tbloque2.length - B) / 2);

                const periodo0 = numeric.getRange(A, [0, Nperiod1]);
                if (B < Nperiod1) {
                    console.log('Tamaño de bloque pequeño para los valores de pitch introducidos');
                    return;
                }
                const veces = Math.ceil(exceso / Nperiod1);
                const resto = Nperiod1 - (exceso % Nperiod1);
                const a_exceso = numeric.tile(periodo0, veces);
                numeric.set(A_i, [numeric.range(0, exceso)], numeric.get(a_exceso, [resto]));

                numeric.set(A_i, [numeric.range(exceso, exceso + B)], A);

                const periodof = numeric.getRange(A, [-Nperiod1, null]);
                const a_exceso2 = numeric.tile(periodof, veces);
                numeric.set(A_i, [numeric.range(exceso + B, null)], numeric.get(a_exceso2, [0, A_i.length - (exceso + B)]));
            }

            const f = numeric.interp1d(tbloque2, A_i);
            const Ainterp = numeric.map(tbloque_i, t => f(t));
            if (bloque === 0) {
                numeric.set(A_corrected, [numeric.range(bloque * H, bloque * H + B)], Ainterp);
            } else {
                const Achunk = numeric.getRange(Ainterp, [0, Nperiod]);
                const factor = numeric.sum(numeric.abs(Achunk)) ** 2;

                if (!((alfa[bloque - 1] === 1 || alfa[bloque] === 1))) {
                    max_acorr_amp = 0;
                    max_acorr_shift = 0;
                    const minrango = -Math.round(Nperiod / 2);
                    const maxrango = minrango + Nperiod;
                    for (let Nshift = minrango; Nshift < maxrango; Nshift++) {
                        const acorr = 1 - numeric.sum(numeric.abs(numeric.sub(Achunk, numeric.getRange(A_corrected, [bloque * H + Nshift, bloque * H + Nshift + Nperiod])))) / factor;
                        if (acorr > max_acorr_amp) {
                            max_acorr_amp = acorr;
                            max_acorr_shift = Nshift;
                        }
                    }
                }

                const n_ini = numeric.argmin(numeric.abs(numeric.sub(Achunk, numeric.getRange(A_corrected, [bloque * H + max_acorr_shift, bloque * H + max_acorr_shift + Nperiod]))));
                numeric.set(A_corrected, [numeric.range(bloque * H + max_acorr_shift + n_ini, bloque * H + max_acorr_shift + B)], numeric.get(Ainterp, [n_ini, null]));
            }
        } else {
            alfa[bloque] = 1;
            const Nperiod = Math.ceil(fs / fmin);
            const Ainterp = numeric.getRange(A, [0, Nperiod]);
            const factor = numeric.sum(numeric.abs(Ainterp)) ** 2;
            const Achunk = numeric.getRange(Ainterp, [0, Nperiod]);
            if (bloque === 0) {
                numeric.set(A_corrected, [numeric.range(bloque * H, bloque * H + B)], numeric.get(Ainterp, [0, B]));
            } else {
                max_acorr_shift = 0;
                max_acorr_amp = 0;
                for (let Nshift = -Math.round(Nperiod / 2); Nshift < Math.round(Nperiod / 2); Nshift++) {
                    const acorr = 1 - numeric.sum(numeric.abs(numeric.sub(Achunk, numeric.getRange(A_corrected, [bloque * H + Nshift, bloque * H + Nshift + Nperiod])))) / factor;
                    if (acorr > max_acorr_amp) {
                        max_acorr_amp = acorr;
                        max_acorr_shift = Nshift;
                    }
                }
                numeric.set(A_corrected, [numeric.range(bloque * H + max_acorr_shift, bloque * H + max_acorr_shift + B)], numeric.get(Ainterp, [Math.abs(max_acorr_shift), null]));
            }
        }
    }
    return A_corrected;
}

function autotune(audioBuffer) {
    // Parámetros para el cálculo del espectrograma
    const fs = 44100; // Frecuencia de muestreo del audio
    const NFFT = 2048; // Tamaño de la ventana de FFT
    const H = 512; // Paso entre ventanas
    const fmax = 2000; // Frecuencia máxima considerada para el análisis

    // Obtener la señal de audio del buffer
    const audioData = audioBuffer.getChannelData(0);

    // Obtener la trayectoria del pitch
    const [f0, f0nota, a] = trayectoriaPitch_stft(audioData, fs, NFFT, H, fmax);

    // Aplicar modificación de pitch
    const B = 1024; // Tamaño de bloque para la modificación de pitch
    const fmin = 100; // Frecuencia mínima para la modificación de pitch
    const A_corrected = modificaPitch(audioData, fs, B, H, f0, f0nota, fmin);

    // Crear un nuevo buffer de audio con la señal corregida
    const audioContext = new AudioContext();
    const newBuffer = audioContext.createBuffer(1, A_corrected.length, fs);
    const newData = newBuffer.getChannelData(0);
    newData.set(A_corrected);

    return newBuffer;
}
