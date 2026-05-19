import { FORMANTS, DURATIONS, VOICED, textToPhonemes } from './phonemes.js';

const STOPS       = new Set(['B','D','G','P','T','K']);
const VOICED_STOP = new Set(['B','D','G']);
const FRICATIVES  = new Set(['F','TH','S','SH','HH','V','DH','Z','ZH','CH','JH']);
const NASALS      = new Set(['M','N','NG']);

export class VoiceSynthesizer {
  constructor() {
    this.ctx          = null;
    this.pitch        = 118;
    this.gain         = 0.7;
    this.speed        = 1.0;
    this.formantShift = 0;
    this.jitterDepth  = 0.007;  // fraction of pitch — micro pitch roughness
    this.breathiness  = 0.06;   // noise-to-tone ratio on voiced sounds
    this.vibrato      = 0;      // 0–1 periodic pitch oscillation depth (~5 Hz)
    this.tone         = 0;      // -1 to +1: dark (bass) ↔ bright (treble)
    this.glottalMix   = [0.60, 0.40]; // [1/n, 1/n²] harmonic weights
    this.playing      = false;
    this.stopFlag     = false;
    this.analyser     = null;
    this.onPhoneme    = null;
    this.onDone       = null;
  }

  setVoice(preset) {
    this.pitch        = preset.pitch;
    this.formantShift = preset.formantShift;
    this.jitterDepth  = preset.jitterDepth;
    this.breathiness  = preset.breathiness;
    this.vibrato      = preset.vibrato  ?? 0;
    this.tone         = preset.tone     ?? 0;
    this.glottalMix   = preset.glottalMix;
  }

  _ensureContext() {
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setPitch(hz) {
    this.pitch = hz;
    if (this._pitchNode) {
      this._pitchNode.frequency.setTargetAtTime(hz, this.ctx.currentTime, 0.03);
    }
  }

  setGain(val) {
    this.gain = val;
    if (this._userGain) {
      this._userGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  setSpeed(val)        { this.speed = Math.max(0.2, val); }
  setFormantShift(val) {
    this.formantShift = val;
    if (this._f1 && this._currentBaseFmts && this.ctx) {
      const fmts = this._shifted(this._currentBaseFmts);
      const now  = this.ctx.currentTime;
      this._f1.frequency.cancelAndHoldAtTime(now);
      this._f2.frequency.cancelAndHoldAtTime(now);
      this._f3.frequency.cancelAndHoldAtTime(now);
      this._f1.frequency.setTargetAtTime(fmts[0], now, 0.02);
      this._f2.frequency.setTargetAtTime(fmts[1], now, 0.02);
      this._f3.frequency.setTargetAtTime(fmts[2], now, 0.02);
    }
  }

  setJitter(val) {
    this.jitterDepth = val;
    if (this._jitterAmtNode && this._pitchNode && this.ctx) {
      this._jitterAmtNode.gain.setTargetAtTime(
        this._pitchNode.frequency.value * val, this.ctx.currentTime, 0.05);
    }
  }

  setBreathiness(val) {
    this.breathiness = val;
    if (this._breathGainNode && this.ctx) {
      this._breathGainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05);
    }
  }

  setVibrato(val) {
    this.vibrato = val;
    if (this._vibratoAmtNode && this._pitchNode && this.ctx) {
      this._vibratoAmtNode.gain.setTargetAtTime(
        this._pitchNode.frequency.value * val * 0.06, this.ctx.currentTime, 0.08);
    }
  }

  setTone(val) {
    this.tone = val;
    if (this._shelfNode && this.ctx) {
      // tone -1 → -22 dB shelf, 0 → -8 dB, +1 → +4 dB
      this._shelfNode.gain.setTargetAtTime(-8 + val * 14, this.ctx.currentTime, 0.05);
    }
  }

  stop() {
    this.stopFlag = true;
    const now = this.ctx?.currentTime ?? 0;
    if (this._envGain) {
      this._envGain.gain.cancelScheduledValues(now);
      this._envGain.gain.setTargetAtTime(0, now, 0.01);
    }
    try { this._oscNode?.stop();      } catch {}
    try { this._noiseNode?.stop();    } catch {}
    try { this._jitterNode?.stop();   } catch {}
    try { this._vibratoNode?.stop();  } catch {}
    this._stopResolve?.();
  }

  _shifted(base) {
    const m = 1 + this.formantShift;
    return [
      Math.max(200,  Math.min(base[0] * m, 1100)),
      Math.max(500,  Math.min(base[1] * m, 3400)),
      Math.max(1500, Math.min(base[2] * m, 4200)),
    ];
  }

  // Glottal pulse spectrum: blend of sawtooth (1/n) and rounder pulse (1/n²)
  _makeGlottalWave() {
    const [w1, w2] = this.glottalMix;
    const N = 50;
    const real = new Float32Array(N + 1);
    const imag = new Float32Array(N + 1);
    for (let n = 1; n <= N; n++) {
      imag[n] = w1 / n + w2 / (n * n);
    }
    return this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  // Accept pre-built phoneme array (used by IPA mode and music mode)
  // opts.pitchSeq: optional Hz array (one per non-pause phoneme) overrides intonation
  async speakPhonemes(phonemes, opts = {}) {
    return this._run(phonemes, opts);
  }

  async speak(text, opts = {}) {
    return this.speakPhonemes(textToPhonemes(text), opts);
  }

  async _run(phonemesArg, opts = {}) {
    const preBuiltPhonemes = phonemesArg;
    const pitchSeq = opts.pitchSeq ?? null; // null = use intonation declination
    if (this.playing) {
      this.stop();
      await new Promise(r => setTimeout(r, 100));
    }

    this._ensureContext();
    this.stopFlag = false;
    this.playing  = true;

    const ctx = this.ctx;

    // ── Glottal oscillator ────────────────────────────────────────────────────
    const osc = ctx.createOscillator();
    osc.setPeriodicWave(this._makeGlottalWave());
    osc.frequency.value = this.pitch;
    this._pitchNode = osc;

    // Micro-jitter LFO (~7–8 Hz, randomised slightly each run)
    const jitterOsc = ctx.createOscillator();
    jitterOsc.frequency.value = 6.8 + Math.random() * 1.5;
    const jitterAmt = ctx.createGain();
    jitterAmt.gain.value = this.pitch * this.jitterDepth;
    jitterOsc.connect(jitterAmt);
    jitterAmt.connect(osc.frequency);
    this._jitterAmtNode = jitterAmt;

    // Vibrato LFO (~5 Hz, smooth sinusoidal — distinct from jitter)
    const vibratoOsc = ctx.createOscillator();
    vibratoOsc.frequency.value = 5.1;
    const vibratoAmt = ctx.createGain();
    vibratoAmt.gain.value = this.pitch * this.vibrato * 0.06;
    vibratoOsc.connect(vibratoAmt);
    vibratoAmt.connect(osc.frequency);
    this._vibratoAmtNode = vibratoAmt;

    // ── Noise source ──────────────────────────────────────────────────────────
    const bufSz = ctx.sampleRate * 2;
    const nbuf  = ctx.createBuffer(1, bufSz, ctx.sampleRate);
    const nd    = nbuf.getChannelData(0);
    for (let i = 0; i < bufSz; i++) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = nbuf;
    noise.loop   = true;

    // ── Source mix ────────────────────────────────────────────────────────────
    const voicedGain    = ctx.createGain();
    const unvoicedGain  = ctx.createGain();
    const breathGain    = ctx.createGain(); // always-on whisper
    voicedGain.gain.value   = 1;
    unvoicedGain.gain.value = 0;
    breathGain.gain.value   = this.breathiness;
    this._breathGainNode = breathGain;

    osc.connect(voicedGain);
    noise.connect(unvoicedGain);
    noise.connect(breathGain);

    // Pre-mix of all sources
    const preMix = ctx.createGain();
    preMix.gain.value = 1;
    voicedGain.connect(preMix);
    unvoicedGain.connect(preMix);
    breathGain.connect(preMix);

    // ── Formant filters (peaking EQ, in cascade / series) ────────────────────
    // Peaking filters boost a frequency band; chaining them adds three formant
    // peaks to the source spectrum — the standard Klatt cascade topology.
    const f1 = ctx.createBiquadFilter();
    f1.type = 'peaking'; f1.frequency.value = 500;  f1.Q.value = 3.5; f1.gain.value = 18;
    const f2 = ctx.createBiquadFilter();
    f2.type = 'peaking'; f2.frequency.value = 1500; f2.Q.value = 5.0; f2.gain.value = 14;
    const f3 = ctx.createBiquadFilter();
    f3.type = 'peaking'; f3.frequency.value = 2500; f3.Q.value = 7.0; f3.gain.value = 10;
    this._f1 = f1; this._f2 = f2; this._f3 = f3;

    // High-shelf — tone parameter shifts this from dark (-22 dB) to bright (+4 dB)
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'highshelf';
    shelf.frequency.value = 3500;
    shelf.gain.value = -8 + this.tone * 14;
    this._shelfNode = shelf;

    // Lowpass to cut noise alias above vocal range
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5500; lp.Q.value = 0.7;

    const cascadeGain = ctx.createGain();
    cascadeGain.gain.value = 1;

    preMix.connect(f1);
    f1.connect(f2);
    f2.connect(f3);
    f3.connect(shelf);
    shelf.connect(lp);
    lp.connect(cascadeGain);

    // ── Envelope gain ─────────────────────────────────────────────────────────
    const envGain = ctx.createGain();
    envGain.gain.value = 0.001;
    cascadeGain.connect(envGain);
    this._envGain = envGain;

    // ── Analyser + user gain + output ─────────────────────────────────────────
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    this.analyser = analyser;

    const userGain = ctx.createGain();
    userGain.gain.value = this.gain;
    this._userGain = userGain;

    envGain.connect(userGain);
    userGain.connect(analyser);
    analyser.connect(ctx.destination);

    // Store source nodes so stop() can kill them immediately
    this._oscNode     = osc;
    this._noiseNode   = noise;
    this._jitterNode  = jitterOsc;
    this._vibratoNode = vibratoOsc;

    osc.start();
    noise.start();
    jitterOsc.start();
    vibratoOsc.start();

    // ── Phoneme sequencer ─────────────────────────────────────────────────────
    const phonemes = preBuiltPhonemes;

    // Total duration for intonation curve (only used when no pitchSeq)
    const totalDur = phonemes
      .filter(p => p !== '_PAUSE' && FORMANTS[p])
      .reduce((s, p) => s + (DURATIONS[p] ?? 0.12) / this.speed, 0);

    let t        = ctx.currentTime + 0.07;
    let elapsed  = 0;
    let pitchIdx = 0; // index into pitchSeq

    for (let idx = 0; idx < phonemes.length; idx++) {
      if (this.stopFlag) break;

      const ph = phonemes[idx];

      if (ph === '_PAUSE') {
        t       += 0.14 / this.speed;
        elapsed += 0.14 / this.speed;
        if (pitchSeq) pitchIdx++;
        const pauseWait = Math.max(0, (t - ctx.currentTime - 0.05) * 1000);
        if (pauseWait > 5) {
          await new Promise(resolve => { this._stopResolve = resolve; setTimeout(resolve, pauseWait); });
          if (this.stopFlag) break;
        }
        continue;
      }

      const base = FORMANTS[ph];
      if (!base) continue;

      this._currentBaseFmts = base;
      const dur    = (DURATIONS[ph] ?? 0.12) / this.speed;
      const fmts   = this._shifted(base);
      const voiced = VOICED[ph] ?? true;
      const isStop = STOPS.has(ph);
      const isFric = FRICATIVES.has(ph);
      const isNasal= NASALS.has(ph);
      const isVStop= VOICED_STOP.has(ph);

      // Fire callback at playback time (not schedule time)
      if (this.onPhoneme) {
        const delay = Math.max(0, (t - ctx.currentTime) * 1000);
        const phCopy = ph;
        setTimeout(() => { if (!this.stopFlag) this.onPhoneme?.(phCopy); }, delay);
      }

      // ── Pitch: scale-based or natural intonation declination ──────────────
      let f0;
      if (pitchSeq) {
        f0 = pitchSeq[pitchIdx] ?? this.pitch;
        pitchIdx++;
      } else {
        const prog = Math.min(elapsed / Math.max(totalDur, 0.1), 1);
        f0 = this.pitch * (1.12 - 0.20 * prog);
      }
      // Smooth glide to new pitch — longer glide for musical effect
      const pitchGlide = pitchSeq ? Math.min(dur * 0.6, 0.08) : dur * 0.5;
      osc.frequency.linearRampToValueAtTime(f0, t + pitchGlide);
      jitterAmt.gain.setTargetAtTime(f0 * this.jitterDepth,      t, 0.1);
      vibratoAmt.gain.setTargetAtTime(f0 * this.vibrato * 0.06,  t, 0.1);

      // ── Formant glide to target ────────────────────────────────────────────
      const glide = Math.min(dur * 0.45, 0.05);
      f1.frequency.linearRampToValueAtTime(fmts[0], t + glide);
      f2.frequency.linearRampToValueAtTime(fmts[1], t + glide);
      f3.frequency.linearRampToValueAtTime(fmts[2], t + glide);

      // ── Articulation ───────────────────────────────────────────────────────
      const r = Math.min(0.018, dur * 0.1); // crossfade ramp constant

      if (isStop) {
        // Closure: silence for ~40% of phoneme duration
        const closureDur = dur * 0.40;
        const burstT     = t + closureDur;

        envGain.gain.setTargetAtTime(0.001, t, 0.006);
        voicedGain.gain.setTargetAtTime(0,   t, 0.005);
        unvoicedGain.gain.setTargetAtTime(0, t, 0.005);

        // Burst
        unvoicedGain.gain.setTargetAtTime(isVStop ? 0.4 : 0.9, burstT, 0.003);
        envGain.gain.linearRampToValueAtTime(0.9, burstT + 0.007);
        envGain.gain.setTargetAtTime(0.35, burstT + 0.020, 0.010);

        if (isVStop) {
          const votT = burstT + 0.015;
          voicedGain.gain.setTargetAtTime(1,    votT, r);
          unvoicedGain.gain.setTargetAtTime(0,  votT, r);
          breathGain.gain.setTargetAtTime(this.breathiness, votT, r);
          envGain.gain.setTargetAtTime(1,       votT, r);
        } else {
          // Aspiration (~45ms) then voice onset
          const aspT = burstT + 0.010;
          const votT = aspT  + 0.045;
          unvoicedGain.gain.setTargetAtTime(0.7,  aspT, 0.005);
          breathGain.gain.setTargetAtTime(this.breathiness * 4, aspT, 0.005);
          envGain.gain.setTargetAtTime(0.5,        aspT, 0.010);
          voicedGain.gain.setTargetAtTime(1,       votT, r);
          unvoicedGain.gain.setTargetAtTime(0,     votT, r);
          breathGain.gain.setTargetAtTime(this.breathiness, votT, r);
          envGain.gain.setTargetAtTime(1,          votT, r);
        }

      } else if (isFric) {
        voicedGain.gain.setTargetAtTime(voiced ? 0.6 : 0,   t, r);
        unvoicedGain.gain.setTargetAtTime(voiced ? 0.4 : 1, t, r);
        breathGain.gain.setTargetAtTime(this.breathiness * 2.5, t, r);
        envGain.gain.setTargetAtTime(0.001, t, 0.005);
        envGain.gain.linearRampToValueAtTime(0.95, t + dur * 0.10);

      } else if (isNasal) {
        voicedGain.gain.setTargetAtTime(1,    t, r);
        unvoicedGain.gain.setTargetAtTime(0,  t, r);
        breathGain.gain.setTargetAtTime(this.breathiness * 0.3, t, r);
        // Nasals are lower amplitude (approximate antiformant effect)
        envGain.gain.setTargetAtTime(0.001, t, 0.006);
        envGain.gain.linearRampToValueAtTime(0.50, t + dur * 0.15);

      } else {
        // Vowels and approximants
        voicedGain.gain.setTargetAtTime(1,    t, r);
        unvoicedGain.gain.setTargetAtTime(0,  t, r);
        breathGain.gain.setTargetAtTime(this.breathiness, t, r);
        const atk = dur * 0.08;
        const rel = dur * 0.20;
        envGain.gain.setTargetAtTime(0.001, t, 0.005);
        envGain.gain.linearRampToValueAtTime(1.0, t + atk);
        envGain.gain.setTargetAtTime(0.92, t + dur - rel, 0.012);
        envGain.gain.setTargetAtTime(0.30, t + dur,       0.020);
      }

      t       += dur;
      elapsed += dur;

      // Await until ~50ms before this phoneme ends so next phoneme re-reads live params
      const waitMs = Math.max(0, (t - ctx.currentTime - 0.05) * 1000);
      if (waitMs > 5) {
        await new Promise(resolve => { this._stopResolve = resolve; setTimeout(resolve, waitMs); });
        if (this.stopFlag) break;
      }
    }

    // Final fade
    envGain.gain.setTargetAtTime(0, t, 0.06);
    t += 0.3;

    // Wait for playback to finish — but bail out immediately if stop() fires
    await new Promise(resolve => {
      this._stopResolve = resolve;
      setTimeout(resolve, Math.max(80, (t - ctx.currentTime) * 1000 + 150));
    });

    try { osc.stop();        } catch {}
    try { noise.stop();      } catch {}
    try { jitterOsc.stop();  } catch {}
    try { vibratoOsc.stop(); } catch {}

    this.playing          = false;
    this.analyser         = null;
    this._pitchNode       = null;
    this._userGain        = null;
    this._envGain         = null;
    this._shelfNode       = null;
    this._oscNode         = null;
    this._noiseNode       = null;
    this._jitterNode      = null;
    this._jitterAmtNode   = null;
    this._vibratoNode     = null;
    this._vibratoAmtNode  = null;
    this._breathGainNode  = null;
    this._f1              = null;
    this._f2              = null;
    this._f3              = null;
    this._currentBaseFmts = null;
    this._stopResolve     = null;
    if (this.onDone) this.onDone();
  }
}
