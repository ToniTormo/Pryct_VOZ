
//import "http://reverbjs.org/reverb.js"
// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
const soundClips = document.querySelector("#indice");
const audioElement = document.getElementById('repro'); // Obtener el elemento <audio>
var audio = document.getElementById('repro');
let ctx;
var sourceNode;
var Puerta_ruido;
var retardo;
var feed;
var chor_delays = [];
var chor_gains=[];
var grabando = false;
// NOTAS --> hacer un doc/poner las explicaciones de cada boton y cada cosa 
//  



// Función para iniciar la grabación
async function startRecording() {
  audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (audioStream) {

    const constraints = { audio: true };
    let chunks = [];
    
    //let onSuccess = function (stream) {
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
    // document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    document.getElementById('downloadButton').disabled = true

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioUrl = window.URL.createObjectURL(blob);
      audioElement.src = audioUrl;
    
      //elim_ruido();
      //chorus();
      eco();
      // aplicar_efectos();
      

      
      // Establecer el enlace de descarga en el botón
      document.getElementById('downloadButton').onclick = function() {
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = audioUrl;
          a.download = 'grabacion.wav';
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(audioUrl);
          document.body.removeChild(a);
    };
    };

  } else {
    console.log("MediaDevices.getUserMedia() not supported on your browser!");
  }
  
}

// Función para detener la grabación
function stopRecording() {
  mediaRecorder.stop();
  audioStream.getTracks().forEach(track => track.stop());
    // Actualizar UI
  document.getElementById('startButton').disabled = false;
  document.getElementById('stopButton').disabled = true;
  document.getElementById('downloadButton').disabled = false; // Habilitar el botón de descarga
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

// // Detener grabación al hacer clic en el botón "Detener grabación"
// document.getElementById('stopButton').addEventListener('click', stopRecording);

//hola soy carlos esto probablemente no funcione pero lo dejo por aquí a ver si cuela
function elim_ruido(){

  Puerta_ruido = ctx.createDynamicsCompressor();
  Puerta_ruido.threshold.value = -1; // Umbral en dB de -100 a 0 
  Puerta_ruido.knee.value = 3;      // Rango de transición suave
  Puerta_ruido.ratio.value = 20;     // Relación de compresión
  Puerta_ruido.attack.value = 0.003; // Tiempo de ataque en segundos
  Puerta_ruido.release.value = 0.25; // Tiempo de liberación en segundos
  
  sourceNode.connect(ctx.createGain().connect(Puerta_ruido));
  Puerta_ruido.connect(ctx.destination);
   
}

function eco(){

  // Crear nodo de efecto de eco (retardo)

  retardo = ctx.createDelay();
  retardo.delayTime.value = document.getElementById("valueEcho").value; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  feed = ctx.createGain();
  feed.gain.value = document.getElementById("valueEcho").value/2; // Nivel de retroalimentación (0 a 1)
  sourceNode.disconnect();
  //Conectar los nodos: audioSrc -> retardo -> salida de audio
  sourceNode.connect(retardo);
  retardo.connect(feed);
  feed.connect(retardo);
  retardo.connect(ctx.destination);
  
  
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

  // Aplicar la modulación al tiempo de retardo del nodo modulado
  var currentTime = ctx.currentTime;
  chor_delays.forEach(function(delay) {
    delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth,modFreq,currentTime), currentTime);
  });



  // Conectar los nodos de retardo al destino de audio
  chor_delays.forEach(function(delay) {
    sourceNode.connect(delay);
  });
  sourceNode.connect(ctx.destination);

  for (var i = 0; i < chor_delays.length; i++) {
    chor_delays[i].connect(chor_gains[i])
  }
  chor_gains.forEach(function(gain) {
    gain.connect(ctx.destination);
  });

}

document.getElementById("play-pause").addEventListener('click', function(){
  //elim_ruido();
  //chorus();
  eco();
  // aplicar_efectos();
  if (audio.paused || audio.ended) {
    audio.play();

} else {
    audio.pause();

}
}
);
