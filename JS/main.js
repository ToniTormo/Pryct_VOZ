// Variables globales
let audioStream;
let audioContext;
let audioRecorder;
let mediaRecorder;
let audioPlayerNode;

// Función para iniciar la grabación
async function startRecording() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        // Nodo de ganancia para conectar la fuente de audio
        const gainNode = audioContext.createGain();

        // Conectar el nodo de la fuente de grabación al nodo de ganancia
        source.connect(gainNode);

        // Conectar el nodo de ganancia al nodo de grabación
        audioRecorder = audioContext.createMediaStreamDestination();
        gainNode.connect(audioRecorder);

        // Conectar el nodo de ganancia al nodo del reproductor
        audioPlayerNode = audioContext.createMediaElementSource(document.getElementById('audioPlayer'));
        gainNode.connect(audioContext.destination);

        mediaRecorder = new MediaRecorder(audioRecorder.stream);
        mediaRecorder.ondataavailable = handleDataAvailable;
        mediaRecorder.start();

        // Actualizar UI
        document.getElementById('startButton').disabled = true;
        document.getElementById('stopButton').disabled = false;
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
}

// Función para procesar los datos grabados
function handleDataAvailable(event) {
    const audioBlob = new Blob([event.data], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    document.getElementById('audioPlayer').src = audioUrl;
}

// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', startRecording);

// Detener grabación al hacer clic en el botón "Detener grabación"
document.getElementById('stopButton').addEventListener('click', stopRecording);
