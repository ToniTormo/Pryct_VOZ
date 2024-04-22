
// Variables globales
let audioStream;
let audioContext;
let audioRecorder;
let mediaRecorder;
let audioPlayerNode;
let gainNode;
let echoDelay;

// Crear efecto de eco con el tiempo ajustable
function createEchoDelayEffect(audioContext) {
    const delay = audioContext.createDelay(0.2); // Se inicializa con un valor de 0.2 segundos de retardo
    const dryNode = audioContext.createGain();
    const wetNode = audioContext.createGain();
    const mixer = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    delay.delayTime.value = 0.75;
    dryNode.gain.value = 1;
    wetNode.gain.value = 1;
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
    try {

        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext({latencyHint: 'playback', sampleRate: 96000 });
        source = audioContext.createMediaStreamSource(audioStream);
        const analyser = audioContext.createAnalyser();
        analyser.smoothingTimeConstant = 0.85;

        // Nodo de ganancia para ajustar el volumen
        gainNode = audioContext.createGain();


        // Conectar el nodo de la fuente de grabación al nodo de ganancia
        gainNode.oversample = "4x";
        source.connect(gainNode);

        //conectar eco
        //echoDelay.placeBetween(gainNode, analyser);

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

