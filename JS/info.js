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

// BarraRepro
const info_barraRepro = document.getElementById("info_barraRepro");
const text_barraRepro = "Por explicar"

crearInfoBox(info_barraRepro, text_barraRepro)

// Descargar
const info_descarga = document.getElementById("info_descarga");
const text_descarga = "Este botón permite descargar el audio grabado con sus efectos y base aplicados"

crearInfoBox(info_descarga, text_descarga)

// Echo
const info_echo = document.getElementById("info_echo");
const text_echo = "Este deslizador permite ajustar el efecto de eco en nuestra grabación. El nivel de eco se aplicará a la grabación realizada y podrá manipularse todas las veces que se deseen sobre una misma grabación. Los parámetros que varían son el tiempo entre retardos, que varía entre 0 y 1 segundos; y la ganancia de retroalimentación, que varía entre 0 y 0.5. Ambos parámetros se modifican conjuntamente."

crearInfoBox(info_echo, text_echo)

// Chorus
const info_chorus = document.getElementById("info_chorus");
const text_chorus = "Este deslizador aplica a nuestra grabación el efecto de coro. El usuario podrá mover el deslizador para variar entre 0 y 8 voces adicionales. La cantidad de voces adicionales se aplicará a la grabación realizada y podrá manipularse todas las veces que se deseen sobre una misma grabación."

crearInfoBox(info_chorus, text_chorus)

// Noise
const info_noise = document.getElementById("info_noise");
const text_noise = "Por explicar"

crearInfoBox(info_noise, text_noise)

// Reverb
const info_reverb = document.getElementById("info_reverb");
const text_reverb = "Por explicar"

crearInfoBox(info_reverb, text_reverb)

// Bases
const info_bases = document.getElementById("info_bases");
const text_bases = "Por explicar"

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
