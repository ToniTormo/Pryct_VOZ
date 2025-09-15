export default class FormatConverter {
    static async toWaveBlob(audioBuffer) {
        const numOfChan = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        let offset = 0;
        let pos = 0;
        function setUint16(data){ view.setUint16(pos, data, true); pos += 2; }
        function setUint32(data){ view.setUint32(pos, data, true); pos += 4; }
        setUint32(0x46464952);
        setUint32(length - 8);
        setUint32(0x45564157);
        setUint32(0x20746d66);
        setUint32(16);
        setUint16(1);
        setUint16(numOfChan);
        setUint32(audioBuffer.sampleRate);
        setUint32(audioBuffer.sampleRate * 2 * numOfChan);
        setUint16(numOfChan * 2);
        setUint16(16);
        setUint32(0x61746164);
        setUint32(length - pos - 4);
        const channels = [];
        for (let i=0;i<numOfChan;i++) channels.push(audioBuffer.getChannelData(i));
        let offsetSample = 0;
        while (offsetSample < audioBuffer.length) {
            for (let i=0;i<numOfChan;i++){
                let sample = Math.max(-1, Math.min(1, channels[i][offsetSample]));
                sample = sample * 32767.5;
                view.setInt16(pos, sample, true);
                pos += 2;
            }
            offsetSample++;
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }
}
