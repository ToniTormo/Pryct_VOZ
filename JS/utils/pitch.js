const { convolve } = require('./effects');

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
            // keep the original extension logic from upstream (may look odd but preserves original behavior)
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

module.exports = {
    argprin,
    segmentaf0,
    generarFrecuenciasNotas,
    frecuenciaMasCercana
};
