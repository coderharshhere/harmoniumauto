// ============================================================
// AI HARMONIUM MASTER — Authentic Application Logic
// ============================================================

// ---- Note & Sargam Definitions ----
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SARGAM_NAMES = ['Sa', 'Re♭', 'Re', 'Ga♭', 'Ga', 'Ma', 'Ma♯', 'Pa', 'Dha♭', 'Dha', 'Ni♭', 'Ni'];
const SARGAM_HINDI = ['सा', 'रे♭', 'रे', 'ग♭', 'ग', 'म', 'म♯', 'प', 'ध♭', 'ध', 'नि♭', 'नि'];
const BLACK_KEY_INDICES = [1, 3, 6, 8, 10]; // C#, D#, F#, G#, A#
const WHITE_KEY_INDICES = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B

// ============================================================
// CONTINUOUS IN-LINE KEYBOARD MAPPING (Natural, contiguous & easy to play)
// White Keys (Home Row in ONE straight line): A(Sa) S(Re) D(Ga) F(Ma) G(Pa) H(Dha) J(Ni) K(Taar Sa) L(Taar Re) ;(Taar Ga) '(Taar Ma)
// Black Keys (Upper Row directly above):       W(Re♭) E(Ga♭) T(Ma♯) Y(Dha♭) U(Ni♭) O(Taar Re♭) P(Taar Ga♭)
// Octave Shift: Z (down)  X (up)   Coupler: C or ` (backtick)   Start/Stop: Space
// ============================================================
const KEY_MAP = {
    // ---- Shuddha Swaras (White keys - Home Row) ----
    'a': 0,   // Sa      (C)
    's': 2,   // Re      (D)
    'd': 4,   // Ga      (E)
    'f': 5,   // Ma      (F)
    'g': 7,   // Pa      (G)
    'h': 9,   // Dha     (A)
    'j': 11,  // Ni      (B)
    'k': 12,  // Sa+1    (C, Taar Sa)
    'l': 14,  // Re+1    (D, Taar Re)
    ';': 16,  // Ga+1    (E, Taar Ga)
    "'": 17,  // Ma+1    (F, Taar Ma)

    // ---- Komal / Teevra Swaras (Black keys - Upper Row) ----
    'w': 1,   // Re♭     (C#)
    'e': 3,   // Ga♭     (D#)
    't': 6,   // Ma♯     (F#)
    'y': 8,   // Dha♭    (G#)
    'u': 10,  // Ni♭     (A#)
    'o': 13,  // Re♭+1   (C#+1)
    'p': 15,  // Ga♭+1   (D#+1)
};

// Maps note-index-offset → computer keyboard shortcut label
const KEY_LABELS_MAP = {
    0:  'A',  // Sa
    1:  'W',  // Re♭
    2:  'S',  // Re
    3:  'E',  // Ga♭
    4:  'D',  // Ga
    5:  'F',  // Ma
    6:  'T',  // Ma♯
    7:  'G',  // Pa
    8:  'Y',  // Dha♭
    9:  'H',  // Dha
    10: 'U',  // Ni♭
    11: 'J',  // Ni
    12: 'K',  // Sa+1 (Taar Sa)
    13: 'O',  // Re♭+1
    14: 'L',  // Re+1
    15: 'P',  // Ga♭+1
    16: ';',  // Ga+1
    17: "'",  // Ma+1
};

// Raag Note Indexes relative to Sa (0 = Sa, 1 = Re♭, 2 = Re, etc.)
const RAAG_NOTES = {
    'none': null,
    'yaman': [0, 2, 4, 6, 7, 9, 11],       // Teevra Ma
    'bhairav': [0, 1, 4, 5, 7, 8, 11],     // Komal Re, Komal Dha
    'kafi': [0, 2, 3, 5, 7, 9, 10],        // Komal Ga, Komal Ni
    'bhupali': [0, 2, 4, 7, 9],            // Pentatonic Sa Re Ga Pa Dha
    'bilaval': [0, 2, 4, 5, 7, 9, 11],     // All Shuddha
    'malkauns': [0, 3, 5, 8, 10],          // Pentatonic Sa Komal Ga Ma Komal Dha Komal Ni
    'darbari': [0, 2, 3, 5, 7, 8, 10],     // Komal Ga, Komal Dha, Komal Ni
    'bageshri': [0, 2, 3, 5, 7, 9, 10],    // Komal Ga, Komal Ni
    'khamaj': [0, 2, 4, 5, 7, 9, 10, 11]   // Komal Ni + Shuddha Ni
};

const START_OCTAVE = 3;
const NUM_OCTAVES = 3;
const OCTAVE_NAMES = ['Mandra (मंद्र)', 'Madhya (मध्य)', 'Taar (तार)'];

function noteFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

function midiNoteNumber(octave, noteIndex) {
    return (octave + 1) * 12 + noteIndex;
}

// ---- Visualizer Class ----
class Visualizer {
    constructor(waveformCanvas, spectrumCanvas) {
        this.waveformCanvas = waveformCanvas;
        this.spectrumCanvas = spectrumCanvas;
        this.waveCtx = waveformCanvas ? waveformCanvas.getContext('2d') : null;
        this.specCtx = spectrumCanvas ? spectrumCanvas.getContext('2d') : null;
        this.isRunning = false;
    }

    resize() {
        [this.waveformCanvas, this.spectrumCanvas].forEach(canvas => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            const ctx = canvas.getContext('2d');
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        });
    }

    start(analyser) {
        this.analyser = analyser;
        this.isRunning = true;
        this.timeData = new Uint8Array(analyser.frequencyBinCount);
        this.freqData = new Uint8Array(analyser.frequencyBinCount);
        this.resize();
        this._draw();
    }

    stop() {
        this.isRunning = false;
        this._clearCanvas(this.waveCtx, this.waveformCanvas);
        this._clearCanvas(this.specCtx, this.spectrumCanvas);
    }

    _clearCanvas(ctx, canvas) {
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, w, h);
    }

    _draw() {
        if (!this.isRunning) return;
        requestAnimationFrame(() => this._draw());

        this.analyser.getByteTimeDomainData(this.timeData);
        this.analyser.getByteFrequencyData(this.freqData);

        this._drawWaveform();
        this._drawSpectrum();
    }

    _drawWaveform() {
        const canvas = this.waveformCanvas;
        const ctx = this.waveCtx;
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
        ctx.fillRect(0, 0, w, h);

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = w / this.timeData.length;
        let x = 0;

        for (let i = 0; i < this.timeData.length; i++) {
            const v = this.timeData[i] / 128.0;
            const y = (v * h) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }

        ctx.lineTo(w, h / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    _drawSpectrum() {
        const canvas = this.spectrumCanvas;
        const ctx = this.specCtx;
        if (!canvas || !ctx) return;
        const w = canvas.getBoundingClientRect().width;
        const h = canvas.getBoundingClientRect().height;

        ctx.fillStyle = 'rgba(10, 10, 15, 0.3)';
        ctx.fillRect(0, 0, w, h);

        const barCount = 64;
        const step = Math.floor(this.freqData.length / barCount);
        const barWidth = w / barCount - 1;

        for (let i = 0; i < barCount; i++) {
            const value = this.freqData[i * step];
            const percent = value / 255;
            const barHeight = percent * h * 0.9;

            const hue = 38 + percent * 20;
            ctx.fillStyle = `hsla(${hue}, 95%, ${50 + percent * 25}%, ${0.7 + percent * 0.3})`;
            ctx.shadowColor = `hsla(${hue}, 90%, 50%, 0.5)`;
            ctx.shadowBlur = 4;

            ctx.fillRect(i * (barWidth + 1), h - barHeight, barWidth, barHeight);
        }
        ctx.shadowBlur = 0;
    }
}

// ---- Dynamic Sargam NoteMapper Class ----
class NoteMapper {
    constructor() {
        this.baseFreq = 261.63; // C4 default Sa
        this.baseMidi = 60;
    }

    setBaseFrequency(freq) {
        this.baseFreq = freq;
        this.baseMidi = Math.round(69 + 12 * Math.log2(freq / 440));
    }

    frequencyToNote(frequency) {
        if (frequency <= 0) return null;

        const midiNote = 69 + 12 * Math.log2(frequency / 440);
        const roundedMidi = Math.round(midiNote);

        const noteIndex = ((roundedMidi % 12) + 12) % 12; // 0 = C, 1 = C#...
        
        // Dynamic Sargam calculation relative to chosen Base Sa!
        const sargamIndex = ((roundedMidi - this.baseMidi) % 12 + 12) % 12;

        const octave = Math.floor(roundedMidi / 12) - 1;

        const exactFreq = 440 * Math.pow(2, (roundedMidi - 69) / 12);
        const cents = 1200 * Math.log2(frequency / exactFreq);

        return {
            noteName: NOTE_NAMES[noteIndex],
            sargam: SARGAM_NAMES[sargamIndex],
            sargamHindi: SARGAM_HINDI[sargamIndex],
            sargamIndex: sargamIndex,
            octave: octave,
            midi: roundedMidi,
            frequency: exactFreq,
            detectedFrequency: frequency,
            cents: cents,
            noteId: `${NOTE_NAMES[noteIndex]}${octave}`,
            isBlack: BLACK_KEY_INDICES.includes(noteIndex)
        };
    }
}

// ---- Main Harmonium App Class ----
class HarmoniumApp {
    constructor() {
        this.mode = 'auto';
        this.isListening = false;
        this.currentOctave = 4;
        this.pressedKeys = new Set();
        this.lastDetectedNote = null;
        this.detectionCooldown = 0;
        this.labelMode = 'sargam';
        this.currentRaag = 'none';
        this.transposeSemitones = 0;
        this.bellowsPressure = 0.9;

        // Audio Engine
        this.audioContext = null;
        this.synth = null;
        this.pitchDetector = null;
        this.pitchSmoother = new PitchSmoother(3); // Responsive 3-frame median pitch smoothing
        this.noteMapper = new NoteMapper();
        this.analyser = null;
        this.mediaStream = null;

        // Audio Recorder State
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;

        // MIDI State
        this.midiAccess = null;

        // UI Mapping
        this.visualizer = null;
        this.keyElements = new Map();

        this._cacheDOM();
        this._buildKeyboard();
        this._bindEvents();
        this._initMIDI();
        this._updateModeUI();
    }

    _cacheDOM() {
        this.dom = {
            keyboard: document.getElementById('keyboard'),
            octaveLabels: document.getElementById('octaveLabels'),
            startBtn: document.getElementById('startBtn'),
            startBtnLabel: document.getElementById('startBtnLabel'),
            modeToggle: document.getElementById('modeToggle'),
            modeBadge: document.getElementById('modeBadge'),
            modeLabel: document.getElementById('modeLabel'),
            midiBadge: document.getElementById('midiBadge'),
            midiLabel: document.getElementById('midiLabel'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            sensitivitySlider: document.getElementById('sensitivitySlider'),
            sensitivityValue: document.getElementById('sensitivityValue'),
            baseNoteSelect: document.getElementById('baseNoteSelect'),
            transDown: document.getElementById('transDown'),
            transUp: document.getElementById('transUp'),
            transVal: document.getElementById('transVal'),
            labelModeSelect: document.getElementById('labelModeSelect'),
            raagSelect: document.getElementById('raagSelect'),
            tanpuraBtn: document.getElementById('tanpuraBtn'),
            tanpuraKeySelect: document.getElementById('tanpuraKeySelect'),
            tanpuraModeSelect: document.getElementById('tanpuraModeSelect'),
            tanpuraVol: document.getElementById('tanpuraVol'),
            recBtn: document.getElementById('recBtn'),
            recStopBtn: document.getElementById('recStopBtn'),
            recPlayback: document.getElementById('recPlayback'),
            recDownload: document.getElementById('recDownload'),
            stopBass: document.getElementById('stopBass'),
            stopMale: document.getElementById('stopMale'),
            stopFemale: document.getElementById('stopFemale'),
            couplerToggle: document.getElementById('couplerToggle'),
            couplerKnob: document.getElementById('couplerKnob'),
            bellowsMeterFill: document.getElementById('bellowsMeterFill'),
            detectionDisplay: document.getElementById('detectionDisplay'),
            detectedNote: document.getElementById('detectedNote'),
            detectedSargam: document.getElementById('detectedSargam'),
            detectedFreq: document.getElementById('detectedFreq'),
            confidenceFill: document.getElementById('confidenceFill'),
            bellows: document.getElementById('bellows'),
            waveformCanvas: document.getElementById('waveformCanvas'),
            spectrumCanvas: document.getElementById('spectrumCanvas')
        };
    }

    _buildKeyboard() {
        this.dom.keyboard.innerHTML = '';
        this.dom.octaveLabels.innerHTML = '';
        this.keyElements.clear();

        for (let oct = START_OCTAVE; oct < START_OCTAVE + NUM_OCTAVES; oct++) {
            const label = document.createElement('div');
            label.className = 'octave-label' + (oct === this.currentOctave ? ' active-octave' : '');
            label.textContent = `${OCTAVE_NAMES[oct - START_OCTAVE]} (${oct})`;
            label.dataset.oct = oct;
            label.title = 'Click to switch keyboard to this octave (or press Z/X)';
            label.addEventListener('click', () => {
                this.currentOctave = oct;
                this._updateKeyLabels();
            });
            this.dom.octaveLabels.appendChild(label);

            const octaveDiv = document.createElement('div');
            octaveDiv.className = 'octave';

            WHITE_KEY_INDICES.forEach(noteIdx => {
                const midi = midiNoteNumber(oct, noteIdx);
                const freq = noteFrequency(midi);
                const noteId = `${NOTE_NAMES[noteIdx]}${oct}`;

                const key = document.createElement('div');
                key.className = 'key white-key';
                key.dataset.note = noteId;
                key.dataset.freq = freq.toFixed(2);
                key.dataset.noteIdx = noteIdx;
                key.dataset.oct = oct;
                key.dataset.midi = midi;

                key.innerHTML = this._generateKeyContent(midi, noteIdx, oct);

                octaveDiv.appendChild(key);
                this.keyElements.set(noteId, key);
            });

            BLACK_KEY_INDICES.forEach(noteIdx => {
                const midi = midiNoteNumber(oct, noteIdx);
                const freq = noteFrequency(midi);
                const noteId = `${NOTE_NAMES[noteIdx]}${oct}`;

                const key = document.createElement('div');
                key.className = 'key black-key';
                key.dataset.note = noteId;
                key.dataset.freq = freq.toFixed(2);
                key.dataset.noteIdx = noteIdx;
                key.dataset.oct = oct;
                key.dataset.midi = midi;

                const blackPosMap = { 1: 1, 3: 2, 6: 4, 8: 5, 10: 6 };
                const whiteKeyPos = blackPosMap[noteIdx];
                key.style.left = `calc(${whiteKeyPos} * var(--white-key-width) - var(--black-key-width) / 2)`;

                key.innerHTML = this._generateKeyContent(midi, noteIdx, oct);

                octaveDiv.appendChild(key);
                this.keyElements.set(noteId, key);
            });

            this.dom.keyboard.appendChild(octaveDiv);
        }

        // Final High Sa Key
        const finalOct = START_OCTAVE + NUM_OCTAVES;
        const finalMidi = midiNoteNumber(finalOct, 0);
        const finalFreq = noteFrequency(finalMidi);
        const finalNoteId = `C${finalOct}`;

        const finalOctDiv = document.createElement('div');
        finalOctDiv.className = 'octave octave-final';

        const finalKey = document.createElement('div');
        finalKey.className = 'key white-key';
        finalKey.dataset.note = finalNoteId;
        finalKey.dataset.freq = finalFreq.toFixed(2);
        finalKey.dataset.noteIdx = 0;
        finalKey.dataset.oct = finalOct;
        finalKey.dataset.midi = finalMidi;
        finalKey.innerHTML = this._generateKeyContent(finalMidi, 0, finalOct);
        
        finalOctDiv.appendChild(finalKey);
        this.dom.keyboard.appendChild(finalOctDiv);
        this.keyElements.set(finalNoteId, finalKey);

        const finalLabel = document.createElement('div');
        finalLabel.className = 'octave-label octave-label-final';
        finalLabel.textContent = '↑';
        this.dom.octaveLabels.appendChild(finalLabel);

        this._updateRaagHighlight();
    }

    _generateKeyContent(midi, noteIdx, oct) {
        const sargamIdx = ((midi - this.noteMapper.baseMidi) % 12 + 12) % 12;
        const sargamName = SARGAM_NAMES[sargamIdx];
        const hindiName = SARGAM_HINDI[sargamIdx];

        // Find computer keyboard key for this note in the active octave
        const keyOffset = (oct - this.currentOctave) * 12 + noteIdx;
        const kbdLabel = KEY_LABELS_MAP[keyOffset];

        let kbdHtml = '';
        if (kbdLabel !== undefined) {
            kbdHtml = `<span class="key-kbd">${kbdLabel}</span>`;
        } else {
            kbdHtml = `<span class="key-kbd empty"></span>`;
        }

        let mainLabel = sargamName;
        let subLabel = hindiName;
        if (this.labelMode === 'hindi') {
            mainLabel = hindiName;
            subLabel = sargamName;
        } else if (this.labelMode === 'western') {
            mainLabel = `${NOTE_NAMES[noteIdx]}${oct}`;
            subLabel = sargamName;
        }

        return `
            <span class="key-label">
                ${kbdHtml}
                <span class="key-sargam">${mainLabel}</span>
                <span class="key-hindi">${subLabel}</span>
            </span>
        `;
    }

    _updateKeyLabels() {
        this.keyElements.forEach((keyEl) => {
            const midi = parseInt(keyEl.dataset.midi, 10);
            const noteIdx = parseInt(keyEl.dataset.noteIdx, 10);
            const oct = parseInt(keyEl.dataset.oct, 10);
            keyEl.innerHTML = this._generateKeyContent(midi, noteIdx, oct);
        });
        this._updateOctaveHeaderHighlight();
    }

    _updateOctaveHeaderHighlight() {
        if (!this.dom.octaveLabels) return;
        const labels = this.dom.octaveLabels.querySelectorAll('.octave-label:not(.octave-label-final)');
        labels.forEach((lbl) => {
            const oct = parseInt(lbl.dataset.oct, 10);
            if (oct === this.currentOctave) {
                lbl.classList.add('active-octave');
            } else {
                lbl.classList.remove('active-octave');
            }
        });
    }

    _updateRaagHighlight() {
        const allowedIndices = RAAG_NOTES[this.currentRaag];
        this.keyElements.forEach((keyEl) => {
            const midi = parseInt(keyEl.dataset.midi, 10);
            const sargamIdx = ((midi - this.noteMapper.baseMidi) % 12 + 12) % 12;
            if (!allowedIndices) {
                keyEl.classList.remove('dimmed-key', 'raag-key');
            } else if (allowedIndices.includes(sargamIdx)) {
                keyEl.classList.add('raag-key');
                keyEl.classList.remove('dimmed-key');
            } else {
                keyEl.classList.add('dimmed-key');
                keyEl.classList.remove('raag-key');
            }
        });
    }

    _updateDroneFrequencies() {
        const baseFreq = parseFloat(this.dom.baseNoteSelect.value) || 261.63;
        document.querySelectorAll('.drone-stop').forEach(stop => {
            const droneType = stop.dataset.drone;
            let freq = baseFreq;
            if (droneType === 'Pa') freq = baseFreq * Math.pow(2, 7 / 12);
            if (droneType === 'Ma') freq = baseFreq * Math.pow(2, 5 / 12);
            stop.dataset.freq = freq.toFixed(2);
        });
    }

    _bindEvents() {
        this.dom.modeToggle.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.mode = btn.dataset.mode;
                this._updateModeUI();
                if (this.mode === 'manual') {
                    this._stopAutoDetect();
                }
            });
        });

        this.dom.startBtn.addEventListener('click', () => this._toggleListening());

        this.dom.volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            this.dom.volumeValue.textContent = val + '%';
            if (this.synth) this.synth.setVolume(val / 100);
        });

        this.dom.sensitivitySlider.addEventListener('input', (e) => {
            const val = e.target.value;
            this.dom.sensitivityValue.textContent = val + '%';
            if (this.pitchDetector) this.pitchDetector.setSensitivity(val / 100);
        });

        this.dom.baseNoteSelect.addEventListener('change', (e) => {
            const freq = parseFloat(e.target.value);
            this.noteMapper.setBaseFrequency(freq);
            this._updateKeyLabels();
            this._updateRaagHighlight();
            this._updateDroneFrequencies();
        });
        this._updateDroneFrequencies();

        // Immediate audio warm-up on any first user gesture
        const onFirstInteraction = async () => {
            window.removeEventListener('pointerdown', onFirstInteraction);
            window.removeEventListener('keydown', onFirstInteraction);
            try {
                await this._initAudio();
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
            } catch (e) {}
        };
        window.addEventListener('pointerdown', onFirstInteraction, { once: true });
        window.addEventListener('keydown', onFirstInteraction, { once: true });

        this.dom.transDown.addEventListener('click', () => this._changeTranspose(-1));
        this.dom.transUp.addEventListener('click', () => this._changeTranspose(1));

        this.dom.labelModeSelect.addEventListener('change', (e) => {
            this.labelMode = e.target.value;
            this._updateKeyLabels();
        });

        this.dom.raagSelect.addEventListener('change', (e) => {
            this.currentRaag = e.target.value;
            this._updateRaagHighlight();
        });

        document.querySelectorAll('.reed-stop[data-stop]').forEach(stop => {
            stop.addEventListener('click', async () => {
                await this._initAudio();
                const stopType = stop.dataset.stop;
                const knob = stop.querySelector('.stop-knob');
                const isActive = knob.classList.toggle('active');
                if (this.synth) this.synth.setStop(stopType, isActive);
            });
        });

        this.dom.couplerToggle.addEventListener('click', async () => {
            await this._initAudio();
            const isActive = this.dom.couplerKnob.classList.toggle('active');
            if (this.synth) this.synth.setCoupler(isActive);
        });

        document.querySelectorAll('.drone-stop').forEach(stop => {
            stop.addEventListener('click', async () => {
                await this._initAudio();
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                const droneKey = stop.dataset.drone;
                const freq = parseFloat(stop.dataset.freq);
                const knob = stop.querySelector('.stop-knob');
                if (this.synth) {
                    const isNowActive = this.synth.toggleDrone(droneKey, freq);
                    knob.classList.toggle('active', isNowActive);
                }
            });
        });

        this.dom.tanpuraBtn.addEventListener('click', async () => {
            await this._initAudio();
            if (this.synth) {
                if (this.synth.tanpuraState.playing) {
                    this.synth.stopTanpura();
                    this.dom.tanpuraBtn.textContent = '▶ Start Tanpura';
                    this.dom.tanpuraBtn.classList.remove('active');
                } else {
                    const freq = parseFloat(this.dom.tanpuraKeySelect.value);
                    const mode = this.dom.tanpuraModeSelect.value;
                    const vol = parseFloat(this.dom.tanpuraVol.value) / 100;
                    this.synth.startTanpura(freq, mode, vol);
                    this.dom.tanpuraBtn.textContent = '⏹ Stop Tanpura';
                    this.dom.tanpuraBtn.classList.add('active');
                }
            }
        });

        this.dom.tanpuraKeySelect.addEventListener('change', () => {
            if (this.synth && this.synth.tanpuraState.playing) {
                const freq = parseFloat(this.dom.tanpuraKeySelect.value);
                const mode = this.dom.tanpuraModeSelect.value;
                const vol = parseFloat(this.dom.tanpuraVol.value) / 100;
                this.synth.startTanpura(freq, mode, vol);
            }
        });

        this.dom.tanpuraModeSelect.addEventListener('change', () => {
            if (this.synth && this.synth.tanpuraState.playing) {
                const freq = parseFloat(this.dom.tanpuraKeySelect.value);
                const mode = this.dom.tanpuraModeSelect.value;
                const vol = parseFloat(this.dom.tanpuraVol.value) / 100;
                this.synth.startTanpura(freq, mode, vol);
            }
        });

        this.dom.tanpuraVol.addEventListener('input', (e) => {
            if (this.synth) this.synth.setTanpuraVolume(parseFloat(e.target.value) / 100);
        });

        this.dom.recBtn.addEventListener('click', () => this._startRecording());
        this.dom.recStopBtn.addEventListener('click', () => this._stopRecording());

        let isBellowsDragging = false;
        this.dom.bellows.addEventListener('mousedown', () => {
            isBellowsDragging = true;
            this._pumpBellowsAir(0.95);
        });
        window.addEventListener('mouseup', () => { isBellowsDragging = false; });
        this.dom.bellows.addEventListener('mousemove', () => {
            if (isBellowsDragging) this._pumpBellowsAir(1.1);
        });

        // Glissando / Mouse Drag & Slide Support
        let isMouseDown = false;
        let currentMouseKey = null;

        this.dom.keyboard.addEventListener('mousedown', async (e) => {
            if (this.mode !== 'manual') return;
            await this._initAudio();
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            isMouseDown = true;
            const key = e.target.closest('.key');
            if (key) {
                currentMouseKey = key;
                this._manualNoteOn(key);
            }
        });

        this.dom.keyboard.addEventListener('mousemove', (e) => {
            if (!isMouseDown || this.mode !== 'manual') return;
            const key = document.elementFromPoint(e.clientX, e.clientY)?.closest('.key');
            if (key && key !== currentMouseKey) {
                if (currentMouseKey) this._manualNoteOff(currentMouseKey);
                currentMouseKey = key;
                this._manualNoteOn(key);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDown) {
                isMouseDown = false;
                if (currentMouseKey) {
                    this._manualNoteOff(currentMouseKey);
                    currentMouseKey = null;
                }
            }
        });

        this.dom.keyboard.addEventListener('mouseleave', () => {
            if (this.mode !== 'manual') return;
            if (isMouseDown && currentMouseKey) {
                this._manualNoteOff(currentMouseKey);
                currentMouseKey = null;
            }
            this.keyElements.forEach((el) => {
                if (el.classList.contains('active')) this._manualNoteOff(el);
            });
        });

        // Touch Glissando Support for Mobile / Tablets
        const activeTouches = new Map();

        this.dom.keyboard.addEventListener('touchstart', async (e) => {
            if (this.mode !== 'manual') return;
            e.preventDefault();
            await this._initAudio();
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const key = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.key');
                if (key) {
                    activeTouches.set(touch.identifier, key);
                    this._manualNoteOn(key);
                }
            }
        }, { passive: false });

        this.dom.keyboard.addEventListener('touchmove', (e) => {
            if (this.mode !== 'manual') return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const key = document.elementFromPoint(touch.clientX, touch.clientY)?.closest('.key');
                const prevKey = activeTouches.get(touch.identifier);
                if (key && key !== prevKey) {
                    if (prevKey) this._manualNoteOff(prevKey);
                    activeTouches.set(touch.identifier, key);
                    this._manualNoteOn(key);
                }
            }
        }, { passive: false });

        this.dom.keyboard.addEventListener('touchend', (e) => {
            if (this.mode !== 'manual') return;
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const key = activeTouches.get(touch.identifier);
                if (key) {
                    this._manualNoteOff(key);
                    activeTouches.delete(touch.identifier);
                }
            }
        }, { passive: false });

        this.dom.keyboard.addEventListener('touchcancel', (e) => {
            if (this.mode !== 'manual') return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const key = activeTouches.get(touch.identifier);
                if (key) {
                    this._manualNoteOff(key);
                    activeTouches.delete(touch.identifier);
                }
            }
        });

        document.addEventListener('keydown', async (e) => {
            if (e.repeat) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            const lowerKey = e.key.toLowerCase();

            if (lowerKey === ' ') {
                e.preventDefault();
                await this._toggleListening();
                return;
            }

            if (lowerKey === '`' || lowerKey === 'c') {
                // C or Backtick = Coupler toggle (Ga is on D)
                await this._initAudio();
                const isActive = this.dom.couplerKnob.classList.toggle('active');
                if (this.synth) this.synth.setCoupler(isActive);
                return;
            }

            if (lowerKey === 'z') {
                this.currentOctave = Math.max(START_OCTAVE, this.currentOctave - 1);
                this._updateKeyLabels();
                return;
            }
            if (lowerKey === 'x') {
                this.currentOctave = Math.min(START_OCTAVE + NUM_OCTAVES - 1, this.currentOctave + 1);
                this._updateKeyLabels();
                return;
            }

            if (this.mode !== 'manual') return;
            if (KEY_MAP.hasOwnProperty(lowerKey)) {
                e.preventDefault();
                await this._initAudio();
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }
                const noteOffset = KEY_MAP[lowerKey];
                const octave = this.currentOctave + Math.floor(noteOffset / 12);
                const noteIdx = noteOffset % 12;
                const noteId = `${NOTE_NAMES[noteIdx]}${octave}`;
                const keyEl = this.keyElements.get(noteId);
                if (keyEl && !this.pressedKeys.has(lowerKey)) {
                    this.pressedKeys.add(lowerKey);
                    this._manualNoteOn(keyEl);
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const lowerKey = e.key.toLowerCase();
            if (this.mode !== 'manual') return;
            if (KEY_MAP.hasOwnProperty(lowerKey)) {
                const noteOffset = KEY_MAP[lowerKey];
                const octave = this.currentOctave + Math.floor(noteOffset / 12);
                const noteIdx = noteOffset % 12;
                const noteId = `${NOTE_NAMES[noteIdx]}${octave}`;
                const keyEl = this.keyElements.get(noteId);
                if (keyEl) {
                    this.pressedKeys.delete(lowerKey);
                    this._manualNoteOff(keyEl);
                }
            }
        });

        window.addEventListener('resize', () => {
            if (this.visualizer) this.visualizer.resize();
        });
    }

    _changeTranspose(delta) {
        this.transposeSemitones = Math.max(-6, Math.min(6, this.transposeSemitones + delta));
        const rootName = NOTE_NAMES[(this.transposeSemitones + 12) % 12];
        const sign = this.transposeSemitones > 0 ? `+${this.transposeSemitones}` : `${this.transposeSemitones}`;
        this.dom.transVal.textContent = `${sign} (${rootName})`;
        if (this.synth) this.synth.setTranspose(this.transposeSemitones);
    }

    _pumpBellowsAir(amount = 0.95) {
        this.bellowsPressure = amount;
        this.dom.bellowsMeterFill.style.width = `${Math.min(100, amount * 90)}%`;
        if (this.synth) this.synth.setBellowsPressure(amount);
        this.dom.bellows.classList.add('breathing');
        setTimeout(() => {
            this.dom.bellowsMeterFill.style.width = '70%';
        }, 1200);
    }

    async _initMIDI() {
        if (navigator.requestMIDIAccess) {
            try {
                this.midiAccess = await navigator.requestMIDIAccess();
                let hasInputs = false;
                for (let input of this.midiAccess.inputs.values()) {
                    input.onmidimessage = (msg) => this._onMIDIMessage(msg);
                    hasInputs = true;
                }
                if (hasInputs) {
                    this.dom.midiBadge.classList.add('active');
                    this.dom.midiLabel.textContent = 'MIDI Connected 🎹';
                }
                this.midiAccess.onstatechange = (e) => {
                    if (e.port.type === 'input' && e.port.state === 'connected') {
                        e.port.onmidimessage = (msg) => this._onMIDIMessage(msg);
                        this.dom.midiBadge.classList.add('active');
                        this.dom.midiLabel.textContent = 'MIDI Connected 🎹';
                    }
                };
            } catch (err) {
                console.log('MIDI initialization skipped:', err);
            }
        }
    }

    _onMIDIMessage(event) {
        const [command, note, velocity] = event.data;
        const noteIndex = note % 12;
        const octave = Math.floor(note / 12) - 1;
        const noteId = `${NOTE_NAMES[noteIndex]}${octave}`;
        const keyEl = this.keyElements.get(noteId);

        if (command === 144 && velocity > 0) {
            if (keyEl) this._manualNoteOn(keyEl);
        } else if (command === 128 || (command === 144 && velocity === 0)) {
            if (keyEl) this._manualNoteOff(keyEl);
        }
    }

    async _startRecording() {
        await this._initAudio();
        this.recordedChunks = [];
        const dest = this.audioContext.createMediaStreamDestination();
        this.synth.compressor.connect(dest);

        try {
            this.mediaRecorder = new MediaRecorder(dest.stream);
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) this.recordedChunks.push(e.data);
            };
            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, { type: 'audio/wav' });
                const url = URL.createObjectURL(blob);
                this.dom.recPlayback.src = url;
                this.dom.recPlayback.style.display = 'inline-block';
                this.dom.recDownload.href = url;
                this.dom.recDownload.style.display = 'inline-block';
            };
            this.mediaRecorder.start();
            this.isRecording = true;
            this.dom.recBtn.disabled = true;
            this.dom.recStopBtn.disabled = false;
            this.dom.recBtn.textContent = '⏺ Recording...';
        } catch (e) {
            alert('Audio recording not supported: ' + e.message);
        }
    }

    _stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.dom.recBtn.disabled = false;
            this.dom.recStopBtn.disabled = true;
            this.dom.recBtn.textContent = '🔴 Record';
        }
    }

    async _initAudio() {
        if (this.audioContext && this.synth && this.visualizer) return; // fully ready

        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (!this.synth) {
                this.synth = new HarmoniumSynth(this.audioContext);
                this.synth.setVolume(this.dom.volumeSlider.value / 100);

                // Sync initial reed stops & coupler with UI knobs
                if (this.dom.stopBass)   this.synth.setStop('bass',   this.dom.stopBass.classList.contains('active'));
                if (this.dom.stopMale)   this.synth.setStop('male',   this.dom.stopMale.classList.contains('active'));
                if (this.dom.stopFemale) this.synth.setStop('female', this.dom.stopFemale.classList.contains('active'));
                if (this.dom.couplerKnob) this.synth.setCoupler(this.dom.couplerKnob.classList.contains('active'));
                this.synth.setTranspose(this.transposeSemitones);
            }
            if (!this.visualizer) {
                this.visualizer = new Visualizer(this.dom.waveformCanvas, this.dom.spectrumCanvas);
                // Feed harmonium synth output into visualizer so it animates during manual play too
                if (this.synth && this.synth.analyser) {
                    this.visualizer.start(this.synth.analyser);
                }
            }
        } catch (err) {
            // Reset so next attempt retries clean
            this.audioContext = null;
            this.synth = null;
            this.visualizer = null;
            console.error('Audio init error:', err);
            throw err;
        }
    }

    async _toggleListening() {
        await this._initAudio();

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        if (this.isListening) {
            this._stopListening();
        } else {
            await this._startListening();
        }
    }

    async _startListening() {
        try {
            if (this.mode === 'auto') {
                this.mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });

                const source = this.audioContext.createMediaStreamSource(this.mediaStream);

                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.analyser.smoothingTimeConstant = 0.7;
                source.connect(this.analyser);

                // Show mic waveform in visualizer
                if (this.visualizer) this.visualizer.start(this.analyser);

                this.pitchDetector = new AIPitchDetector(
                    this.audioContext,
                    this.analyser,
                    () => {
                        this.isListening = true;
                        this.dom.startBtn.classList.add('active');
                        this.dom.startBtnLabel.textContent = 'Stop Listening';
                        this.dom.startBtn.querySelector('.btn-icon').textContent = '⏹';
                        this.dom.modeBadge.classList.add('listening');
                        this.dom.bellows.classList.add('breathing');
                    },
                    (frequency) => this._onPitchDetected(frequency)
                );
                if (this.dom.sensitivitySlider) {
                    this.pitchDetector.setSensitivity(this.dom.sensitivitySlider.value / 100);
                }
            } else {
                // Manual mode — just open audio engine & show synth visualizer
                this.isListening = true;
                this.dom.startBtn.classList.add('active');
                this.dom.startBtnLabel.textContent = 'Stop Playing';
                this.dom.startBtn.querySelector('.btn-icon').textContent = '⏹';
                this.dom.modeBadge.classList.add('listening');
                this.dom.bellows.classList.add('breathing');
                if (this.visualizer && this.synth && this.synth.analyser) {
                    this.visualizer.start(this.synth.analyser);
                }
            }
        } catch (err) {
            console.error('Start Listening Error:', err);
            alert('माइक शुरू नहीं हो सका:\n' + (err.message || err));
        }
    }

    _stopListening() {
        this.isListening = false;

        if (this.pitchDetector) {
            this.pitchDetector.stop();
            this.pitchDetector = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
            this.mediaStream = null;
        }

        if (this.synth) this.synth.allNotesOff();

        // After stopping mic, plug visualizer back into synth output
        if (this.visualizer && this.synth && this.synth.analyser) {
            this.visualizer.start(this.synth.analyser);
        } else if (this.visualizer) {
            this.visualizer.stop();
        }

        this.dom.startBtn.classList.remove('active');
        this.dom.startBtnLabel.textContent = this.mode === 'auto' ? 'Start Listening' : 'Start Playing';
        this.dom.startBtn.querySelector('.btn-icon').textContent = '▶';
        this.dom.modeBadge.classList.remove('listening');
        this.dom.bellows.classList.remove('breathing');

        this.keyElements.forEach((el) => el.classList.remove('active', 'detected'));
        this.dom.detectedNote.textContent = '—';
        this.dom.detectedSargam.textContent = 'Gaao...';
        this.dom.detectedFreq.textContent = '';
        this.dom.confidenceFill.style.width = '0%';
    }

    _onPitchDetected(rawFrequency) {
        if (!this.isListening || this.mode !== 'auto') return;

        const frequency = this.pitchSmoother.process(rawFrequency);

        if (frequency && frequency > 0) {
            const noteInfo = this.noteMapper.frequencyToNote(frequency);

            if (noteInfo) {
                // Determine mapped keyboard key
                let mappedMidi = noteInfo.midi;
                const minMidi = midiNoteNumber(START_OCTAVE, 0); // 48 (C3)
                const maxMidi = midiNoteNumber(START_OCTAVE + NUM_OCTAVES, 0); // 84 (C6)

                while (mappedMidi < minMidi) mappedMidi += 12;
                while (mappedMidi > maxMidi) mappedMidi -= 12;

                const noteIndex = mappedMidi % 12;
                const octave = Math.floor(mappedMidi / 12) - 1;
                const noteId = `${NOTE_NAMES[noteIndex]}${octave}`;
                const keyFreq = noteFrequency(mappedMidi);

                this.dom.detectedNote.textContent = `${NOTE_NAMES[noteIndex]}${octave}`;
                this.dom.detectedSargam.textContent = `${noteInfo.sargam} (${noteInfo.sargamHindi})`;
                this.dom.detectedFreq.textContent = `${frequency.toFixed(1)} Hz`;
                this.dom.confidenceFill.style.width = `100%`;

                // Play tuned harmonium reed pitch matching the key!
                this.synth.playMonophonic(keyFreq, noteId);
                this._pumpBellowsAir(0.9);

                if (this.lastDetectedNote !== noteId) {
                    if (this.lastDetectedNote) {
                        const prevEl = this.keyElements.get(this.lastDetectedNote);
                        if (prevEl) prevEl.classList.remove('detected');
                    }

                    const keyEl = this.keyElements.get(noteId);
                    if (keyEl) keyEl.classList.add('detected');

                    this.lastDetectedNote = noteId;
                }
                this.detectionCooldown = 0;
            }
        } else {
            this.detectionCooldown++;
            if (this.detectionCooldown > 8) {
                if (this.lastDetectedNote) {
                    this.synth.stopMonophonic();
                    const prevEl = this.keyElements.get(this.lastDetectedNote);
                    if (prevEl) prevEl.classList.remove('detected');
                    this.lastDetectedNote = null;
                }
                this.dom.detectedNote.textContent = '—';
                this.dom.detectedSargam.textContent = 'Gaao...';
                this.dom.detectedFreq.textContent = '';
                this.dom.confidenceFill.style.width = '0%';
            }
        }
    }

    _stopAutoDetect() {
        if (this.pitchDetector) {
            this.pitchDetector.stop();
            this.pitchDetector = null;
        }
    }

    async _manualNoteOn(keyEl) {
        if (!this.audioContext) await this._initAudio();
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        const noteId = keyEl.dataset.note;
        const freq = parseFloat(keyEl.dataset.freq);

        keyEl.classList.add('active');
        this._pumpBellowsAir(1.0);

        if (this.synth) {
            this.synth.noteOn(freq, noteId);
        }
    }

    _manualNoteOff(keyEl) {
        const noteId = keyEl.dataset.note;
        keyEl.classList.remove('active');

        if (this.synth) {
            this.synth.noteOff(noteId);
        }

        let anyActive = false;
        this.keyElements.forEach((el) => {
            if (el.classList.contains('active')) anyActive = true;
        });
        if (!anyActive && this.mode === 'manual' && !this.isListening) {
            this.dom.bellows.classList.remove('breathing');
        }
    }

    _updateModeUI() {
        this.dom.modeToggle.querySelectorAll('.toggle-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.mode === this.mode);
        });

        this.dom.modeLabel.textContent = this.mode === 'auto' ? 'Auto Detect Mode' : 'Manual Mode';
        this.dom.detectionDisplay.classList.toggle('visible', this.mode === 'auto');

        if (!this.isListening) {
            this.dom.startBtnLabel.textContent = this.mode === 'auto' ? 'Start Listening' : 'Start Playing';
        }

        if (this.mode === 'manual' && this.isListening) {
            this._stopAutoDetect();
            if (this.synth) this.synth.allNotesOff();
            this.keyElements.forEach((el) => el.classList.remove('detected'));
        }
    }
}

// ---- Initialize Application ----
document.addEventListener('DOMContentLoaded', () => {
    window.harmoniumApp = new HarmoniumApp();
});
