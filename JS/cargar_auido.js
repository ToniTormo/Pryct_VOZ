const ctx = new AudioContext();
let audio;

fetch("Enlace audio")
    .then(data => data.arrayBuffer())
    .then(arrayBuffer => ctx.decodeAudioData(arrayBuffer))
    .then(decodedAudio => {
        audio=decodedAudio;
    });

function playback(){
    const play= ctx.createBufferSource();
    play.buffer=audio;
    play.connect(ctx.destination);
    play.start(ctx.currentTime);
}