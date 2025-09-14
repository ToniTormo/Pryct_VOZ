const { expect } = require('chai');
const pitch = require('../JS/utils/pitch');
const effects = require('../JS/utils/effects');

describe('autotune utils - pitch and effects', function() {
    describe('argprin', function() {
        it('should return 0 for input 0', function() {
            expect(pitch.argprin(0)).to.equal(0);
        });
    });

    describe('convolve', function() {
        it('should convolve simple signal with simple kernel', function() {
            const sig = [1,2,3];
            const k = [1,0];
            const out = effects.convolve(sig,k);
            // with kernel [1,0] and center aligned conv implementation we expect first entries to be close to original values
            expect(out).to.be.an('array');
            expect(out.length).to.equal(sig.length);
            expect(out[0]).to.equal(1);
        });
    });

    describe('generarFrecuenciasNotas & frecuenciaMasCercana', function() {
        it('should generate notes starting at fmin and produce nearest frequency', function() {
            const fmin = 440;
            const fmax = 880;
            const notas = pitch.generarFrecuenciasNotas(fmin, fmax);
            expect(notas[0]).to.equal(fmin);
            expect(notas.length).to.be.greaterThan(1);

            const f = 450; // slightly above A4
            const nearest = pitch.frecuenciaMasCercana(f, notas);
            // nearest should be one of the generated notes
            expect(notas).to.include(nearest);
        });
    });

    describe('segmentaf0 (basic protections)', function() {
        it('should return zeros for all-zero input', function() {
            const input = [0,0,0,0];
            const out = pitch.segmentaf0(input);
            expect(out).to.be.an('array');
            expect(out.every(v => v === 0)).to.be.true;
        });
    });
});
