// EffectsProcessor.js
// Centralized audio effect construction, connection and offline rendering utilities.
// Designed to be used by an AudioEngine which provides realtime and offline AudioContexts.

(function () {
    'use strict';

    // Utility: safe read of slider value by id; fallback to default if not present or invalid
    function readSliderValue(id, fallback) {
        try {
            const el = document.getElementById(id);
            if (!el) return fallback;
            const v = Number(el.value);
            return Number.isFinite(v) ? v : fallback;
        } catch (e) {
            return fallback;
        }
    }

    // Simple sinusoidal modulation function used for chorus LFO
    // time in seconds, depth in seconds (delay variation), rate in Hz, phase offset
    function modulationFunction(time, depth, rate, phase = 0) {
        return Math.sin(2 * Math.PI * rate * time + phase) * depth;
    }

    // Create echo (delay + feedback) nodes for given context(s)
    function createEco(ctx, offlineContext) {
        const echo = {};

        // Real-time nodes
        echo.retardo = ctx.createDelay(5.0);
        echo.feed = ctx.createGain();

        // Offline nodes (if offlineContext provided)
        if (offlineContext) {
            echo.retardoOff = offlineContext.createDelay(5.0);
            echo.feedOff = offlineContext.createGain();
        } else {
            echo.retardoOff = null;
            echo.feedOff = null;
        }

        // Initialize parameters from UI sliders (fallback defaults)
        const echoTime = readSliderValue('valueEcho', 0.3); // seconds
        const echoGain = readSliderValue('valueEcho', 0.5); // reuse echo slider for level if absent

        echo.retardo.delayTime.value = echoTime;
        echo.feed.gain.value = echoGain;
        if (echo.retardoOff) echo.retardoOff.delayTime.value = echoTime;
        if (echo.feedOff) echo.feedOff.gain.value = echoGain;

        return echo;
    }

    // Create reverb-like nodes. If no convolver impulse is provided, create a simple feedback delay network
    function createReverb(ctx, offlineContext) {
        const reverb = {};

        // Use a delay + gain as a simple reverb unit
        reverb.revdelay = ctx.createDelay(5.0);
        reverb.revgain = ctx.createGain();

        if (offlineContext) {
            reverb.revdelayOff = offlineContext.createDelay(5.0);
            reverb.revgainOff = offlineContext.createGain();
        } else {
            reverb.revdelayOff = null;
            reverb.revgainOff = null;
        }

        const revTime = readSliderValue('valueReverb', 0.25);
        const revGain = readSliderValue('valueReverb', 0.3);

        reverb.revdelay.delayTime.value = revTime;
        reverb.revgain.gain.value = revGain;
        if (reverb.revdelayOff) reverb.revdelayOff.delayTime.value = revTime;
        if (reverb.revgainOff) reverb.revgainOff.gain.value = revGain;

        return reverb;
    }

    // Create chorus nodes: arrays of small delay nodes modulated by an LFO
    function createChorus(ctx, offlineContext, voices = 3) {
        const chorus = {
            chor_delays: [],
            chor_gains: [],
            chor_delaysoff: [],
            chor_gainsoff: []
        };

        const baseDelay = 0.015; // base delay for chorus in seconds
        const depth = readSliderValue('valueChorus', 0.005); // modulation depth
        const rate = 0.25; // LFO rate in Hz (can be adjusted)

        for (let i = 0; i < voices; i++) {
            const d = ctx.createDelay(0.1);
            const g = ctx.createGain();
            // initial delay = base + small offset per voice
            d.delayTime.value = baseDelay + (i * 0.002);
            g.gain.value = 0.6 / voices;
            chorus.chor_delays.push({ node: d, depth, rate, phase: (i / voices) * Math.PI * 2, baseDelay: d.delayTime.value });
            chorus.chor_gains.push(g);

            if (offlineContext) {
                const doff = offlineContext.createDelay(0.1);
                const goff = offlineContext.createGain();
                doff.delayTime.value = d.delayTime.value;
                goff.gain.value = g.gain.value;
                chorus.chor_delaysoff.push({ node: doff, baseDelay: doff.delayTime.value });
                chorus.chor_gainsoff.push(goff);
            }
        }

        return chorus;
    }

    // Setup or recreate realtime effect nodes and offline counterparts, reading UI values
    // Returns a structured object containing created nodes and arrays
    function setupRealtimeEffects({ ctx, offlineContext, sourceNode, audioBuffer }) {
        if (!ctx) throw new Error('AudioContext (ctx) is required');

        const eco = createEco(ctx, offlineContext);
        const rev = createReverb(ctx, offlineContext);
        const chorus = createChorus(ctx, offlineContext, 3);

        // Attach modulation updater for chorus (real-time)
        // We'll provide a function to be called from animation/tick loop to update delayTimes
        function updateChorusModulation(currentTime) {
            const depth = readSliderValue('valueChorus', 0.005);
            const rate = 0.25;
            chorus.chor_delays.forEach((cd, i) => {
                const mod = modulationFunction(currentTime, depth, rate, cd.phase);
                // Ensure non-negative delayTime
                cd.node.delayTime.value = Math.max(0, cd.baseDelay + mod);
            });
        }

        // Expose an updater for external tick (AudioEngine should call this on an animation frame)
        return {
            eco,
            rev,
            chorus,
            updateChorusModulation
        };
    }

    // Connect effects for realtime playback. Implements the connection graph as follows (typical):
    // source -> dry to destination
    // source -> retardo -> feed -> destination
    // retardo -> revdelay -> revgain -> destination
    // source -> each chorus delay -> chorus gain -> destination
    function applyEffects({ ctx, sourceNode, retardo, feed, revdelay, revgain, chor_delays, chor_gains }) {
        if (!ctx || !sourceNode) throw new Error('ctx and sourceNode are required for applyEffects');

        try {
            // Dry path
            sourceNode.connect(ctx.destination);

            // Echo path
            if (retardo && feed) {
                sourceNode.connect(retardo);
                retardo.connect(feed);
                feed.connect(ctx.destination);
            }

            // Reverb path: from echo retardo into reverb (if provided) to destination
            if (retardo && revdelay && revgain) {
                retardo.connect(revdelay);
                revdelay.connect(revgain);
                revgain.connect(ctx.destination);
            }

            // Chorus voices: each is fed directly from source and mixed to destination
            if (Array.isArray(chor_delays) && Array.isArray(chor_gains)) {
                for (let i = 0; i < chor_delays.length; i++) {
                    const cd = chor_delays[i];
                    const cg = chor_gains[i];
                    // cd may be an object with .node (from createChorus) or a raw DelayNode (from different caller)
                    const delayNode = cd && cd.node ? cd.node : cd;
                    if (delayNode && cg) {
                        sourceNode.connect(delayNode);
                        delayNode.connect(cg);
                        cg.connect(ctx.destination);
                    }
                }
            }

        } catch (err) {
            console.error('Error connecting effects:', err);
            throw err;
        }
    }

    // Disconnect graph created by applyEffects. Safely attempt to disconnect known connections.
    function disconnectEffects({ sourceNode, chor_delays, chor_gains, retardo, feed, revdelay, revgain }) {
        try {
            if (sourceNode) {
                try { sourceNode.disconnect(); } catch (e) { /* ignore */ }
            }

            if (retardo) {
                try { retardo.disconnect(); } catch (e) { /* ignore */ }
            }
            if (feed) {
                try { feed.disconnect(); } catch (e) { /* ignore */ }
            }
            if (revdelay) {
                try { revdelay.disconnect(); } catch (e) { /* ignore */ }
            }
            if (revgain) {
                try { revgain.disconnect(); } catch (e) { /* ignore */ }
            }

            if (Array.isArray(chor_delays)) {
                for (let i = 0; i < chor_delays.length; i++) {
                    const cd = chor_delays[i];
                    const delayNode = cd && cd.node ? cd.node : cd;
                    try { if (delayNode) delayNode.disconnect(); } catch (e) { /* ignore */ }
                }
            }
            if (Array.isArray(chor_gains)) {
                for (let i = 0; i < chor_gains.length; i++) {
                    try { if (chor_gains[i]) chor_gains[i].disconnect(); } catch (e) { /* ignore */ }
                }
            }

        } catch (err) {
            console.error('Error disconnecting effects:', err);
            // Do not rethrow — best-effort cleanup
        }
    }

    // Render offline: connect offline nodes, start offline source and render.
    // effectNodes must contain offline counterparts (e.g. retardoOff, feedOff, revdelayOff, revgainOff, chor_delaysoff, chor_gainsoff)
    async function renderOffline(offlineContext, offlineSource, audioBuffer, effectNodes) {
        if (!offlineContext || !offlineSource) throw new Error('offlineContext and offlineSource are required');

        const { retardoOff, feedOff, revdelayOff, revgainOff, chor_delaysoff, chor_gainsoff } = effectNodes || {};

        // Build offline graph similarly to applyEffects
        try {
            // Connect dry directly to destination
            offlineSource.connect(offlineContext.destination);

            // Echo path
            if (retardoOff && feedOff) {
                offlineSource.connect(retardoOff);
                retardoOff.connect(feedOff);
                feedOff.connect(offlineContext.destination);
            }

            // Reverb path
            if (retardoOff && revdelayOff && revgainOff) {
                retardoOff.connect(revdelayOff);
                revdelayOff.connect(revgainOff);
                revgainOff.connect(offlineContext.destination);
            }

            // Chorus offline voices
            if (Array.isArray(chor_delaysoff) && Array.isArray(chor_gainsoff)) {
                for (let i = 0; i < chor_delaysoff.length; i++) {
                    const doff = chor_delaysoff[i] && (chor_delaysoff[i].node ? chor_delaysoff[i].node : chor_delaysoff[i]);
                    const goff = chor_gainsoff[i];
                    if (doff && goff) {
                        offlineSource.connect(doff);
                        doff.connect(goff);
                        goff.connect(offlineContext.destination);
                    }
                }
            }

            // Start offline source
            offlineSource.buffer = audioBuffer;
            offlineSource.start(0);

            // Kick off render
            const renderedBuffer = await offlineContext.startRendering();
            return renderedBuffer;

        } catch (err) {
            console.error('Error during offline render:', err);
            throw err;
        }
    }

    // Exports as required
    const exported = {
        createEco,
        createReverb,
        createChorus,
        applyEffects,
        disconnectEffects,
        renderOffline
    };

    // Attach to module.exports if present (CommonJS environment)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = exported;
    }

    // Attach to window for direct browser access if present
    if (typeof window !== 'undefined') {
        window.EffectsProcessor = exported;
        // Additionally expose setupRealtimeEffects and modulationFunction for convenience (not in module.exports)
        window.setupRealtimeEffects = setupRealtimeEffects;
        window.modulationFunction = modulationFunction;
    }

})();