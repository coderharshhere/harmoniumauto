// ============================================================
// AI HARMONIUM PRO — DSP / Pitch Smoother Module
// ============================================================

class PitchSmoother {
    constructor(framesToStabilize = 2) {
        this.framesToStabilize = framesToStabilize;
        this.history = [];
        this.currentStableFrequency = null;
        this.cooldownCounter = 0;
        this.maxCooldown = 4; // Responsive cooldown (smooths brief micro-dropouts without note sticking)
    }

    // Process a raw frequency and return a smoothed frequency, or null
    process(frequency) {
        if (frequency === null || frequency <= 0) {
            this.cooldownCounter++;
            if (this.cooldownCounter > this.maxCooldown) {
                this.currentStableFrequency = null;
                this.history = [];
            }
            return this.currentStableFrequency;
        }

        this.cooldownCounter = 0;

        // Add to history
        this.history.push(frequency);
        if (this.history.length > this.framesToStabilize) {
            this.history.shift();
        }

        // If we don't have enough history, return the raw frequency
        if (this.history.length < this.framesToStabilize) {
            return frequency;
        }

        // Median smoothing (good for ignoring sudden vibrato spikes/errors)
        const sorted = [...this.history].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];

        this.currentStableFrequency = median;
        return median;
    }

    reset() {
        this.history = [];
        this.currentStableFrequency = null;
        this.cooldownCounter = 0;
    }
}
