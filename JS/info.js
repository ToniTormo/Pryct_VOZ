const crearInfoBox = (info, text) => {
    const body = document.body;

    const span_style = document.createElement("span");
    span_style.style.position = "absolute";
    span_style.style.top = "50%";
    span_style.style.left = "50%";
    span_style.style.transform = "translate(-50%, -50%)";

    span_style.style.width = "auto";
    span_style.style.height = "auto";

    span_style.style.padding = "1.2%";

    span_style.style.display = "flex";
    span_style.style.justifyContent = "center";
    span_style.style.alignItems = "center";

    span_style.style.textAlign = "justify";

    span_style.style.backgroundColor = "khaki";
    span_style.style.border = "calc(0.08vh + 0.08vw) solid black"
    span_style.style.borderRadius = "calc(0.6vh + 0.6vw)";
    
    span_style.style.zIndex = "1000";

    span_style.textContent = text;

    info.addEventListener('mouseover', () => {
        body.appendChild(span_style);
    });
    info.addEventListener('mouseout', () => {
        span_style.remove();
    });
}

// Titulo
const info_titulo = document.getElementById("info_titulo");
const text_titulo = "¡Muchas gracias por probar Resonance! Recomendamos encarecidamente leer la ayuda de los iconos de información de cada elemento de la página antes de utilizarlo. ¡A crear música y sonido!"

crearInfoBox(info_titulo, text_titulo)

// BarraRepro
const info_barraRepro = document.getElementById("info_barraRepro");
const text_barraRepro = "Una vez grabado el audio y aplicados los efectos deseados, el usuario puede pulsar este botón de reproducción para escuchar una preview del resultado de su grabación sin necesidad de descargar el audio todavía. Se pueden modificar los efectos aplicados y volver a pulsar el botón de reproducción en caso de que se desee cambiar el resultado antes de descargar. Además, se indicará la duración de la grabación en un pequeño temporizador a la derecha del botón de reproducción."

crearInfoBox(info_barraRepro, text_barraRepro)

// Descargar
const info_descarga = document.getElementById("info_descarga");
const text_descarga = "Este botón permite descargar el audio grabado con sus efectos y base aplicados. ¡Ojo! Una vez descargado el audio, ya no se podrá seguir manipulando, así que el usuario debe asegurarse de que los efectos aplicados son los deseados antes de realizar la descarga. A continuación se podrá refrescar la página para empezar el proceso de nuevo."

crearInfoBox(info_descarga, text_descarga)

// Echo
const info_echo = document.getElementById("info_echo");
const text_echo = "Este deslizador permite ajustar el efecto de eco en nuestra grabación. El nivel de eco se aplicará a la grabación realizada y podrá manipularse todas las veces que se deseen sobre una misma grabación. Los parámetros que varían son el tiempo entre retardos, que varía entre 0 y 1 segundos; y la ganancia de retroalimentación, que varía entre 0 y 0.5. Ambos parámetros se modifican conjuntamente."

crearInfoBox(info_echo, text_echo)

// Chorus
const info_chorus = document.getElementById("info_chorus");
const text_chorus = "Este deslizador aplica a nuestra grabación el efecto de coro. El usuario podrá mover el deslizador para variar entre 0 y 8 voces adicionales. La cantidad de voces adicionales se aplicará a la grabación realizada y podrá manipularse todas las veces que se deseen sobre una misma grabación. La frecuencia de modulación está fijada en 0.2 Hz y la profundidad de modulación en 0.02 segundos. Con estos valores y el número de voces introducido por el usuario creamos el efecto de coro aplicando pequeños retardos de duración aleatoria a cada voz."

crearInfoBox(info_chorus, text_chorus)

// Reverb
const info_reverb = document.getElementById("info_reverb");
const text_reverb = "Por explicar"

crearInfoBox(info_reverb, text_reverb)

// Bases
const info_bases = document.getElementById("info_bases");
const text_bases = "Este desplegable permite seleccionar la base que sonará al pulsar el botón de reproducción de bases para poder añadir el audio grabado por encima, lo cual permite al usuario improvisar música con estas bases. Cada base tiene una duración de 2 minutos y son producciones propias de Daniel Cabañero, miembro del grupo que ha realizado este proyecto. Si no seleccionamos ninguna base o seleccionamos la opción “Sin base”, el botón de reproducción de bases estará deshabilitado. Si el usuario cambia de base mientras se está reproduciendo una de estas, deberá volver a pulsar el botón de reproducción de bases."

crearInfoBox(info_bases, text_bases)

// Autotune
const info_autotune = document.getElementById("info_autotune");
const text_autotune = "Por explicar"

crearInfoBox(info_autotune, text_autotune)

// BasesRepro
const info_basesRepro = document.getElementById("info_basesRepro");
const text_basesRepro = "Tras seleccionar una base, el usuario podrá pulsar este botón para iniciar la reproducción de la base seleccionada, pudiendo escucharla se esté grabando o no el micrófono. A continuación, el botón cambiará su icono a uno de pausa, permitiendo detener la reproducción de la base en cualquier momento. En caso de que no se haya seleccionado una base el botón no estará habilitado."

crearInfoBox(info_basesRepro, text_basesRepro)

// InicioGrabacion
const info_inicioGrabacion = document.getElementById("info_inicioGrabacion");
const text_inicioGrabacion = "Al pulsar por primera vez este botón, se activará la grabación del micrófono. Es probable que el navegador pida permiso al usuario para acceder al micrófono, por lo que se deberá aceptar este permiso. Tras pulsar el botón, éste pasará a contener un icono distinto: un cuadrado que indica el fin de la grabación. Al pulsarlo, la grabación acabará y se guardará para reproducirla en el reproductor superior y descargarla, a la vez que el botón vuelve a su estado original con el icono de micrófono."

crearInfoBox(info_inicioGrabacion, text_inicioGrabacion)


// Funciones actualizar sliders

//Echo
const echo = document.getElementById("valueEcho");
const spanEcho = document.getElementById("spanEcho");

echo.addEventListener('input', function() {
    spanEcho.textContent = this.value*1000 + " ms";
});

//Chorus
const Chorus = document.getElementById("valueChorus");
const spanChorus = document.getElementById("spanChorus");

Chorus.addEventListener('input', function() {
    if (this.value == 1) {
        spanChorus.textContent = this.value + " voz";
    }else{
        spanChorus.textContent = this.value + " voces";
    }
});

//Noise
const Reverb = document.getElementById("valueReverb");
const spanReverb = document.getElementById("spanReverb");

Reverb.addEventListener('input', function() {
    spanReverb.textContent = this.value;
});

//Autotune
const autotu = document.getElementById("boton_tune");
var press = 0;

autotu.addEventListener('click', function() {
    if (press == 0) {
        autotu.style.backgroundColor = "#c1c357";
        info_autotune.style.backgroundColor = "#c1c357";
        press = 1;
    }else if(press == 1){
        autotu.style.backgroundColor = "#DADC36";
        info_autotune.style.backgroundColor = "#DADC36";
        press = 0;
    }
});
