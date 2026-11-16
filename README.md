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

## 🎹 Keyboard Shortcuts

| Key | Note / Action |
| --- | --- |
| `A`, `S`, `D`, `F`, `G`, `H`, `J`, `K` | White keys (Sa, Re, Ga, Ma, Pa, Dha, Ni, Taar Sa) |
| `W`, `E`, `T`, `Y`, `U`, `O`, `P` | Black keys (Komal Re, Komal Ga, Teevra Ma, etc.) |
| `Z` / `X` | Shift octave lower / higher |
| `C` | Toggle Octave Coupler |
| `Space` | Start / Stop Audio Engine |
