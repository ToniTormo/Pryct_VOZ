
//import "http://reverbjs.org/reverb.js"
// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
const soundClips = document.querySelector("#indice");
const audioElement = document.getElementById('repro'); // Obtener el elemento <audio>

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
    
      elim_ruido();
      chorus();
      eco();
      aplicar_efectos();
      

      
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
  Puerta_ruido.knee.value = 40;      // Rango de transición suave
  Puerta_ruido.ratio.value = 12;     // Relación de compresión
  Puerta_ruido.attack.value = 0.003; // Tiempo de ataque en segundos
  Puerta_ruido.release.value = 0.25; // Tiempo de liberación en segundos
  
  // sourceNode.connect(Puerta_ruido);
  // Puerta_ruido.connect(ctx.destination);
   
}

function eco(){

  // Crear nodo de efecto de eco (retardo)

  retardo = ctx.createDelay();
  retardo.delayTime.value = 0.6; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  feed = ctx.createGain();
  feed.gain.value = 0.5; // Nivel de retroalimentación (0 a 1)
  //sourceNode.disconnect();
  // Conectar los nodos: audioSrc -> retardo -> salida de audio
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

function chorus(){

  // Parámetros de modulación
  var modFreq = 0.2; // Frecuencia de modulación en Hz
  var modDepth = 0.02; // Profundidad de modulación en segundos (ajuste según sea necesario)
  // Crear nodos de retardo para las voces moduladas
  var numVoices = 5; // Número de voces moduladas
  
  for (var i = 0; i < numVoices; i++) {
      var delayModulated = ctx.createDelay();
      var gm = ctx.createGain();
      gm.gain.value=0.4 + Math.random() * 0.4;
      delayModulated.delayTime.value = Math.random() * 0.1; // Tiempo de retardo inicial para cada voz modulada
      chor_delays.push(delayModulated);
      chor_gains.push(gm);
  }

  // Conectar nodo de retardo principal al inicio
  //sourceNode.disconnect();
  //sourceNode.connect(delayMain);


  // chor_delays.forEach(function(delay) {
  //   sourceNode.connect(delay);
  // });

  // Aplicar la modulación al tiempo de retardo del nodo modulado
  var currentTime = ctx.currentTime;
  chor_delays.forEach(function(delay) {
    delay.delayTime.setValueAtTime(delay.delayTime.value + modulationFunction(modDepth,modFreq,currentTime), currentTime);
  });


  // Conectar los nodos de retardo al destino de audio
  // sourceNode.connect(ctx.destination);

  // for (var i = 0; i < chor_delays.length; i++) {
  //   chor_delays[i].connect(chor_gains[i])
  // }
  // chor_gains.forEach(function(gain) {
  //   gain.connect(ctx.destination);
  // });

}
// function impulseResponse(duration,decay) {
//   var length = context.sampleRate * duration
//   var impulse = context.createBuffer(2,length,context.sampleRate)
//   var IR = impulse.getChannelData(0)
//   for (var i=0;i<length;i++) IR[i] = (2*Math.random()-1)*Math.pow(1-i/length,decay)
//   return impulse
// }


// async function reverb() {
//   // sourceNode.disconnect()
//   // // Crear un nodo de convolución
//   // // Crear un filtro bi-quad para la reverberación
//   // var reverbFilter = ctx.createBiquadFilter();
//   // reverbFilter.type = 'bandpass'; // Puedes ajustar el tipo de filtro según tus necesidades
//   // reverbFilter.frequency.value = 1000; // Puedes ajustar la frecuencia de corte del filtro. Que frecuencias se ven afectadas por el reverb
//   // reverbFilter.Q.value = 100; // Puedes ajustar la calidad del filtro. Es como la resonancia del reverb. De 0.1 a 100

//   // // Conectar nodos
//   // sourceNode.connect(reverbFilter);
//   // reverbFilter.connect(ctx.destination);
//   let delays = [0.1, 0.2, 0.3, 0.4, 0.5]; // Tiempos de retardo en segundos
//   let retardos = delays.map(delayTime => {
//       let retardo = ctx.createDelay(delayTime);
//       return retardo;
//   });

//   // Crear nodos de realimentación (Ganancias)
//   let feeds = retardos.map(retardo => {
//       let feed = ctx.createGain();
//       feed.gain.value = 0.5; // Ajusta el nivel de realimentación
//       return feed;
//   });

//   // Conectar los nodos en serie (source -> delays -> feedback -> destination)
//   sourceNode.connect(retardos[0]);

//   for (let i = 0; i < retardos.length; i++) {
//       let nextIndex = (i + 1) % retardos.length;
//       retardos[i].connect(feedbackGains[i]);
//       feedbackGains[i].connect(retardos[nextIndex]);
//   }

//   // Conectar la última realimentación al destino
//   feedbackGains[feedbackGains.length - 1].connect(ctx.destination);

//   // Conectar nodo fuente al primer retardo
//   sourceNode.connect(retardos[0]);
// }



// Función para aplicar el efecto de reverberación al audio
// async function reverb() {
//   try {
//       const audioBuffer = await cargar_imp("./Audio/Impulsos/church.mp3"); // Ruta al archivo local
//       const convolver = ctx.createConvolver();
//       convolver.buffer = audioBuffer;
//       audioRecorder.disconnect(); // Desconectar el audio original
//       audioRecorder.connect(convolver); // Conectar al convolver
//       convolver.connect(ctx.destination); // Conectar al destino final
//   } catch (error) {
//       console.error('Error applying reverb effect:', error);
//   }
// }


//audioElement.addEventListener('canplaythrough', reverb);

