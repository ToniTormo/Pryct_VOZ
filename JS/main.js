
//import "http://reverbjs.org/reverb.js"
// Variables globales
let audioStream;
let audioRecorder;
let mediaRecorder;
const soundClips = document.querySelector("#indice");
const audioElement = document.getElementById('repro'); // Obtener el elemento <audio>

let ctx;
var sourceNode;
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
    document.getElementById('startButton').disabled = true;
    document.getElementById('stopButton').disabled = false;
    document.getElementById('downloadButton').disabled = true

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioUrl = window.URL.createObjectURL(blob);
      audioElement.src = audioUrl;
      //reverb()
      eco();
      elim_ruido();

      
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


// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', startRecording);

// Detener grabación al hacer clic en el botón "Detener grabación"
document.getElementById('stopButton').addEventListener('click', stopRecording);

//hola soy carlos esto probablemente no funcione pero lo dejo por aquí a ver si cuela
function elim_ruido(){

  const audioContext = new AudioContext();
  const noiseGateNode = audioContext.createDynamicsCompressor();
  noiseGateNode.threshold.value = -50; // Umbral en dB
  noiseGateNode.knee.value = 40;      // Rango de transición suave
  noiseGateNode.ratio.value = 12;     // Relación de compresión
  noiseGateNode.attack.value = 0.003; // Tiempo de ataque en segundos
  noiseGateNode.release.value = 0.25; // Tiempo de liberación en segundos
  
  audioSource.connect(noiseGateNode);
  noiseGateNode.connect(audioContext.destination);
   
}



function eco(){

  // Crear nodo de efecto de eco (DelayNode)

  var delayNode = ctx.createDelay();
  delayNode.delayTime.value = 2; // Tiempo de retardo en segundos (de momento va de 0 a 1)
  var feedbackGain = ctx.createGain();
  feedbackGain.gain.value = 0.5; // Nivel de retroalimentación (0 a 1)
  sourceNode.disconnect();
  // Conectar los nodos: audioSrc -> delayNode -> salida de audio
  sourceNode.connect(delayNode);
  delayNode.connect(feedbackGain);
  feedbackGain.connect(delayNode);
  delayNode.connect(ctx.destination);
  // Reproducir el audio
  
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
//   let delayNodes = delays.map(delayTime => {
//       let delayNode = ctx.createDelay(delayTime);
//       return delayNode;
//   });

//   // Crear nodos de realimentación (Ganancias)
//   let feedbackGains = delayNodes.map(delayNode => {
//       let feedbackGain = ctx.createGain();
//       feedbackGain.gain.value = 0.5; // Ajusta el nivel de realimentación
//       return feedbackGain;
//   });

//   // Conectar los nodos en serie (source -> delays -> feedback -> destination)
//   sourceNode.connect(delayNodes[0]);

//   for (let i = 0; i < delayNodes.length; i++) {
//       let nextIndex = (i + 1) % delayNodes.length;
//       delayNodes[i].connect(feedbackGains[i]);
//       feedbackGains[i].connect(delayNodes[nextIndex]);
//   }

//   // Conectar la última realimentación al destino
//   feedbackGains[feedbackGains.length - 1].connect(ctx.destination);

//   // Conectar nodo fuente al primer retardo
//   sourceNode.connect(delayNodes[0]);
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

// Para el reberb hay que tener como unas salas definidas --> se puede hacer con el reco realimentado configurando el eco con el retardo  la amplitud. 
// sala virtual --> filtrado 
// vamos a tener que cambiar la interfaz 
// el API TIENE TODAS LAS CHINGADAS FUNCIONES NO HAY QUE QUEMARSE LA CABEZAAAA!!!!!!! 
