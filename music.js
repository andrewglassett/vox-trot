// Music theory: scales, modes, traversal patterns

export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

export const MODES = {
  Ionian:     [0, 2, 4, 5, 7, 9, 11],  // major
  Dorian:     [0, 2, 3, 5, 7, 9, 10],
  Phrygian:   [0, 1, 3, 5, 7, 8, 10],
  Lydian:     [0, 2, 4, 6, 7, 9, 11],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10],
  Aeolian:    [0, 2, 3, 5, 7, 8, 10],  // natural minor
  Locrian:    [0, 1, 3, 5, 6, 8, 10],
};

export const PATTERNS = ['Up', 'Down', 'Up / Down', 'Random'];

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// MIDI note number for a note name at a given octave (C4 = 60)
function noteToMidi(name, octave) {
  return 12 * (octave + 1) + NOTES.indexOf(name);
}

// Build a flat array of Hz values for the scale spanning numOctaves octaves.
// Includes the top octave root so up/down patterns land cleanly.
export function buildScale(rootNote, modeName, octave = 3, numOctaves = 2) {
  const intervals = MODES[modeName];
  const rootMidi  = noteToMidi(rootNote, octave);
  const freqs = [];
  for (let o = 0; o < numOctaves; o++) {
    for (const iv of intervals) {
      freqs.push(midiToHz(rootMidi + o * 12 + iv));
    }
  }
  freqs.push(midiToHz(rootMidi + numOctaves * 12)); // top root
  return freqs;
}

// Stateful traverser — call .next() once per tonal phoneme
export class ScaleTraverser {
  constructor(scale, pattern) {
    this.scale   = scale;
    this.pattern = pattern;
    this._idx    = pattern === 'Down' ? scale.length - 1 : 0;
    this._dir    = 1;
  }

  next() {
    const { scale, pattern } = this;
    const len = scale.length;

    if (pattern === 'Random') {
      return scale[Math.floor(Math.random() * len)];
    }

    const freq = scale[this._idx];

    if (pattern === 'Up') {
      this._idx = (this._idx + 1) % len;
    } else if (pattern === 'Down') {
      this._idx = (this._idx - 1 + len) % len;
    } else {
      // Up / Down (pendulum)
      this._idx += this._dir;
      if (this._idx >= len - 1) { this._idx = len - 1; this._dir = -1; }
      else if (this._idx <= 0)  { this._idx = 0;       this._dir =  1; }
    }

    return freq;
  }
}

// Phonemes that carry musical pitch (vowels, nasals, approximants).
// Stops and fricatives inherit the previous tonal pitch.
export const TONAL_PHONEMES = new Set([
  'AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW',
  'W','Y','R','L','M','N','NG',
]);

// Given a phoneme list and a ScaleTraverser, return a parallel pitch-Hz array
// (one entry per non-pause phoneme, undefined entries for pauses).
export function buildPitchSequence(phonemes, traverser) {
  const seq = [];
  let last = traverser.next(); // seed so first consonant has a pitch
  for (const ph of phonemes) {
    if (ph === '_PAUSE') { seq.push(null); continue; }
    if (TONAL_PHONEMES.has(ph)) last = traverser.next();
    seq.push(last);
  }
  return seq;
}
