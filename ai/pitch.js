// ============================================================
// AI HARMONIUM PRO — Precision YIN Pitch Detection Engine
// ============================================================

class AIPitchDetector {
    constructor(audioContext, mediaStreamOrAnalyser, onModelLoaded, onPitchDetected) {
        this.ctx = audioContext;
        this.onModelLoaded = onModelLoaded;
        this.onPitchDetected = onPitchDetected;
        this.isRunning = false;
        this.sensitivityThreshold = 0.15; // YIN threshold
        this.rmsThreshold = 0.005; // Dynamic RMS silence threshold

        if (mediaStreamOrAnalyser && mediaStreamOrAnalyser.getFloatTimeDomainData) {
            // Already an AnalyserNode
            this.analyser = mediaStreamOrAnalyser;
        } else if (mediaStreamOrAnalyser) {
            this.stream = mediaStreamOrAnalyser;
            this.analyser = this.ctx.createAnalyser();
            this.analyser.fftSize = 2048;
            const source = this.ctx.createMediaStreamSource(this.stream);
            source.connect(this.analyser);
        }

        setTimeout(() => {
            if (this.onModelLoaded) this.onModelLoaded();
            this.isRunning = true;
            this.getPitch();
        }, 50);
    }

    setSensitivity(val) {
        // Sensitivity maps threshold: higher sensitivity = lower threshold (easier detection)
        this.sensitivityThreshold = 0.28 - (val * 0.20);
        // RMS gate: from 0.015 at min sensitivity down to 0.002 at max sensitivity
        this.rmsThreshold = 0.015 - (val * 0.013);
    }

    getPitch() {
        if (!this.isRunning) return;

        const buffer = new Float32Array(this.analyser.fftSize);
        this.analyser.getFloatTimeDomainData(buffer);

        const frequency = this._detectPitchYIN(buffer, this.ctx.sampleRate);

        if (frequency && frequency > 0) {
            if (this.onPitchDetected) this.onPitchDetected(frequency);
        } else {
            if (this.onPitchDetected) this.onPitchDetected(null);
        }

        if (this.isRunning) {
            requestAnimationFrame(() => this.getPitch());
        }
    }

    // ----------------------------------------------------
    // Gold Standard YIN Pitch Detection Algorithm
    // Prevents octave drops (e.g. 200-300Hz collapse) and tracks true vocal pitch
    // ----------------------------------------------------
    _detectPitchYIN(buffer, sampleRate) {
        const SIZE = buffer.length;
        const halfSize = Math.floor(SIZE / 2);

        // Check overall RMS energy (dynamic volume threshold)
        let sumSquare = 0;
        for (let i = 0; i < SIZE; i++) {
            sumSquare += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(sumSquare / SIZE);
        if (rms < this.rmsThreshold) return -1; // Silence threshold

        const yinBuffer = new Float32Array(halfSize);

        // 1. Difference function
        for (let tau = 0; tau < halfSize; tau++) {
            let diff = 0;
            for (let i = 0; i < halfSize; i++) {
                const delta = buffer[i] - buffer[i + tau];
                diff += delta * delta;
            }
            yinBuffer[tau] = diff;
        }

        // 2. Cumulative mean normalized difference function
        yinBuffer[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < halfSize; tau++) {
            runningSum += yinBuffer[tau];
            yinBuffer[tau] = (yinBuffer[tau] * tau) / runningSum;
        }

        // 3. Absolute thresholding for fundamental period tau
        let tauEstimate = -1;
        const threshold = this.sensitivityThreshold;

        for (let tau = 2; tau < halfSize; tau++) {
            if (yinBuffer[tau] < threshold) {
                while (tau + 1 < halfSize && yinBuffer[tau + 1] < yinBuffer[tau]) {
                    tau++;
                }
                tauEstimate = tau;
                break;
            }
        }

        if (tauEstimate === -1) {
            // Find global minimum if threshold wasn't reached
            let minVal = 1.0;
            for (let tau = 2; tau < halfSize; tau++) {
                if (yinBuffer[tau] < minVal) {
                    minVal = yinBuffer[tau];
                    tauEstimate = tau;
                }
            }
            if (minVal > 0.40) return -1; // Unpitched / Noise
        }

        // 4. Parabolic Interpolation for accurate sub-Hz pitch estimation
        let x0 = tauEstimate > 0 ? tauEstimate - 1 : tauEstimate;
        let x2 = tauEstimate < halfSize - 1 ? tauEstimate + 1 : tauEstimate;

        let betterTau;
        if (x0 === tauEstimate) {
            betterTau = yinBuffer[tauEstimate] < yinBuffer[x2] ? tauEstimate : x2;
        } else if (x2 === tauEstimate) {
            betterTau = yinBuffer[tauEstimate] < yinBuffer[x0] ? tauEstimate : x0;
        } else {
            const s0 = yinBuffer[x0];
            const s1 = yinBuffer[tauEstimate];
            const s2 = yinBuffer[x2];
            betterTau = tauEstimate + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
        }

        const frequency = sampleRate / betterTau;

        // Vocal frequency boundaries (65 Hz to 1200 Hz) - Mandra, Madhya & Taar Saptak
        if (frequency < 65 || frequency > 1200) return -1;

        return frequency;
    }

    stop() {
        this.isRunning = false;
    }
}
