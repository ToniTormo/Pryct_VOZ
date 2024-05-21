
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

// NOTAS --> hacer un doc/poner las explicaciones de cada boton y cada cosa 


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
      //sourceNode = ctx.createBufferSource();
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
    
      elim_ruido();
      chorus();
      eco();
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
  //document.getElementById('stopButton').disabled = true;
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


function elim_ruido(){

  Puerta_ruido = ctx.createDynamicsCompressor();
  //Puerta_ruido.threshold.value = document.getElementById("valueNoise").value; // Umbral en dB de -100 a 0 
  Puerta_ruido.threshold.value = -1; // Umbral en dB de -100 a 0 
  Puerta_ruido.knee.value = 0;      // Rango de transición suave
  Puerta_ruido.ratio.value = 1;     // Relación de compresión
  Puerta_ruido.attack.value = 1.5; // Tiempo de ataque en segundos
  Puerta_ruido.release.value = 1.5; // Tiempo de liberación en segundos
  Puerta_ruidooff = offlineContext.createDynamicsCompressor();
  //Puerta_ruido.threshold.value = document.getElementById("valueNoise").value; // Umbral en dB de -100 a 0 
  Puerta_ruidooff.threshold.value = -1; // Umbral en dB de -100 a 0 
  Puerta_ruidooff.knee.value = 0;      // Rango de transición suave
  Puerta_ruidooff.ratio.value = 1;     // Relación de compresión
  Puerta_ruidooff.attack.value = 1.5; // Tiempo de ataque en segundos
  Puerta_ruidooff.release.value = 1.5; // Tiempo de liberación en segundos
  
  // sourceNode.connect(ctx.createGain().connect(Puerta_ruido));
  // Puerta_ruido.connect(ctx.destination);
   
}

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

function aplicar_efectos(){
  //desconectamos
  sourceNode.disconnect();
  //Eliminacion de ruido
  sourceNode.connect(Puerta_ruido);
  //Chorus
  chor_delays.forEach(function(delay) {
    Puerta_ruido.connect(delay);
  });
  Puerta_ruido.connect(retardo);
  for (var i = 0; i < chor_delays.length; i++) {
    chor_delays[i].connect(chor_gains[i])
  }
  chor_gains.forEach(function(gain) {
    gain.connect(retardo);
  });
  //Eco
  retardo.connect(feed);
  feed.connect(retardo);
  retardo.connect(ctx.destination);
  
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
  //Eliminacion de ruido
  //Chorus
  Puerta_ruido.disconnect();
  chor_delays.forEach(function(delay) {
    delay.disconnect();
  });
  // Puerta_ruido.connect(retardo);
  // for (var i = 0; i < chor_delays.length; i++) {
  //   chor_delays[i].connect(chor_gains[i])
  // }
  chor_gains.forEach(function(gain) {
    gain.disconnect();
  });
  //Eco
  retardo.disconnect();
  feed.disconnect();
  //retardo.connect(ctx.destination);
  chor_delays = [];
  chor_gains=[];
}
document.getElementById("play-pause").addEventListener('click', function(){
  desconectar();
  elim_ruido();
  chorus();
  eco();
  aplicar_efectos();
  if (audioElement.paused || audioElement.ended) {
    audioElement.play();

} else {
    audioElement.pause();

}
}
);

async function render(){
  desconectar();
  offlineSource='';
  offlineSource = offlineContext.createBufferSource();
  offlineSource.buffer = audioBuffer;
  //desconectamos
  offlineSource.disconnect();
  //Eliminacion de ruido
  offlineSource.connect(Puerta_ruidooff);
  //Chorus
  chor_delaysoff.forEach(function(dly) {
    Puerta_ruidooff.connect(dly);
  });
  Puerta_ruidooff.connect(retardooff);
  for (var i = 0; i < chor_delaysoff.length; i++) {
    chor_delaysoff[i].connect(chor_gainsoff[i])
  }
  chor_gainsoff.forEach(function(gain) {
    gain.connect(retardooff);
  });
  //Eco
  retardooff.connect(feedoff);
  feedoff.connect(retardooff);
  retardooff.connect(offlineContext.destination);

  offlineSource.start();
  const renderedBuffer = await offlineContext.startRendering();

  // Convertir el buffer renderizado a WAV
  wavBlob = bufferToWave(renderedBuffer);
  aplicar_efectos();
  //Desconectar todo
  
  offlineSource.disconnect();
  //Chorus
  
  Puerta_ruidooff.disconnect();

  for (var i = 0; i < chor_delays.length; i++) {
    chor_delaysoff[i].disconnect()
  }
  chor_gainsoff.forEach(function(gain) {
    gain.disconnect();
  });
  //Eco
  retardooff.disconnect();
  feedoff.disconnect();
  chor_delays = [];
  chor_gains=[];

}


async function aplicarAutotune() {
  // Obtener el audio del elemento <audio> y convertirlo a un buffer
  const response = await fetch(audioElement.src);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  // Llamar a la función de autotune definida en autotune.js
  const audioProcesado = autotune(audioBuffer); // Esta función es hipotética, reemplázala con la función real de autotune de autotune.js si tiene un nombre diferente

  // Crear un nodo para reproducir el audio procesado
  const processedSource = ctx.createBufferSource();
  processedSource.buffer = audioProcesado;
  processedSource.connect(ctx.destination);

  // Reproducir el audio procesado
  processedSource.start();
}

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