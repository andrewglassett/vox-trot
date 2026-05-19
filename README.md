# Vox Trot

**Live demo: https://andrewglassett.github.io/vox-trot**

A browser-based formant voice synthesizer built entirely with the Web Audio API — no samples, no external libraries. Type text (or enter IPA), pick a voice and a musical scale, and hear synthesized speech shaped by acoustic formants.

## Features

- **Pure formant synthesis** — voiced speech generated from a glottal pulse source filtered through resonant peaks (F1/F2/F3), modeled after the Klatt synthesizer architecture
- **Text-to-phoneme G2P** — grapheme-to-phoneme engine with a ~200-word exception dictionary and digraph rules covering common English spelling patterns
- **IPA input** — switch to phonetic mode and use the built-in IPA character picker
- **6 voice presets** — Reed, Lark, Cove, Wren, Dusk, Vale — each with tuned pitch, formant shift, jitter, breathiness, vibrato, tone, and glottal mix
- **8 live controls** — adjust Pitch, Gain, Speed, Formant Shift, Jitter, Breathiness, Vibrato, and Tone in real time, even during playback
- **Musical scales** — choose a root note, one of 7 modes (Ionian through Locrian), and a traversal pattern (Up, Down, Up/Down, Random); select any subset of notes for monotone or pitched speech
- **Oscilloscope** — live waveform display while speaking

## Usage

1. Open the [live demo](https://andrewglassett.github.io/vox-trot) in a modern browser (Chrome recommended)
2. Select a voice preset or adjust sliders manually
3. Type text in the input box (or switch to IPA mode)
4. Optionally configure the musical scale and note selection
5. Click **Speak** — click **Stop** to interrupt at any time

## Running locally

```bash
cd vox-trot
python3 -m http.server 8743
# open http://localhost:8743
```

Requires a browser with Web Audio API support. No build step needed — plain ES modules.

## Technical notes

- **Formant synthesis**: source spectrum from a custom `PeriodicWave` glottal pulse, shaped by a cascade of peaking EQ filters (bell curves) at F1/F2/F3. Peaking rather than bandpass avoids mutual cancellation.
- **Stop consonants**: modeled with a closure gap (gain→0), short burst, and aspiration noise layer.
- **Pitch**: per-phoneme pitch targets fed via `linearRampToValueAtTime`; tonal phonemes (vowels, nasals, approximants) advance the scale traverser.
- **Live updates**: all synthesis node references are stored on the synth instance so sliders update `AudioParam` values mid-phoneme via `setTargetAtTime`.
