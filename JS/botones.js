var audio = document.getElementById('repro');
var botonPlayPause = document.getElementById('play-pause');
// var botonMicro = document.getElementById('startButton');
var botonBases = document.getElementById('stopButton');
//var barraVolumen = document.getElementById('barra-volumen');
var estadoAudio = document.getElementById('estado-audio');
var imagenPlay = document.getElementById('playImg');
// var imagenMicro = document.getElementById('startImg');
var imagenBases = document.getElementById('stopImg');
var bases=document.getElementById("bases");
var base= document.getElementById("base");
botonPlayPause.addEventListener('click', function() {
    if (audio.paused || audio.ended) {
        imagenPlay.src = "../img/pausa2.png";
    } else {
        imagenPlay.src = "../img/play.png";
    }
});

// //cambiar botón de micrófono al pulsarlo
// botonMicro.addEventListener('click', function() {
//     if (imagenMicro.src = "../img/micro.png") {
//         imagenMicro.src = "../img/cuadrado.png";
//     } else {
//         imagenMicro.src = "../img/micro.png";
//     }
// });

//cambiar botón de play pause bases al pulsarlo
botonBases.addEventListener('click', function() {
    if (base.paused || base.ended) {
        imagenBases.src = "../img/pausa2.png";
        base.play();
    } else {
        imagenBases.src = "../img/play.png";
        base.pause(); 
    } 

});

// barraVolumen.addEventListener('input', function() {
//     miAudio.volume = this.value;
// });





audio.addEventListener('timeupdate', function() {
    var minutos = Math.floor(audio.currentTime / 60);
    var segundos = Math.floor(audio.currentTime % 60);
    var duracionMinutos = Math.floor(audio.duration / 60);
    var duracionSegundos = Math.floor(audio.duration % 60);
    
    if (segundos < 10) {
        segundos = '0' + segundos;
    }
    if (duracionSegundos < 10) {
        duracionSegundos = '0' + duracionSegundos;
    }
    
    estadoAudio.innerHTML = minutos + ':' + segundos + ' / ' + duracionMinutos + ':' + duracionSegundos;
});

bases.addEventListener('change',function(){
    var opcionSeleccionada = bases.options[bases.selectedIndex].value;
    switch (opcionSeleccionada) {
        case "Base 1":
            base.src="../Audio/Bases/Base1.wav";
            botonBases.disabled=false;
            break;
        case "Base 2":
            base.src="../Audio/Bases/Base2.wav"
            botonBases.disabled=false;
            break;
        case "Base 3":
            base.src="../Audio/Bases/Base3.wav"
            botonBases.disabled=false;
            break;
        default:
            botonBases.disabled=true;
            break;
    }
});