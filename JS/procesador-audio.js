class MiProcesadorDeAudio extends AudioWorkletProcessor {
    constructor() {
      super();
      // Crear un array para almacenar el audio entrante
      this.audioData = [];
    }
  
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
  
      // Almacenar el audio entrante en el array
      this.audioData.push(new Float32Array(input[0])); // Asumiendo un solo canal de audio
  
      // Realizar el procesamiento de audio si es necesario
  
      // Copiar los datos de entrada a la salida (un ejemplo simple)
      for (let channel = 0; channel < output.length; ++channel) {
        for (let i = 0; i < output[channel].length; ++i) {
          output[channel][i] = input[channel][i];
        }
      }
  
      return true; // Devolver true para indicar que el procesamiento se ha completado
    }
  }
  
  // Registrar el procesador de audio personalizado
  registerProcessor('mi-procesador-de-audio', MiProcesadorDeAudio);