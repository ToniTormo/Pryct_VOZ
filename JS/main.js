
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
// Crear efecto de eco con el tiempo ajustable
function createEchoDelayEffect(audioContext) {
    const delay = audioContext.createDelay(0.2); // Se inicializa con un valor de 0.2 segundos de retardo
    const dryNode = audioContext.createGain();
    const wetNode = audioContext.createGain();
    const mixer = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    delay.delayTime.value = 0.75;
    dryNode.gain.value = 1; // señal sin efecto
    wetNode.gain.value = 1; // señal con efecto 
    // 
    filter.frequency.value = 1100;
    filter.type = "highpass";

    delay.connect(wetNode);
    wetNode.connect(filter);
    filter.connect(delay);

    dryNode.connect(mixer);
    wetNode.connect(mixer);
    mixer.connect(audioContext.destination);

    return {
        setDelayTime(time) {
            delay.delayTime.value = time;
        }
    };
}

// Agregar evento de escucha al slider de tiempo de eco
document.getElementById('valueEco').addEventListener('input', function() {
    const maxDelaySeconds = 2; // Máximo de 2 segundos
    const delayTime = parseFloat(this.value) / 100; // Convertir el valor del slider a un número entre 0 y 1
    const time = delayTime * maxDelaySeconds;
    echoDelay.setDelayTime(time);
});


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
      //audioElement.setAttribute("controls", "");
      //audioElement.controls = true;
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioUrl = window.URL.createObjectURL(blob);
      audioElement.src = audioUrl;
      reverb()
      //console.log("recorder stopped");
      
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
    //};
  
    //audioStream(constraints).then(onSuccess, onError);
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



// function impulseResponse(duration,decay) {
//   var length = context.sampleRate * duration
//   var impulse = context.createBuffer(2,length,context.sampleRate)
//   var IR = impulse.getChannelData(0)
//   for (var i=0;i<length;i++) IR[i] = (2*Math.random()-1)*Math.pow(1-i/length,decay)
//   return impulse
// }


async function reverb() {
  // sourceNode.disconnect()
  // // Crear un nodo de convolución
  // // Crear un filtro bi-quad para la reverberación
  // var reverbFilter = ctx.createBiquadFilter();
  // reverbFilter.type = 'bandpass'; // Puedes ajustar el tipo de filtro según tus necesidades
  // reverbFilter.frequency.value = 1000; // Puedes ajustar la frecuencia de corte del filtro. Que frecuencias se ven afectadas por el reverb
  // reverbFilter.Q.value = 100; // Puedes ajustar la calidad del filtro. Es como la resonancia del reverb. De 0.1 a 100

  // // Conectar nodos
  // sourceNode.connect(reverbFilter);
  // reverbFilter.connect(ctx.destination);
  let delays = [0.1, 0.2, 0.3, 0.4, 0.5]; // Tiempos de retardo en segundos
  let delayNodes = delays.map(delayTime => {
      let delayNode = ctx.createDelay(delayTime);
      return delayNode;
  });

  // Crear nodos de realimentación (Ganancias)
  let feedbackGains = delayNodes.map(delayNode => {
      let feedbackGain = ctx.createGain();
      feedbackGain.gain.value = 0.5; // Ajusta el nivel de realimentación
      return feedbackGain;
  });

  // Conectar los nodos en serie (source -> delays -> feedback -> destination)
  sourceNode.connect(delayNodes[0]);

  for (let i = 0; i < delayNodes.length; i++) {
      let nextIndex = (i + 1) % delayNodes.length;
      delayNodes[i].connect(feedbackGains[i]);
      feedbackGains[i].connect(delayNodes[nextIndex]);
  }

  // Conectar la última realimentación al destino
  feedbackGains[feedbackGains.length - 1].connect(ctx.destination);

  // Conectar nodo fuente al primer retardo
  sourceNode.connect(delayNodes[0]);
}



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