// ============================================================
// AI HARMONIUM MASTER — Authentic Master Acoustic Reed Engine
// Based on real acoustic multi-reed samples from web-harmonium.app & rajaramaniyer
// ============================================================

class HarmoniumSynth {
    constructor(audioContext) {
        this.ctx = audioContext;

        // Master Output Stage
        this.masterGain = this.ctx.createGain();

        // Bellows Dynamics Gain
        this.bellowsGain = this.ctx.createGain();
        this.bellowsGain.gain.value = 0.9;

        // Bellows Air Tremolo LFO (Simulates the subtle air fluctuation of pumped bellows)
        this.lfo = this.ctx.createOscillator();
        this.lfoGain = this.ctx.createGain();
        this.lfo.frequency.value = 4.0; // Air flutter rate (Hz)
        this.lfoGain.gain.value = 0.02;
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.bellowsGain.gain);
        this.lfo.start();

        // 3-Band Acoustic Tone Filter (Harmonium timber shaping)
        this.eqLow = this.ctx.createBiquadFilter();
        this.eqLow.type = 'lowshelf';
        this.eqLow.frequency.value = 220;
        this.eqLow.gain.value = 1.0;

        this.eqMid = this.ctx.createBiquadFilter();
        this.eqMid.type = 'peaking';
        this.eqMid.frequency.value = 1100;
        this.eqMid.Q.value = 0.9;
        this.eqMid.gain.value = 1.5;

        // Signature Brass Reed Formant Peak (2.4 kHz brass reed resonance)
        this.reedFormant = this.ctx.createBiquadFilter();
        this.reedFormant.type = 'peaking';
        this.reedFormant.frequency.value = 2400;
        this.reedFormant.Q.value = 1.8;
        this.reedFormant.gain.value = 2.5;

        // High-Cut Filter (Airflow dynamics modulated by bellows pressure)
        this.highCut = this.ctx.createBiquadFilter();
        this.highCut.type = 'lowpass';
        this.highCut.frequency.value = 12000;

        // Dynamics Compressor (Glues multi-reed voices together & prevents clipping)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -16;
        this.compressor.knee.value = 8;
        this.compressor.ratio.value = 3.5;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.08;

        // Real Acoustic Convolution Reverb
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.value = 0.22;
        this.convolver = this.ctx.createConvolver();

        // Dedicated Analyser for Real-Time Waveform & Spectrum Visualizer
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.75;

        // Signal Path Routing:
        // [Voices] -> masterGain -> bellowsGain -> eqLow -> eqMid -> reedFormant -> highCut -> compressor
        // compressor -> Destination & Analyser
        // compressor -> convolver -> reverbGain -> Destination
        this.masterGain.connect(this.bellowsGain);
        this.bellowsGain.connect(this.eqLow);
        this.eqLow.connect(this.eqMid);
        this.eqMid.connect(this.reedFormant);
        this.reedFormant.connect(this.highCut);
        this.highCut.connect(this.compressor);

        this.compressor.connect(this.ctx.destination);
        this.compressor.connect(this.analyser);

        this.compressor.connect(this.convolver);
        this.convolver.connect(this.reverbGain);
        this.reverbGain.connect(this.ctx.destination);

        // State
        this.activeNotes = new Map();
        this.activeStops = {
            bass: false,
            male: true,
            female: true
        };
        this.couplerEnabled = false;
        this.transposeSemitones = 0;
        this.bellowsPressure = 0.9;
        this.currentMonoNoteId = null;

        // Authentic Sample Parameters (Root is D4 = MIDI note 62 = 293.6648 Hz)
        this.SAMPLE_ROOT_FREQ = 293.6647679;
        this.SAMPLE_ROOT_MIDI = 62;
        this.SAMPLE_LOOP_START = 0.5;
        this.SAMPLE_LOOP_END = 7.5;
        this.sampleBuffer = null;
        this.isSampleLoaded = false;

        // Drones & Tanpura State
        this.activeDrones = new Map();
        this.tanpuraState = {
            playing: false,
            rootFreq: 261.63,
            mode: 'pa',
            volume: 0.4,
            currentSource: null,
            timerId: null
        };
        this.tanpuraGain = this.ctx.createGain();
        this.tanpuraGain.gain.value = 0.4;
        this.tanpuraGain.connect(this.compressor);
        this.tanpuraBuffers = new Map();

        // Synthetic fallbacks
        this._createPeriodicWaves();
        this._createSyntheticImpulse();

        // Load authentic sampled audio
        this._loadAcousticSamples();
    }

    // ----------------------------------------------------
    // Load Authentic Reed Sample & Convolution Reverb
    // ----------------------------------------------------
    async _loadAcousticSamples() {
        try {
            const resp = await fetch('audio/samples/harmonium.wav');
            if (resp.ok) {
                const arrayBuf = await resp.arrayBuffer();
                const rawBuffer = await this.ctx.decodeAudioData(arrayBuf);

                // Auto-correlate fundamental wave period for pitch-perfect loop seam
                const period = this._findPitchPeriod(rawBuffer, this.SAMPLE_ROOT_MIDI);
                const loopSpan = (rawBuffer.duration - 0.8) - this.SAMPLE_LOOP_START;
                const loopEnd = this.SAMPLE_LOOP_START + Math.round(loopSpan / period) * period;

                this.SAMPLE_LOOP_END = loopEnd;
                // Apply equal-power crossfaded loop for 100% click-free sustain
                this.sampleBuffer = this._crossfadeLoop(rawBuffer, this.SAMPLE_LOOP_START, loopEnd, 0.4);
                this.isSampleLoaded = true;
                console.log('✓ Authentic Harmonium reed sample loaded & looped successfully.');
            }
        } catch (err) {
            console.warn('Harmonium sample load warning, using high-definition hybrid synthesis:', err);
        }

        try {
            const revResp = await fetch('audio/samples/reverb.wav');
            if (revResp.ok) {
                const revArrayBuf = await revResp.arrayBuffer();
                this.convolver.buffer = await this.ctx.decodeAudioData(revArrayBuf);
                console.log('✓ Authentic Harmonium acoustic hall convolution reverb loaded.');
            }
        } catch (err) {
            console.warn('Reverb impulse response load warning, using synthetic hall response:', err);
        }
    }

    // ----------------------------------------------------
    // Pitch Period Correlation (Matches fundamental cycle for smooth looping)
    // ----------------------------------------------------
    _findPitchPeriod(buffer, midi) {
        const data = buffer.getChannelData(0);
        const sr = buffer.sampleRate;
        const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);
        const periodSamples = sr / targetFreq;
        const minP = Math.max(1, Math.round(periodSamples * 0.92));
        const maxP = Math.round(periodSamples * 1.08);
        const offset = Math.min(Math.round(1.5 * sr), Math.max(0, data.length - maxP - sr));
        const len = Math.min(Math.round(0.1 * sr), data.length - offset - maxP);

        if (len <= 0) return periodSamples / sr;

        let bestPeriod = periodSamples;
        let minDiff = Infinity;
        for (let p = minP; p <= maxP; p++) {
            let diff = 0;
            for (let i = 0; i < len; i++) {
                const delta = data[offset + i] - data[offset + i + p];
                diff += delta * delta;
            }
            if (diff < minDiff) {
                minDiff = diff;
                bestPeriod = p;
            }
        }
        return bestPeriod / sr;
    }

    // ----------------------------------------------------
    // Equal-Power Crossfaded Loop Window
    // ----------------------------------------------------
    _crossfadeLoop(buffer, loopStart, loopEnd, crossfadeSec = 0.4) {
        const sr = buffer.sampleRate;
        const fadeSamples = Math.max(1, Math.round(crossfadeSec * sr));
        const startSample = Math.round(loopStart * sr);
        const endSample = Math.round(loopEnd * sr);

        if (endSample - startSample <= fadeSamples * 2 || endSample + fadeSamples > buffer.length) {
            return buffer;
        }

        const newBuffer = this.ctx.createBuffer(buffer.numberOfChannels, buffer.length, sr);
        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const src = buffer.getChannelData(ch);
            const dst = newBuffer.getChannelData(ch);
            dst.set(src);

            for (let i = 0; i < fadeSamples; i++) {
                const progress = (i + 1) / (fadeSamples + 1);
                const gainOut = Math.cos(progress * Math.PI * 0.5);
                const gainIn = Math.sin(progress * Math.PI * 0.5);
                const outIdx = endSample - fadeSamples + i;
                const inIdx = endSample + i;
                dst[outIdx] = src[outIdx] * gainOut + src[inIdx] * gainIn;
            }
        }
        return newBuffer;
    }

    // ----------------------------------------------------
    // Periodic Wave Fallback (Used if sample file is fetching or offline)
    // ----------------------------------------------------
    _createPeriodicWaves() {
        const maleHarmonics = [0];
        for (let i = 1; i <= 32; i++) {
            let amp = Math.pow(1 / i, 0.45);
            if (i % 2 === 0) amp *= 1.1;
            maleHarmonics.push(amp);
        }

        const femaleHarmonics = [0];
        for (let i = 1; i <= 32; i++) {
            femaleHarmonics.push(Math.pow(1 / i, 0.45));
        }

        const bassHarmonics = [0];
        for (let i = 1; i <= 20; i++) {
            bassHarmonics.push(Math.pow(1 / i, 0.85));
        }

        this.waves = {
            bass: this._makeWave(bassHarmonics),
            male: this._makeWave(maleHarmonics),
            female: this._makeWave(femaleHarmonics)
        };
    }

    _makeWave(harmonicAmplitudes) {
        const real = new Float32Array(harmonicAmplitudes.length);
        const imag = new Float32Array(harmonicAmplitudes.length);
        for (let i = 0; i < harmonicAmplitudes.length; i++) {
            real[i] = 0;
            imag[i] = harmonicAmplitudes[i] * (i % 2 === 0 ? 1 : -0.9);
        }
        return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    }

    _createSyntheticImpulse() {
        const rate = this.ctx.sampleRate;
        const length = rate * 2.0;
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const decay = Math.exp(-i / (rate * 0.45));
            left[i] = (Math.random() * 2 - 1) * decay;
            right[i] = (Math.random() * 2 - 1) * decay;
        }
        this.convolver.buffer = impulse;
    }

    // ----------------------------------------------------
    // Controls
    // ----------------------------------------------------
    setVolume(value) {
        this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.03);
    }

    setStop(reedType, isActive) {
        this.activeStops[reedType] = isActive;
    }

    setCoupler(enabled) {
        this.couplerEnabled = enabled;
    }

    setTranspose(semitones) {
        this.transposeSemitones = semitones;
    }

    setBellowsPressure(pressure) {
        this.bellowsPressure = Math.max(0.2, Math.min(1.2, pressure));
        const now = this.ctx.currentTime;
        this.bellowsGain.gain.setTargetAtTime(this.bellowsPressure, now, 0.04);
        const cutoff = 6500 + (this.bellowsPressure * 7500);
        this.highCut.frequency.setTargetAtTime(cutoff, now, 0.04);
    }

    // ----------------------------------------------------
    // Play Note (Authentic Real Reed Playback)
    // ----------------------------------------------------
    noteOn(baseFrequency, noteId, isCouplerNote = false) {
        const idKey = noteId + (isCouplerNote ? '_c' : '');
        if (this.activeNotes.has(idKey)) return;

        const frequency = baseFrequency * Math.pow(2, this.transposeSemitones / 12);
        const now = this.ctx.currentTime;

        const noteGain = this.ctx.createGain();
        noteGain.gain.setValueAtTime(0, now);
        const targetVol = isCouplerNote ? 0.28 : 0.45;

        // Ultra-responsive, anti-click attack envelope (12 ms)
        noteGain.gain.linearRampToValueAtTime(targetVol, now + 0.012);

        // Stops definition with subtle brass acoustic micro-beating
        const stopDefs = [
            { type: 'bass', mult: 0.5, gainRatio: 0.60, detuneCents: -2.5 },
            { type: 'male', mult: 1.0, gainRatio: 1.00, detuneCents: 0.0 },
            { type: 'female', mult: 2.0, gainRatio: 0.52, detuneCents: +3.0 }
        ];

        const voices = [];

        if (this.isSampleLoaded && this.sampleBuffer) {
            // === AUTHENTIC ACOUSTIC REED PLAYBACK ===
            stopDefs.forEach(stop => {
                if (!this.activeStops[stop.type]) return;

                const voiceFreq = frequency * stop.mult;
                const playbackRate = voiceFreq / this.SAMPLE_ROOT_FREQ;

                const src = this.ctx.createBufferSource();
                src.buffer = this.sampleBuffer;
                src.loop = true;
                src.loopStart = this.SAMPLE_LOOP_START;
                src.loopEnd = this.SAMPLE_LOOP_END;
                src.playbackRate.setValueAtTime(playbackRate, now);
                src.detune.setValueAtTime(stop.detuneCents, now);

                const voiceGain = this.ctx.createGain();
                voiceGain.gain.value = stop.gainRatio;

                src.connect(voiceGain);
                voiceGain.connect(noteGain);

                src.start(now);
                voices.push(src);
            });
        } else {
            // === HIGH-DEF FALLBACK OSCILLATORS ===
            stopDefs.forEach(stop => {
                if (!this.activeStops[stop.type]) return;

                const stopFreq = frequency * stop.mult;
                const osc1 = this.ctx.createOscillator();
                osc1.setPeriodicWave(this.waves[stop.type]);
                osc1.frequency.setValueAtTime(stopFreq, now);

                const osc2 = this.ctx.createOscillator();
                osc2.setPeriodicWave(this.waves[stop.type]);
                osc2.frequency.setValueAtTime(stopFreq * 1.0014, now);

                const subGain = this.ctx.createGain();
                subGain.gain.value = stop.gainRatio * 0.45;

                osc1.connect(subGain);
                osc2.connect(subGain);
                subGain.connect(noteGain);

                osc1.start(now);
                osc2.start(now);
                voices.push(osc1, osc2);
            });
        }

        noteGain.connect(this.masterGain);

        this.activeNotes.set(idKey, {
            voices: voices,
            gainNode: noteGain
        });

        // Octave Coupler: layers octave above
        if (this.couplerEnabled && !isCouplerNote) {
            this.noteOn(baseFrequency * 2.0, noteId, true);
        }
    }

    // ----------------------------------------------------
    // Release Note (Natural Reed Damper Decrescendo)
    // ----------------------------------------------------
    noteOff(noteId, customRelease = null) {
        [noteId, noteId + '_c'].forEach(idKey => {
            const note = this.activeNotes.get(idKey);
            if (!note) return;

            const now = this.ctx.currentTime;
            const releaseTime = customRelease !== null ? customRelease : 0.035;

            note.gainNode.gain.cancelScheduledValues(now);
            note.gainNode.gain.setValueAtTime(note.gainNode.gain.value, now);
            note.gainNode.gain.linearRampToValueAtTime(0, now + releaseTime);

            note.voices.forEach(voice => {
                try {
                    voice.stop(now + releaseTime + 0.015);
                } catch (e) {}
            });

            setTimeout(() => {
                try { note.gainNode.disconnect(); } catch (e) {}
            }, (releaseTime + 0.06) * 1000);

            this.activeNotes.delete(idKey);
        });
    }

    allNotesOff() {
        for (const [idKey] of this.activeNotes) {
            const cleanId = idKey.replace('_c', '');
            this.noteOff(cleanId);
        }
        this.stopMonophonic();
    }

    playMonophonic(frequency, noteId) {
        if (this.currentMonoNoteId === noteId) return;

        if (this.currentMonoNoteId) {
            this.noteOff(this.currentMonoNoteId, 0.02);
        }

        this.noteOn(frequency, noteId);
        this.currentMonoNoteId = noteId;
    }

    stopMonophonic() {
        if (this.currentMonoNoteId) {
            this.noteOff(this.currentMonoNoteId, 0.15);
            this.currentMonoNoteId = null;
        }
    }

    // ----------------------------------------------------
    // Drone / Sur Stops (Continuous Authentic Reed Drones)
    // ----------------------------------------------------
    toggleDrone(droneKey, frequency) {
        if (this.activeDrones.has(droneKey)) {
            const d = this.activeDrones.get(droneKey);
            const now = this.ctx.currentTime;
            d.gain.gain.cancelScheduledValues(now);
            d.gain.gain.setValueAtTime(d.gain.gain.value, now);
            d.gain.gain.linearRampToValueAtTime(0, now + 0.25);
            d.voices.forEach(v => {
                try { v.stop(now + 0.28); } catch (e) {}
            });
            setTimeout(() => {
                try { d.gain.disconnect(); } catch (e) {}
            }, 300);
            this.activeDrones.delete(droneKey);
            return false;
        } else {
            const now = this.ctx.currentTime;
            const droneGain = this.ctx.createGain();
            droneGain.gain.setValueAtTime(0, now);
            droneGain.gain.linearRampToValueAtTime(0.24, now + 0.35);

            const voices = [];
            if (this.isSampleLoaded && this.sampleBuffer) {
                // Dual Male + Female reed drone blend
                [1.0, 2.0].forEach((mult, idx) => {
                    const src = this.ctx.createBufferSource();
                    src.buffer = this.sampleBuffer;
                    src.loop = true;
                    src.loopStart = this.SAMPLE_LOOP_START;
                    src.loopEnd = this.SAMPLE_LOOP_END;
                    src.playbackRate.setValueAtTime((frequency * mult) / this.SAMPLE_ROOT_FREQ, now);
                    src.detune.setValueAtTime(idx === 1 ? 2.5 : 0, now);

                    const subGain = this.ctx.createGain();
                    subGain.gain.value = idx === 1 ? 0.45 : 0.85;

                    src.connect(subGain);
                    subGain.connect(droneGain);
                    src.start(now);
                    voices.push(src);
                });
            } else {
                ['male', 'female'].forEach(stopType => {
                    const osc = this.ctx.createOscillator();
                    osc.setPeriodicWave(this.waves[stopType]);
                    osc.frequency.value = stopType === 'female' ? frequency * 2.0 : frequency;
                    osc.connect(droneGain);
                    osc.start(now);
                    voices.push(osc);
                });
            }

            droneGain.connect(this.masterGain);
            this.activeDrones.set(droneKey, { voices, gain: droneGain });
            return true;
        }
    }

    stopAllDrones() {
        for (const key of Array.from(this.activeDrones.keys())) {
            this.toggleDrone(key, 0);
        }
    }

    // ----------------------------------------------------
    // Authentic Acoustic Tanpura Engine
    // Uses real recorded Indian tanpura loops across 12 keys
    // ----------------------------------------------------
    _getTanpuraFileName(freq, mode) {
        const noteFreqs = [
            { name: 'c', freq: 261.63 },
            { name: 'cs', freq: 277.18 },
            { name: 'd', freq: 293.66 },
            { name: 'ds', freq: 311.13 },
            { name: 'e', freq: 329.63 },
            { name: 'f', freq: 349.23 },
            { name: 'fs', freq: 369.99 },
            { name: 'g', freq: 392.00 },
            { name: 'gs', freq: 415.30 },
            { name: 'a', freq: 440.00 },
            { name: 'as', freq: 466.16 },
            { name: 'b', freq: 493.88 }
        ];

        let closest = noteFreqs[0];
        let minDiff = Math.abs(freq - closest.freq);
        for (const nf of noteFreqs) {
            const diff = Math.abs(freq - nf.freq);
            if (diff < minDiff) {
                minDiff = diff;
                closest = nf;
            }
        }

        const prefix = mode === 'ma' ? 'm' : '';
        return `${prefix}${closest.name}.wav`;
    }

    async startTanpura(rootFreq, mode = 'pa', volume = 0.4) {
        this.stopTanpura();
        this.tanpuraState.playing = true;
        this.tanpuraState.rootFreq = rootFreq;
        this.tanpuraState.mode = mode;
        this.tanpuraState.volume = volume;

        const now = this.ctx.currentTime;
        this.tanpuraGain.gain.cancelScheduledValues(now);
        this.tanpuraGain.gain.setValueAtTime(0, now);
        this.tanpuraGain.gain.linearRampToValueAtTime(volume, now + 0.3);

        const fileName = this._getTanpuraFileName(rootFreq, mode);
        const url = `audio/samples/${fileName}`;

        try {
            let buffer = this.tanpuraBuffers.get(fileName);
            if (!buffer) {
                const res = await fetch(url);
                if (res.ok) {
                    const ab = await res.arrayBuffer();
                    buffer = await this.ctx.decodeAudioData(ab);
                    this.tanpuraBuffers.set(fileName, buffer);
                }
            }

            if (buffer && this.tanpuraState.playing) {
                const src = this.ctx.createBufferSource();
                src.buffer = buffer;
                src.loop = true;
                src.connect(this.tanpuraGain);
                src.start(0);
                this.tanpuraState.currentSource = src;
                console.log(`✓ Real Tanpura acoustic loop playing: ${fileName}`);
                return;
            }
        } catch (e) {
            console.warn('Real Tanpura sample load failed, falling back to plucked strings:', e);
        }

        // Plucked acoustic algorithm fallback
        this._startSyntheticTanpura(rootFreq, mode);
    }

    stopTanpura() {
        this.tanpuraState.playing = false;
        if (this.tanpuraState.currentSource) {
            const now = this.ctx.currentTime;
            this.tanpuraGain.gain.cancelScheduledValues(now);
            this.tanpuraGain.gain.setValueAtTime(this.tanpuraGain.gain.value, now);
            this.tanpuraGain.gain.linearRampToValueAtTime(0, now + 0.3);
            const src = this.tanpuraState.currentSource;
            setTimeout(() => {
                try { src.stop(); src.disconnect(); } catch (e) {}
            }, 350);
            this.tanpuraState.currentSource = null;
        }
        if (this.tanpuraState.timerId) {
            clearTimeout(this.tanpuraState.timerId);
            this.tanpuraState.timerId = null;
        }
    }

    setTanpuraVolume(vol) {
        this.tanpuraState.volume = vol;
        this.tanpuraGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }

    _startSyntheticTanpura(rootFreq, mode) {
        let stringIndex = 0;
        const getFreqs = () => {
            const f = this.tanpuraState.rootFreq;
            let firstFreq = f * 0.75;
            if (mode === 'ma') firstFreq = f * 0.666;
            if (mode === 'ni') firstFreq = f * 0.9375;
            return [firstFreq, f, f, f * 0.5];
        };

        const pluckString = () => {
            if (!this.tanpuraState.playing) return;
            const freqs = getFreqs();
            const freq = freqs[stringIndex];
            this._pluckTanpuraString(freq);

            stringIndex = (stringIndex + 1) % 4;
            this.tanpuraState.timerId = setTimeout(pluckString, 1100);
        };

        pluckString();
    }

    _pluckTanpuraString(frequency) {
        const now = this.ctx.currentTime;
        const strGain = this.ctx.createGain();
        strGain.gain.setValueAtTime(0, now);
        strGain.gain.linearRampToValueAtTime(0.45, now + 0.04);
        strGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        const jawariFilter = this.ctx.createBiquadFilter();
        jawariFilter.type = 'peaking';
        jawariFilter.frequency.value = frequency * 4;
        jawariFilter.Q.value = 4.0;
        jawariFilter.gain.value = 8.0;

        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, now);

        osc.connect(jawariFilter);
        jawariFilter.connect(strGain);
        strGain.connect(this.tanpuraGain);

        osc.start(now);
        osc.stop(now + 4.0);
    }
}
