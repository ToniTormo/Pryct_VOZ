
// Variables globales
let audioStream;
let audioContext;
let audioRecorder;
let mediaRecorder;
let audioPlayerNode;
let gainNode;

// Función para iniciar la grabación
async function startRecording() {
    try {

        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext({latencyHint: 'playback', sampleRate: 96000 });
        source = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.85;

        // Nodo de ganancia para ajustar el volumen
        gainNode = audioContext.createGain();

        //Crear Eco
        const echoDelay = createEchoDelayEffect(audioContext);

        // Conectar el nodo de la fuente de grabación al nodo de ganancia
        gainNode.oversample = "4x";
        source.connect(gainNode);
        //conectar eco
        echoDelay.placeBetween(gainNode, analyser);

        //conectar analizer
        analyser.connect(audioContext.destination);

        // Conectar el nodo de ganancia al nodo de grabación
        audioRecorder = audioContext.createMediaStreamDestination();
        source.connect(audioRecorder);

        // Conectar el nodo de ganancia a la salida del contexto de audio
        gainNode.connect(audioContext.destination);
        mediaRecorder = new MediaRecorder(audioRecorder.stream, { mimeType: 'audio/webm', audioBitsPerSecond : 256000 });
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start();

        // Actualizar UI
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
        document.getElementById('downloadButton').disabled = true; // Deshabilitar el botón de descarga
    } catch (error) {
        console.error('Error al iniciar la grabación:', error);
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

// Función para procesar los datos grabados
function handleDataAvailable(event) {
    const audioBlob = new Blob([event.data], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    
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
}

// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', startRecording);

// Detener grabación al hacer clic en el botón "Detener grabación"
document.getElementById('stopButton').addEventListener('click', stopRecording);


function createEchoDelayEffect(audioContext) {
    const delay = audioContext.createDelay(1);
    const dryNode = audioContext.createGain();
    const wetNode = audioContext.createGain();
    const mixer = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    delay.delayTime.value = 0.75;
    dryNode.gain.value = 1;
    wetNode.gain.value = 1;
    filter.frequency.value = 1100;
    filter.type = "highpass";
    return {
      placeBetween(inputNode, outputNode) {
        inputNode.connect(delay);
        delay.connect(wetNode);
        wetNode.connect(filter);
        filter.connect(delay);

        inputNode.connect(dryNode);
        dryNode.connect(mixer);
        wetNode.connect(mixer);
        mixer.connect(outputNode);
      },
    };
  }