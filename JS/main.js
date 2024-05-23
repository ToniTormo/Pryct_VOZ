
// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
const audioElement = document.getElementById('repro'); // Obtener el elemento reproductor
var audio = document.getElementById('repro');
let ctx;
var sourceNode;
var Puerta_ruido;
var retardo;
var feed;
var chor_delays = [];
var chor_gains=[];
var Puerta_ruidooff;
var retardooff;
var feedoff;
var chor_delaysoff = [];
var chor_gainsoff=[];
var grabando = false;
var audioUrl;
var offlineContext;
var offlineSource;
var audioBuffer;
var wavBlob;
var revdelay;
var revdelayoff;
var revgain;
var revgainoff;
var tune=false;
document.getElementById('startButton').disabled = false;

// Función para iniciar la grabación
async function startRecording() {
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (audioStream) {

    const constraints = { audio: true };
    let chunks = [];
    if (!ctx) {
      ctx = new AudioContext();

    }
    if (!sourceNode){
    sourceNode = ctx.createMediaElementSource(audioElement);
    }
 
    source = ctx.createMediaStreamSource(audioStream);
    audioRecorder = ctx.createMediaStreamDestination();
    source.connect(audioRecorder);
    mediaRecorder = new MediaRecorder(audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond : 256000 });
    mediaRecorder.start();

    document.getElementById('downloadButton').disabled = true

    mediaRecorder.ondataavailable = async function (e) {
      chunks.push(e.data);
      const blob = new Blob(chunks, {type: mediaRecorder.mimeType});
      const arrayBuffer = await blob.arrayBuffer();
      if (!audioBuffer){
        audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      }
      
      // Configuración de nodos de efectos
      sourceNode.buffer = audioBuffer;
      chunks = [];
      audioUrl = window.URL.createObjectURL(blob);
      audioElement.src = audioUrl;
      if (!offlineContext){ 
        offlineContext= new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate);
      }
      if (!offlineSource){
        offlineSource= offlineContext.createBufferSource();
      } 

      chorus();
      eco();
      reverb();
      aplicar_efectos();
      
    };

  } else {
    console.log("MediaDevices.getUserMedia() not supported on your browser!");
  }
  
}

// Función para detener la grabación
async function stopRecording() {
  mediaRecorder.stop();
  audioStream.getTracks().forEach(track => track.stop());
  // Actualizar UI
  document.getElementById('startButton').disabled = false;
  document.getElementById('downloadButton').disabled = false; // Habilitar el botón de descarga
  document.getElementById('stopButton').disabled=false;
  
}

function start_stop(){
  if (grabando == false){
    document.getElementById('startImg').src = "../img/cuadrado.png";
    startRecording();
    grabando = true;
  } else {
    document.getElementById('startImg').src = "../img/micro.png";
    stopRecording();
    grabando = false;
  }
}

// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', start_stop);

function eco(){

  // Crear nodo de efecto de eco (retardo)
  retardo = ctx.createDelay();
  retardo.delayTime.value = document.getElementById("valueEcho").value; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  feed = ctx.createGain();
  feed.gain.value = document.getElementById("valueEcho").value/2; // Nivel de retroalimentación (0 a 1)
  retardooff = offlineContext.createDelay();
  retardooff.delayTime.value = document.getElementById("valueEcho").value; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  feedoff = offlineContext.createGain();
  feedoff.gain.value = document.getElementById("valueEcho").value/2; // Nivel de retroalimentación (0 a 1)
  // sourceNode.disconnect();
  // //Conectar los nodos: audioSrc -> retardo -> salida de audio
  // sourceNode.connect(retardo);
  // retardo.connect(feed);
  // feed.connect(retardo);
  // retardo.connect(ctx.destination);
  
  
}

function reverb(){

  // Crear nodo de efecto de eco (retardo)

  revdelay = ctx.createDelay();
  revdelay.delayTime.value = 0.01; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  revgain = ctx.createGain();
  revgain.gain.value = document.getElementById("valueReverb").value; // Nivel de retroalimentación (0 a 1)
  revdelayoff = offlineContext.createDelay();
  revdelayoff.delayTime.value = 0.02; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  revgainoff = offlineContext.createGain();
  revgainoff.gain.value = document.getElementById("valueReverb").value/2; // Nivel de retroalimentación (0 a 1)
  // sourceNode.disconnect();
  // //Conectar los nodos: audioSrc -> retardo -> salida de audio
  // sourceNode.connect(retardo);
  // retardo.connect(feed);
  // feed.connect(retardo);
  // retardo.connect(ctx.destination);
  
  
}

function aplicar_efectos(){
  //desconectamos
  sourceNode.disconnect();
  //Chorus
  chor_delays.forEach(function(delay) {
    sourceNode.connect(delay);
  });
  sourceNode.connect(retardo);
  for (var i = 0; i < chor_delays.length; i++) {
    chor_delays[i].connect(chor_gains[i])
  }
  chor_gains.forEach(function(gain) {
    gain.connect(retardo);
  });
  //Eco
  retardo.connect(feed);
  feed.connect(retardo);
  retardo.connect(revdelay);
  //Reverb
  revdelay.connect(revgain);
  revgain.connect(revdelay);
  revdelay.connect(ctx.destination);
  
}

// Función de modulación
function modulationFunction(modDepth,modFreq,time) {
  return Math.sin(2 * Math.PI * modFreq * time) * modDepth;
}
//Chorus
function chorus(){

  // Parámetros de modulación
  var modFreq = 0.2; // Frecuencia de modulación en Hz
  var modDepth = 0.02; // Profundidad de modulación en segundos (ajuste según sea necesario)
  // Crear nodos de retardo para las voces moduladas
  var numVoices = document.getElementById("valueChorus").value; // Número de voces moduladas
  
  for (var i = 0; i < numVoices; i++) {
      var delayModulated = ctx.createDelay();
      var gm = ctx.createGain();
      gm.gain.value=0.4 + Math.random() * 0.4;
      delayModulated.delayTime.value = Math.random() * 0.1; // Tiempo de retardo inicial para cada voz modulada
      chor_delays.push(delayModulated);
      chor_gains.push(gm);
      
  }
  for (var i = 0; i < numVoices; i++) {
    var delayModulatedoff = offlineContext.createDelay();
    var gmoff = offlineContext.createGain();
    gmoff.gain.value=0.4 + Math.random() * 0.4;
    delayModulatedoff.delayTime.value = Math.random() * 0.1; // Tiempo de retardo inicial para cada voz modulada
    chor_delaysoff.push(delayModulatedoff);
    chor_gainsoff.push(gmoff);
}

  // Aplicar la modulación al tiempo de retardo del nodo modulado
  var currentTime = ctx.currentTime;
  chor_delays.forEach(function(delay) {
    delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth,modFreq,currentTime), currentTime);
  });
  chor_delaysoff.forEach(function(delay) {
    delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth,modFreq,currentTime), currentTime);
  });



  // Conectar los nodos de retardo al destino de audio
  // chor_delays.forEach(function(delay) {
  //   sourceNode.connect(delay);
  // });
  // sourceNode.connect(ctx.destination);

  // for (var i = 0; i < chor_delays.length; i++) {
  //   chor_delays[i].connect(chor_gains[i])
  // }
  // chor_gains.forEach(function(gain) {
  //   gain.connect(ctx.destination);
  // });

}

function desconectar(){
  //desconectamos
  sourceNode.disconnect();
  //Chorus
  chor_delays.forEach(function(delay) {
    delay.disconnect();
  });
  chor_gains.forEach(function(gain) {
    gain.disconnect();
  });
  //Eco
  retardo.disconnect();
  feed.disconnect();
  revdelay.disconnect();
  revgain.disconnect();
  chor_delays = [];
  chor_gains=[];
}
document.getElementById("play-pause").addEventListener('click', function(){
  desconectar();
  chorus();
  eco();
  reverb();
  aplicar_efectos();
  if (audioElement.paused || audioElement.ended) {
    audioElement.play();

} else {
    audioElement.pause();

}
}
);

///////////////////////////////////////////////////AUTOTUNE//////////////////////////////////////////////////////////////////////////////

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
function convolve(Bloquesonoro_e, h) {
  const result = [];
  const kernelSize = h.length;
  const signalSize = Bloquesonoro_e.length;

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

function peakPick(signal) {
let peaks = [];
for(let i = 1; i < signal.length - 1; i++) {
    if(signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
        peaks.push(i);
    }
}
return peaks;
}
////// funciones que eran de numeric pero al no usar node.js no se puede usar//////
function absMatrix(matrix) {
return matrix.map(row => row.map(Math.abs));
}

function rep(dimensions, value) {
let array = [];
for (let i = 0; i < dimensions[0]; i++) {
    array.push([]);
    for (let j = 0; j < dimensions[1]; j++) {
        array[i].push(value);
    }
}
return array;
}

function max(matrix) {
return Math.max(...matrix.flat());
}

function angle(complexNumber) {
return Math.atan2(complexNumber.imag, complexNumber.real);
}

function linspace(start, end, num) {
const step = (end - start) / (num - 1);
return Array.from({length: num}, (_, i) => start + (step * i));
}

function mul(matrix1, matrix2) {
return matrix1.map((row, i) => row.map((value, j) => value * matrix2[i][j]));
}

function add(matrix1, matrix2) {
return matrix1.map((row, i) => row.map((value, j) => value + matrix2[i][j]));
}

function div(matrix1, matrix2) {
return matrix1.map((row, i) => row.map((value, j) => value / matrix2[i][j]));
}

function where(condition) {
return condition.map((row, i) => row.map((value, j) => value ? [i, j] : null)).flat().filter(i => i);
}

function set(matrix, indices, values) {
indices.forEach(([i, j], k) => {
    matrix[i][j] = values[k];
});
return matrix;
}

function getRange(matrix, [rowRange, colRange]) {
const [rowStart, rowEnd] = rowRange;
const [colStart, colEnd] = colRange;
return matrix.slice(rowStart, rowEnd).map(row => row.slice(colStart, colEnd));
}

function hstack(matrix1, matrix2) {
return matrix1.map((row, i) => [...row, ...matrix2[i]]);
}

//////-----------------------------//////////////////
function encuentra_fi_espectrograma(X, fs, N, H, umbral=30, pre_max=3, post_max=3, pre_avg=3, post_avg=3, delta=0.01, wait=2) {
const nf = X.length; // número de filas
//const nt = X[0].length; // número de columnas
const picos = rep(nf, 0);
const fi = picos;
const Xm = absMatrix(X);
const max = 20 * Math.log10(Math.max((Math.max(Xm))));
const lmin = Math.pow(10, (max - umbral) / 20);

const phi_1 = angle(X.sub(getRange(X, [null, [0, -2]])));
const phi_2 = angle(X.sub(getRange(X, [null, [1, -1]])));
const index_k = linspace(0, nf - 1).reshape([-1, 1]);
const kappa = argprin(phi_2.sub(phi_1).sub(2 * Math.PI * mul(index_k, H).div(N)));
let F_coef_IF = mul(add(mul(2 * Math.PI, index_k), kappa), fs).div(2 * Math.PI * H);

// Extendemos F_coef_IF copiando la última columna para obtener las mismas dimensiones que X
F_coef_IF = hstack(F_coef_IF,rep([F_coef_IF.length, 1], F_coef_IF.get(-1)));

for (let t = 0; t < nf; t++) {
    const peaks = peakPick(Xm.pick(null, t));
    if (peaks.length !== 0) {
        const peaku = where(Xm.pick(peaks, t).gt(lmin));
        if (peaku.length !== 0) {
            set(picos, [peaks[peaku], t], Xm.pick(peaks, t));
            set(fi, [peaks[peaku], t], F_coef_IF.pick(peaks[peaku], t));
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

function fft(x) {
const N = x.length;
if (N <= 1) return x;
const even = [];
const odd = [];
x.forEach((val, i) => {
    if (i % 2) odd.push(val);
    else even.push(val);
});
const evenFFT = fft(even);
const oddFFT = fft(odd);
const T = new Array(N);
for (let k = 0; k < N / 2; k++) {
  const t = Math.PI * k / N;
  const wk = { real: Math.cos(t), imag: -Math.sin(t) };
  if (evenFFT[k] && oddFFT[k]) {
      T[k] = {
          real: evenFFT[k].real + wk.real * oddFFT[k].real - wk.imag * oddFFT[k].imag,
          imag: evenFFT[k].imag + wk.real * oddFFT[k].imag + wk.imag * oddFFT[k].real
      };
      T[k + N / 2] = {
          real: evenFFT[k].real - wk.real * oddFFT[k].real + wk.imag * oddFFT[k].imag,
          imag: evenFFT[k].imag - wk.real * oddFFT[k].imag - wk.imag * oddFFT[k].real
      };
  } }
return T;
}

function stft(signal, fs, NFFT, noverlap) {
// Crear una matriz para almacenar la STFT
let stft = [];

// Calcular la STFT
for (let i = 0; i < signal.length; i += noverlap) {
    // Obtener una ventana de NFFT muestras
    let window = signal.slice(i, i + NFFT);

    // Calcular la FFT de la ventana
    let fftResult = fft(window);

    // Almacenar la magnitud de la FFT en la matriz STFT
    stft.push(fftResult);
}

return stft;
}

// Modificar trayectoriaPitch_stft para cuantizar a las notas más cercanas
function trayectoriaPitch_stft(x, fs, NFFT, H, fmax, umbral=30, pre_max=3, post_max=3, pre_avg=3, post_avg=3, delta=0.01, wait=2) {
  const noverlap = NFFT - H;
  const [f, t, Zxx] = stft(x, fs, NFFT, noverlap);
  const kmax = Math.ceil(fmax * NFFT / fs);
  const [picos, fi] = encuentra_fi_espectrograma(Zxx.slice(0, kmax), fs, NFFT, H, umbral, pre_max, post_max, pre_avg, post_avg, delta, wait);
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
async function render(){
  desconectar();
  offlineSource='';
  offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = audioBuffer;
  //desconectamos
  offlineSource.disconnect();
  //Chorus
  chor_delaysoff.forEach(function(dly) {
    offlineSource.connect(dly);
  });
  offlineSource.connect(retardooff);
  for (var i = 0; i < chor_delaysoff.length; i++) {
    chor_delaysoff[i].connect(chor_gainsoff[i])
  }
  chor_gainsoff.forEach(function(gain) {
    gain.connect(retardooff);
  });
  //Eco
  retardooff.connect(feedoff);
  feedoff.connect(retardooff);
  retardooff.connect(revdelayoff);
  //Reverb
  revdelayoff.connect(revgainoff);
  revgainoff.connect(revdelayoff);
  revdelayoff.connect(offlineContext.destination);

  offlineSource.start();
  const renderedBuffer = await offlineContext.startRendering();
  if (tune==true){
    const newBuffer = autotune(renderedBuffer);
  }else{
    const newBuffer = renderedBuffer;
  }
  
    //playBuffer(newBuffer, audioContext);

  // Convertir el buffer renderizado a WAV
  wavBlob = bufferToWave(newBuffer);
  aplicar_efectos();

  //Desconectar todo
  offlineSource.disconnect();
  //Chorus
  
  //Puerta_ruidooff.disconnect();

  for (var i = 0; i < chor_delays.length; i++) {
    chor_delaysoff[i].disconnect()
  }
  chor_gainsoff.forEach(function(gain) {
    gain.disconnect();
  });
  //Eco
  retardooff.disconnect();
  feedoff.disconnect();

  revdelayoff.disconnect();
  revgainoff.disconnect();

  chor_delaysoff = [];
  chor_gainsoff=[];

}

// async function aplicarAutotune(arrayBuffer) {
// // Obtener el audio del elemento <audio> y convertirlo a un buffer
// //const response = await fetch(audioElement.src);
// const arrayBuffer = await response.arrayBuffer();
// const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

// // Llamar a la función de autotune definida en autotune.js
// const audioProcesado = autotune(audioBuffer); // Esta función es hipotética, reemplázala con la función real de autotune de autotune.js si tiene un nombre diferente

// // Crear un nodo para reproducir el audio procesado
// const processedSource = ctx.createBufferSource();
// processedSource.buffer = audioProcesado;
// processedSource.connect(ctx.destination);

// // Reproducir el audio procesado
// processedSource.start();
// }


// Event listener para el botón de aplicar autotune
//document.getElementById('boton_tune').addEventListener('click', aplicarAutotune);

document.getElementById('downloadButton').onclick = async function() {
  await render();
  audioUrl='';    
  const a = document.createElement('a');
  a.style.display = 'none';
  // const blob = new Blob(down, { type: mediaRecorder.mimeType });
  audioUrl = window.URL.createObjectURL(wavBlob);
  a.href = audioUrl;
  a.download = 'grabacion.wav';
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(audioUrl);
  document.body.removeChild(a);
  document.getElementById('downloadButton').disabled=true;
};

document.getElementById('boton_tune').onclick= async function(){
  
  if (tune==false){
    tune=true;
  }else{
    tune=false;
  }
}

function bufferToWave(abuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // Write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this demo)

  // Write interleaved data
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = sample * 32767.5; // scale to 16-bit signed int
      view.setInt16(pos, sample, true); // write 16-bit sample
      pos += 2;
    }
    offset++; // next source sample
  }
  return new Blob([buffer], { type: "audio/wav" });
}

