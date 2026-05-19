// Voice model presets
// Parameters: pitch, formantShift, jitterDepth, breathiness, vibrato, tone, glottalMix

export const VOICES = [
  {
    id:           'reed',
    name:         'Reed',
    desc:         'Neutral male',
    pitch:        118,
    formantShift: 0.00,
    jitterDepth:  0.007,
    breathiness:  0.06,
    vibrato:      0.0,    // flat — no wobble
    tone:         0.0,    // neutral
    glottalMix:   [0.60, 0.40],
  },
  {
    id:           'lark',
    name:         'Lark',
    desc:         'Bright female',
    pitch:        215,
    formantShift: 0.20,
    jitterDepth:  0.009,
    breathiness:  0.12,
    vibrato:      0.25,   // gentle warmth
    tone:         0.5,    // brighter
    glottalMix:   [0.48, 0.52],
  },
  {
    id:           'cove',
    name:         'Cove',
    desc:         'Deep bass',
    pitch:        70,
    formantShift: -0.22,
    jitterDepth:  0.005,
    breathiness:  0.04,
    vibrato:      0.0,    // steady
    tone:         -0.6,   // dark, bass-heavy
    glottalMix:   [0.72, 0.28],
  },
  {
    id:           'wren',
    name:         'Wren',
    desc:         'Young / bright',
    pitch:        272,
    formantShift: 0.32,
    jitterDepth:  0.011,
    breathiness:  0.14,
    vibrato:      0.15,   // lively
    tone:         0.7,    // very bright
    glottalMix:   [0.42, 0.58],
  },
  {
    id:           'dusk',
    name:         'Dusk',
    desc:         'Aged / gravelly',
    pitch:        86,
    formantShift: -0.06,
    jitterDepth:  0.024,  // heavy jitter = roughness
    breathiness:  0.22,   // breathy
    vibrato:      0.1,    // slight tremor
    tone:         -0.3,
    glottalMix:   [0.66, 0.34],
  },
  {
    id:           'vale',
    name:         'Vale',
    desc:         'Soft / androgynous',
    pitch:        160,
    formantShift: 0.07,
    jitterDepth:  0.004,  // very stable
    breathiness:  0.10,
    vibrato:      0.35,   // expressive
    tone:         0.1,
    glottalMix:   [0.38, 0.62], // round, mellow pulse
  },
];
