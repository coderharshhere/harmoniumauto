# 🪗 AI Harmonium Auto (Authentic Indian Harmonium & Tanpura)

An authentic, interactive Indian Harmonium web simulator with real multi-reed acoustic recordings, Tanpura drone loops, YIN pitch detection (sing into microphone to auto-play), scale changer, octave coupler, and Raag assistance.

---

## ✨ Features

- **Authentic Master Reed Acoustics:** Real sampled brass harmonium reeds (based on `web-harmonium.app` & `rajaramaniyer` recordings).
- **Seamless Crossfade Looping:** Continuous sustain without clicks, pops, or loop seams.
- **Multi-Reed Stops:**
  - **Mandra (Bass):** Warm sub-octave reed (-12 semitones)
  - **Madhya (Male):** Unison lead reed
  - **Taar (Female):** Bright upper octave reed (+12 semitones)
  - **Coupler:** 1-octave layer for rich harmonium fullness
- **Real Acoustic Tanpura Drone:** Recorded Tanpura loops across all 12 root keys (C through B) in both **Pa-sruti** and **Ma-sruti**.
- **Concert Hall Reverb:** Real impulse response convolution reverb.
- **Microphone Auto-Pitch (AI / YIN Algorithm):** Sing or hum into your microphone, and the harmonium automatically detects your vocal pitch and plays the corresponding keys in real-time.
- **Keyboard & Touch Controls:** Home-row continuous layout for laptop keyboard, mouse drag glissando, and multi-touch support for mobile/tablets.
- **MIDI Keyboard Support:** Plug & play with USB/Bluetooth MIDI keyboards.
- **Raag Visualizer:** Highlight keys for popular classical ragas (Yaman, Bhairav, Kafi, Bhupali, Bilaval, Malkauns, Darbari, Bageshri, Khamaj).

---

## 🚀 How to Run Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/coderharshhere/harmoniumauto.git
   cd harmoniumauto
   ```
2. Double-click `Start_Harmonium.bat` (or start a local server using Python):
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your web browser.

---

## 🎹 Full 3-Octave Keyboard Shortcuts (All 37 Keys Mapped)

All 37 keys across Mandra (Lower), Madhya (Middle), and Taar (High) Saptaks are playable directly without octave switching:

### 1. Mandra Saptak (Lower Octave 3)
- **White Keys:** `Z` (C3), `X` (D3), `C` (E3), `V` (F3), `B` (G3), `N` (A3), `M` (B3)
- **Black Keys:** `1` or `Q` (C#3), `2` (D#3), `3` (F#3), `4` (G#3), `5` (A#3)

### 2. Madhya Saptak (Middle Octave 4 — Unchanged!)
- **White Keys:** `A` (C4), `S` (D4), `D` (E4), `F` (F4), `G` (G4), `H` (A4), `J` (B4)
- **Black Keys:** `W` (C#4), `E` (D#4), `T` (F#4), `Y` (G#4), `U` (A#4)

### 3. Taar Saptak (High Octave 5 & C6)
- **White Keys:** `K` (C5), `L` (D5), `;` (E5), `'` (F5), `7` or `,` (G5), `9` or `.` (A5), `-` or `/` (B5), `=` or `\` (C6 High Sa)
- **Black Keys:** `O` (C#5), `P` (D#5), `6` or `[` (F#5), `8` or `]` (G#5), `0` (A#5)

### 4. Global Controls
- **Coupler Toggle:** `` ` `` (Backtick)
- **Audio Engine Toggle:** `Space`
