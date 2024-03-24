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
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        // Nodo de ganancia para ajustar el volumen
        gainNode = audioContext.createGain();

        // Conectar el nodo de la fuente de grabación al nodo de ganancia
        source.connect(gainNode);

        // Conectar el nodo de ganancia al nodo de grabación
        audioRecorder = audioContext.createMediaStreamDestination();
        gainNode.connect(audioRecorder);

        // Conectar el nodo de ganancia a la salida del contexto de audio
        gainNode.connect(audioContext.destination);

        mediaRecorder = new MediaRecorder(audioRecorder.stream);
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

// Control de volumen
function changeVolume(volume) {
    if (gainNode) {
        gainNode.gain.value = volume / 100;
    }
}

// Iniciar grabación al hacer clic en el botón "Comenzar grabación"
document.getElementById('startButton').addEventListener('click', startRecording);

// Detener grabación al hacer clic en el botón "Detener grabación"
document.getElementById('stopButton').addEventListener('click', stopRecording);

// Control de volumen al cambiar el deslizador
document.getElementById('volume').addEventListener('input', function() {
    changeVolume(this.value);
});
