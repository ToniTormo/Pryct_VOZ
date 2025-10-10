# RESONANCE - Procesador de Audio en Tiempo Real

## Descripción
Aplicación web interactiva desarrollada en JavaScript vanilla para procesamiento de audio en tiempo real. El proyecto proporciona una interfaz intuitiva que permite grabar audio desde el micrófono, aplicar efectos de sonido profesionales y descargar las grabaciones procesadas en formato WAV.

Este proyecto fue desarrollado como trabajo académico para la asignatura de **Voz** del **Grado en Tecnología Digital y Multimedia (GTDM)** en la **Universidad Politécnica de Valencia** durante el año 2024.

## Características

### Grabación de Audio
- Captura de audio en tiempo real desde el micrófono
- Visualización del estado de grabación
- Interfaz intuitiva con controles de inicio/parada

### Efectos de Audio en Tiempo Real
- **Echo**: Efecto de eco configurable con control de retardo (0-1000 ms) y retroalimentación
- **Chorus**: Efecto de coro con múltiples voces moduladas (0-8 voces)
- **Reverb**: Efecto de reverberación ajustable (0-0.9) para simular espacios acústicos

### Bases Musicales
- Tres bases musicales pregrabadas incluidas
- Reproductor integrado para previsualizar las bases
- Posibilidad de grabar con o sin base musical de fondo

### Reproducción y Descarga
- Reproductor de audio integrado con barra de progreso
- Visualización del tiempo actual y duración total
- Descarga de grabaciones procesadas en formato WAV de alta calidad (256 kbps)
- Procesamiento offline para garantizar la calidad de la exportación

## Tecnologías Utilizadas

- **HTML5**: Estructura de la aplicación
- **CSS3**: Estilos y diseño de la interfaz
- **JavaScript (ES6+)**: Lógica de la aplicación
- **Web Audio API**: Procesamiento de audio en tiempo real
  - AudioContext
  - MediaStream API
  - MediaRecorder API
  - OfflineAudioContext
- **Audio Nodes**:
  - DelayNode (para efectos de eco y reverb)
  - GainNode (para control de amplitud)
  - MediaStreamSource
  - MediaElementSource
  - MediaStreamDestination

## Requisitos

### Navegador Web
- Google Chrome 70+ (recomendado)
- Firefox 65+
- Microsoft Edge 79+
- Safari 14+

**Nota**: Se requiere un navegador moderno con soporte completo para Web Audio API y MediaRecorder API.

## Instalación

No se requiere instalación ni configuración de servidor. El proyecto es completamente client-side.

1. **Clonar o descargar el repositorio**:
```bash
git clone https://github.com/tuusuario/Pryct_VOZ.git
cd Pryct_VOZ
```

2. **Listo para usar**: No se necesitan dependencias externas ni instalación de librerías.

## Uso

### Inicio de la Aplicación

1. Abrir el archivo `HTML/Estructura.html` directamente en el navegador (arrastrar y soltar funciona perfectamente)
2. Conceder permisos de acceso al micrófono cuando el navegador lo solicite
3. Leer los tooltips informativos para familiarizarse con las funcionalidades

### Flujo de Trabajo Típico

#### 1. Configurar Efectos
- Ajustar los sliders de **Echo**, **Chorus** y **Reverb** según preferencias
- Los valores se actualizan en tiempo real mostrando la intensidad del efecto

#### 2. Seleccionar Base Musical (Opcional)
- Usar el selector desplegable para elegir una de las tres bases disponibles
- Presionar el botón **"ESCUCHAR BASES"** para previsualizar
- O seleccionar "Sin base" para grabar solo con voz

#### 3. Grabar Audio
- Presionar el botón **"COMENZAR GRABACIÓN"** (icono de micrófono)
- El icono cambiará a un cuadrado indicando que está grabando
- Hablar o cantar cerca del micrófono
- Presionar nuevamente para detener la grabación

#### 4. Reproducir y Ajustar
- Usar el botón **Play/Pause** para escuchar la grabación con efectos aplicados
- Ajustar los efectos en tiempo real durante la reproducción
- La barra de tiempo muestra el progreso de reproducción

#### 5. Descargar
- Presionar el botón de **"DESCARGA"** (icono de descarga dorado)
- El archivo `grabacion.wav` se descargará automáticamente
- El audio descargado incluye todos los efectos aplicados

## Funcionalidades Técnicas

### Procesamiento de Audio

#### Echo (Eco)
- Implementación mediante `DelayNode` y `GainNode`
- Tiempo de retardo configurable: 0-1 segundo
- Retroalimentación controlada para evitar saturación
- Feedback proporcional al tiempo de retardo (value/2)

#### Chorus
- Múltiples voces moduladas (hasta 8)
- Cada voz tiene un retardo aleatorio (0-100 ms)
- Ganancia variable por voz (0.4-0.8)
- Modulación sinusoidal para efecto de desafinación natural
- Frecuencia de modulación: 0.2 Hz
- Profundidad de modulación: 20 ms

#### Reverb (Reverberación)
- Sistema de retardo recursivo con `DelayNode`
- Simulación de reflexiones acústicas
- Tiempo de retardo fijo: 10 ms (online) / 20 ms (offline)
- Ganancia ajustable para controlar la intensidad

## Tooltips Informativos

La aplicación incluye un sistema completo de tooltips que explican:
- Función de cada efecto de audio
- Cómo usar los controles
- Recomendaciones de uso
- Solución de problemas comunes

**Esperamos que disfrutes usando RESONANCE. ¡Diviértete creando música!** 🎵🎙️

© GTDM - Universidad Politécnica de Valencia, 2024. Proyecto académico.
