// ARPAbet formant data and text-to-phoneme conversion
// Formants [F1, F2, F3] in Hz (Peterson & Barney male averages)

export const FORMANTS = {
  // Vowels
  'AA': [730, 1090, 2440], // f-a-ther
  'AE': [660, 1720, 2410], // c-a-t
  'AH': [520, 1190, 2390], // c-u-t, th-e
  'AO': [570,  840, 2410], // c-augh-t, b-o-re
  'AW': [600, 1000, 2500], // c-ow
  'AY': [600, 1700, 2500], // b-ite (onset → glides toward IY)
  'EH': [530, 1840, 2480], // b-e-d
  'ER': [490, 1350, 1690], // b-ir-d  (retroflex — low F3!)
  'EY': [400, 2000, 2550], // b-a-ke
  'IH': [390, 1990, 2550], // b-i-t
  'IY': [270, 2290, 3010], // b-ea-t
  'OW': [450, 1030, 2380], // b-oa-t
  'OY': [450, 1030, 2380], // b-oy (onset)
  'UH': [440, 1020, 2240], // b-oo-k
  'UW': [300,  870, 2240], // b-oo-t
  // Approximants
  'W':  [300,  610, 2200],
  'Y':  [280, 2230, 3000],
  'R':  [460, 1190, 1700], // low F3 = key R cue
  'L':  [360,  880, 2500],
  // Nasals
  'M':  [250, 1000, 2200],
  'N':  [250, 1100, 2300],
  'NG': [250, 1000, 2100],
  // Voiced fricatives
  'V':  [280, 1100, 2300],
  'DH': [280, 1100, 2300],
  'Z':  [280, 1500, 2500],
  'ZH': [280, 1600, 2500],
  // Voiceless fricatives
  'F':  [280, 1100, 2300],
  'TH': [280, 1100, 2300],
  'S':  [280, 1500, 6500],
  'SH': [280, 1900, 2800],
  'HH': [520, 1190, 2390],
  // Stops (formants used during vowel onset/offset transitions)
  'B':  [200,  900, 2200],
  'D':  [200, 1700, 2600],
  'G':  [200, 1500, 2500],
  'P':  [200,  900, 2200],
  'T':  [200, 1700, 2600],
  'K':  [200, 1500, 2500],
  // Affricates
  'CH': [280, 1800, 2800],
  'JH': [280, 1800, 2800],
};

// Duration in seconds at normal speed (1×)
export const DURATIONS = {
  'AA':0.18,'AE':0.17,'AH':0.13,'AO':0.17,'AW':0.20,'AY':0.20,
  'EH':0.15,'ER':0.17,'EY':0.19,'IH':0.12,'IY':0.15,'OW':0.19,
  'OY':0.20,'UH':0.14,'UW':0.17,
  'W': 0.09,'Y': 0.08,'R': 0.11,'L': 0.10,
  'M': 0.12,'N': 0.11,'NG':0.13,
  'V': 0.10,'DH':0.10,'Z': 0.10,'ZH':0.10,
  'F': 0.11,'TH':0.11,'S': 0.12,'SH':0.12,'HH':0.09,
  'B': 0.09,'D': 0.09,'G': 0.09,'P': 0.10,'T': 0.10,'K': 0.10,
  'CH':0.13,'JH':0.12,
};

// true = voiced (oscillator), false = noise dominant
export const VOICED = {
  'AA':true,'AE':true,'AH':true,'AO':true,'AW':true,'AY':true,
  'EH':true,'ER':true,'EY':true,'IH':true,'IY':true,'OW':true,
  'OY':true,'UH':true,'UW':true,
  'W':true,'Y':true,'R':true,'L':true,
  'M':true,'N':true,'NG':true,
  'V':true,'DH':true,'Z':true,'ZH':true,
  'F':false,'TH':false,'S':false,'SH':false,'HH':false,
  'B':true,'D':true,'G':true,'P':false,'T':false,'K':false,
  'CH':false,'JH':true,
};

// ─── Text → phoneme conversion ────────────────────────────────────────────────

export function textToPhonemes(text) {
  const words = text.toLowerCase().replace(/[^a-z '\-]/g, '').trim().split(/\s+/);
  const result = [];
  for (const word of words) {
    if (!word) continue;
    const phs = wordToPhonemes(word);
    if (phs.length) result.push(...phs, '_PAUSE');
  }
  return result;
}

// ─── Exception dictionary (ARPAbet) ──────────────────────────────────────────

const D = {
  a:     ['AH'],
  an:    ['AE','N'],
  and:   ['AE','N','D'],
  are:   ['AA','R'],
  as:    ['AE','Z'],
  at:    ['AE','T'],
  be:    ['B','IY'],
  been:  ['B','IH','N'],
  but:   ['B','AH','T'],
  by:    ['B','AY'],
  can:   ['K','AE','N'],
  come:  ['K','AH','M'],
  could: ['K','UH','D'],
  day:   ['D','EY'],
  do:    ['D','UW'],
  does:  ['D','AH','Z'],
  done:  ['D','AH','N'],
  door:  ['D','AO','R'],
  down:  ['D','AW','N'],
  each:  ['IY','CH'],
  even:  ['IY','V','AH','N'],
  every: ['EH','V','R','IY'],
  eye:   ['AY'],
  for:   ['F','AO','R'],
  four:  ['F','AO','R'],
  from:  ['F','R','AH','M'],
  get:   ['G','EH','T'],
  give:  ['G','IH','V'],
  go:    ['G','OW'],
  goes:  ['G','OW','Z'],
  gone:  ['G','AO','N'],
  good:  ['G','UH','D'],
  great: ['G','R','EY','T'],
  had:   ['HH','AE','D'],
  has:   ['HH','AE','Z'],
  have:  ['HH','AE','V'],
  he:    ['HH','IY'],
  hear:  ['HH','IH','R'],
  her:   ['HH','ER'],
  here:  ['HH','IH','R'],
  him:   ['HH','IH','M'],
  his:   ['HH','IH','Z'],
  how:   ['HH','AW'],
  i:     ['AY'],
  if:    ['IH','F'],
  in:    ['IH','N'],
  into:  ['IH','N','T','UW'],
  is:    ['IH','Z'],
  it:    ['IH','T'],
  its:   ['IH','T','S'],
  just:  ['JH','AH','S','T'],
  keep:  ['K','IY','P'],
  know:  ['N','OW'],
  large: ['L','AA','R','JH'],
  last:  ['L','AE','S','T'],
  left:  ['L','EH','F','T'],
  life:  ['L','AY','F'],
  like:  ['L','AY','K'],
  live:  ['L','IH','V'],
  long:  ['L','AO','NG'],
  look:  ['L','UH','K'],
  love:  ['L','AH','V'],
  made:  ['M','EY','D'],
  make:  ['M','EY','K'],
  man:   ['M','AE','N'],
  many:  ['M','EH','N','IY'],
  may:   ['M','EY'],
  me:    ['M','IY'],
  men:   ['M','EH','N'],
  more:  ['M','AO','R'],
  most:  ['M','OW','S','T'],
  move:  ['M','UW','V'],
  much:  ['M','AH','CH'],
  my:    ['M','AY'],
  name:  ['N','EY','M'],
  new:   ['N','UW'],
  no:    ['N','OW'],
  not:   ['N','AA','T'],
  now:   ['N','AW'],
  of:    ['AH','V'],
  off:   ['AO','F'],
  old:   ['OW','L','D'],
  on:    ['AO','N'],
  one:   ['W','AH','N'],
  only:  ['OW','N','L','IY'],
  or:    ['AO','R'],
  our:   ['AW','R'],
  out:   ['AW','T'],
  over:  ['OW','V','ER'],
  own:   ['OW','N'],
  part:  ['P','AA','R','T'],
  place: ['P','L','EY','S'],
  play:  ['P','L','EY'],
  put:   ['P','UH','T'],
  read:  ['R','IY','D'],
  right: ['R','AY','T'],
  said:  ['S','EH','D'],
  same:  ['S','EY','M'],
  say:   ['S','EY'],
  see:   ['S','IY'],
  she:   ['SH','IY'],
  should:['SH','UH','D'],
  show:  ['SH','OW'],
  side:  ['S','AY','D'],
  so:    ['S','OW'],
  some:  ['S','AH','M'],
  such:  ['S','AH','CH'],
  take:  ['T','EY','K'],
  tell:  ['T','EH','L'],
  than:  ['DH','AE','N'],
  that:  ['DH','AE','T'],
  the:   ['DH','AH'],
  their: ['DH','EH','R'],
  them:  ['DH','EH','M'],
  then:  ['DH','EH','N'],
  there: ['DH','EH','R'],
  these: ['DH','IY','Z'],
  they:  ['DH','EY'],
  this:  ['DH','IH','S'],
  those: ['DH','OW','Z'],
  three: ['TH','R','IY'],
  through:['TH','R','UW'],
  time:  ['T','AY','M'],
  to:    ['T','UW'],
  too:   ['T','UW'],
  turn:  ['T','ER','N'],
  two:   ['T','UW'],
  up:    ['AH','P'],
  use:   ['Y','UW','Z'],
  very:  ['V','EH','R','IY'],
  want:  ['W','AA','N','T'],
  was:   ['W','AH','Z'],
  way:   ['W','EY'],
  we:    ['W','IY'],
  well:  ['W','EH','L'],
  went:  ['W','EH','N','T'],
  were:  ['W','ER'],
  what:  ['W','AH','T'],
  when:  ['W','EH','N'],
  where: ['W','EH','R'],
  which: ['W','IH','CH'],
  while: ['W','AY','L'],
  who:   ['HH','UW'],
  will:  ['W','IH','L'],
  with:  ['W','IH','DH'],
  word:  ['W','ER','D'],
  words: ['W','ER','D','Z'],
  work:  ['W','ER','K'],
  world: ['W','ER','L','D'],
  would: ['W','UH','D'],
  year:  ['Y','IH','R'],
  years: ['Y','IH','R','Z'],
  you:   ['Y','UW'],
  your:  ['Y','AO','R'],
  // Numbers
  zero:  ['Z','IH','R','OW'],
  one:   ['W','AH','N'],
  two:   ['T','UW'],
  three: ['TH','R','IY'],
  four:  ['F','AO','R'],
  five:  ['F','AY','V'],
  six:   ['S','IH','K','S'],
  seven: ['S','EH','V','AH','N'],
  eight: ['EY','T'],
  nine:  ['N','AY','N'],
  ten:   ['T','EH','N'],
  // Common tech / demo words
  hello: ['HH','AH','L','OW'],
  hi:    ['HH','AY'],
  hey:   ['HH','EY'],
  voice: ['V','OY','S'],
  sound: ['S','AW','N','D'],
  speak: ['S','P','IY','K'],
  speech:['S','P','IY','CH'],
  synth: ['S','IH','N','TH'],
  synthesizer:['S','IH','N','TH','AH','S','AY','Z','ER'],
  text:  ['T','EH','K','S','T'],
  type:  ['T','AY','P'],
  enter: ['EH','N','T','ER'],
  frequency:['F','R','IY','K','W','AH','N','S','IY'],
  pitch: ['P','IH','CH'],
  tone:  ['T','OW','N'],
  music: ['M','Y','UW','Z','IH','K'],
  sound: ['S','AW','N','D'],
  human: ['HH','Y','UW','M','AH','N'],
  language:['L','AE','NG','G','W','IH','JH'],
  english:['IH','NG','G','L','IH','SH'],
  people:['P','IY','P','AH','L'],
  think: ['TH','IH','NG','K'],
  thing: ['TH','IH','NG'],
  things:['TH','IH','NG','Z'],
  about: ['AH','B','AW','T'],
  after: ['AE','F','T','ER'],
  again: ['AH','G','EH','N'],
  also:  ['AO','L','S','OW'],
  always:['AO','L','W','EY','Z'],
  another:['AH','N','AH','DH','ER'],
  any:   ['EH','N','IY'],
  back:  ['B','AE','K'],
  because:['B','IH','K','AH','Z'],
  before:['B','IH','F','AO','R'],
  being: ['B','IY','IH','NG'],
  between:['B','IH','T','W','IY','N'],
  both:  ['B','OW','TH'],
  call:  ['K','AO','L'],
  called:['K','AO','L','D'],
  change:['CH','EY','N','JH'],
  different:['D','IH','F','ER','AH','N','T'],
  find:  ['F','AY','N','D'],
  first: ['F','ER','S','T'],
  found: ['F','AW','N','D'],
  give:  ['G','IH','V'],
  given: ['G','IH','V','AH','N'],
  going: ['G','OW','IH','NG'],
  good:  ['G','UH','D'],
  hand:  ['HH','AE','N','D'],
  head:  ['HH','EH','D'],
  high:  ['HH','AY'],
  home:  ['HH','OW','M'],
  house: ['HH','AW','S'],
  important:['IH','M','P','AO','R','T','AH','N','T'],
  know:  ['N','OW'],
  known: ['N','OW','N'],
  large: ['L','AA','R','JH'],
  later: ['L','EY','T','ER'],
  leave: ['L','IY','V'],
  light: ['L','AY','T'],
  little:['L','IH','T','AH','L'],
  might: ['M','AY','T'],
  mind:  ['M','AY','N','D'],
  move:  ['M','UW','V'],
  much:  ['M','AH','CH'],
  need:  ['N','IY','D'],
  never: ['N','EH','V','ER'],
  next:  ['N','EH','K','S','T'],
  night: ['N','AY','T'],
  number:['N','AH','M','B','ER'],
  often: ['AO','F','AH','N'],
  open:  ['OW','P','AH','N'],
  order: ['AO','R','D','ER'],
  other: ['AH','DH','ER'],
  point: ['P','OY','N','T'],
  power: ['P','AW','ER'],
  real:  ['R','IY','L'],
  really:['R','IY','L','IY'],
  same:  ['S','EY','M'],
  second:['S','EH','K','AH','N','D'],
  set:   ['S','EH','T'],
  since: ['S','IH','N','S'],
  small: ['S','M','AO','L'],
  still: ['S','T','IH','L'],
  though:['DH','OW'],
  thought:['TH','AO','T'],
  today: ['T','AH','D','EY'],
  together:['T','AH','G','EH','DH','ER'],
  try:   ['T','R','AY'],
  under: ['AH','N','D','ER'],
  until: ['AH','N','T','IH','L'],
  upon:  ['AH','P','AO','N'],
  used:  ['Y','UW','Z','D'],
  using: ['Y','UW','Z','IH','NG'],
  water: ['W','AO','T','ER'],
  while: ['W','AY','L'],
  without:['W','IH','DH','AW','T'],
  wrote: ['R','OW','T'],
};

function wordToPhonemes(word) {
  if (D[word]) return [...D[word]];
  return g2p(word);
}

// ─── Rule-based G2P ───────────────────────────────────────────────────────────

function isVowelChar(c) { return 'aeiou'.includes(c); }

function g2p(w) {
  const result = [];
  let i = 0;
  const len = w.length;

  while (i < len) {
    if (i >= len) break;
    const rem = w.slice(i);
    const c   = w[i];
    const next = w[i+1] || '';
    const prev = i > 0 ? w[i-1] : '';

    // ── Multi-character clusters (longest match first) ─────────────────────

    if (rem.startsWith('tch'))   { result.push('CH');        i+=3; continue; }
    if (rem.startsWith('tion'))  { result.push('SH','AH','N'); i+=4; continue; }
    if (rem.startsWith('sion'))  { result.push('ZH','AH','N'); i+=4; continue; }
    if (rem.startsWith('ight'))  { result.push('AY','T');     i+=4; continue; }
    if (rem.startsWith('ould'))  { result.push('UH','D');     i+=4; continue; }
    if (rem.startsWith('ough'))  {
      // "ough" has many pronunciations; most common: OW
      result.push('OW'); i+=4; continue;
    }
    if (rem.startsWith('igh'))   { result.push('AY');        i+=3; continue; }
    if (rem.startsWith('sch'))   { result.push('S','K');     i+=3; continue; }
    if (rem.startsWith('psy'))   { result.push('S');         i+=2; continue; } // silent p
    if (rem.startsWith('kn'))    { result.push('N');         i+=2; continue; } // silent k
    if (rem.startsWith('wr'))    { result.push('R');         i+=2; continue; } // silent w
    if (rem.startsWith('gn') && i === 0) { result.push('N'); i+=2; continue; } // gnat
    if (rem.startsWith('mb') && i === len-2) { result.push('M'); i+=2; continue; } // lamb

    if (rem.startsWith('ck'))    { result.push('K');         i+=2; continue; }
    if (rem.startsWith('qu'))    { result.push('K','W');     i+=2; continue; }
    if (rem.startsWith('ch'))    { result.push('CH');        i+=2; continue; }
    if (rem.startsWith('sh'))    { result.push('SH');        i+=2; continue; }
    if (rem.startsWith('ph'))    { result.push('F');         i+=2; continue; }
    if (rem.startsWith('wh'))    { result.push('W');         i+=2; continue; }
    if (rem.startsWith('ng'))    { result.push('NG');        i+=2; continue; }
    if (rem.startsWith('nk'))    { result.push('NG','K');    i+=2; continue; }
    if (rem.startsWith('th'))    { result.push('TH');        i+=2; continue; }
    if (rem.startsWith('dg'))    { result.push('JH');        i+=2; continue; }
    if (rem.startsWith('gh') && !isVowelChar(w[i+2])) { i+=2; continue; } // silent gh

    // Vowel digraphs
    if (rem.startsWith('oo'))    { result.push('UW');  i+=2; continue; }
    if (rem.startsWith('ee'))    { result.push('IY');  i+=2; continue; }
    if (rem.startsWith('ea'))    { result.push('IY');  i+=2; continue; }
    if (rem.startsWith('ou'))    { result.push('AW');  i+=2; continue; }
    if (rem.startsWith('ow'))    {
      // final 'ow' or before vowel = AW (now, tower); otherwise OW (snow)
      const after = w.slice(i+2);
      result.push(after === '' || isVowelChar(after[0]) ? 'AW' : 'OW');
      i+=2; continue;
    }
    if (rem.startsWith('oi') || rem.startsWith('oy')) { result.push('OY'); i+=2; continue; }
    if (rem.startsWith('au') || rem.startsWith('aw')) { result.push('AO'); i+=2; continue; }
    if (rem.startsWith('ai') || rem.startsWith('ay')) { result.push('EY'); i+=2; continue; }
    if (rem.startsWith('ie'))    { result.push('IY');  i+=2; continue; }
    if (rem.startsWith('ue'))    { result.push('UW');  i+=2; continue; }
    if (rem.startsWith('ui'))    { result.push('UW');  i+=2; continue; }
    if (rem.startsWith('ew'))    { result.push('UW');  i+=2; continue; }
    if (rem.startsWith('or'))    { result.push('AO','R'); i+=2; continue; }
    if (rem.startsWith('er'))    { result.push('ER');  i+=2; continue; }
    if (rem.startsWith('ir'))    { result.push('ER');  i+=2; continue; }
    if (rem.startsWith('ur'))    { result.push('ER');  i+=2; continue; }
    if (rem.startsWith('ar'))    { result.push('AA','R'); i+=2; continue; }

    // Doubled consonants — pronounce once
    if (c === next && !'aeiou'.includes(c)) { i++; continue; }

    // Silent final 'e' after consonant (make / late / hope)
    if (c === 'e' && i === len - 1 && len > 2 && !isVowelChar(w[i-1])) {
      i++; continue;
    }

    // ── Single-character rules ─────────────────────────────────────────────

    switch (c) {
      case 'a': {
        // magic-e: a_Ce (bake, take)
        if (hasMagicE(w, i)) { result.push('EY'); i++; break; }
        // 'a' before 'l' → AO (ball, tall) — but not 'al' in "value"
        if (next === 'l' && !'aeiou'.includes(w[i+2]||'')) { result.push('AO'); i++; break; }
        // 'a' before 'll' → AO
        if (w.slice(i+1,i+3) === 'll') { result.push('AO'); i++; break; }
        result.push('AE'); i++; break;
      }
      case 'e': result.push('EH'); i++; break;
      case 'i': {
        if (hasMagicE(w, i)) { result.push('AY'); i++; break; }
        result.push('IH'); i++; break;
      }
      case 'o': {
        if (hasMagicE(w, i)) { result.push('OW'); i++; break; }
        // 'o' before 'n' at end = AH (button, lesson) — no, keep AA
        result.push('AA'); i++; break;
      }
      case 'u': {
        if (hasMagicE(w, i)) { result.push('Y','UW'); i++; break; }
        result.push('AH'); i++; break;
      }
      case 'y': {
        if (i === 0) { result.push('Y'); i++; break; }
        // final y = IY
        result.push('IY'); i++; break;
      }
      case 'b': result.push('B'); i++; break;
      case 'c': {
        result.push('eiyu'.includes(next) ? 'S' : 'K'); i++; break;
      }
      case 'd': result.push('D'); i++; break;
      case 'f': result.push('F'); i++; break;
      case 'g': {
        result.push('eiyu'.includes(next) ? 'JH' : 'G'); i++; break;
      }
      case 'h': result.push('HH'); i++; break;
      case 'j': result.push('JH'); i++; break;
      case 'k': result.push('K'); i++; break;
      case 'l': result.push('L'); i++; break;
      case 'm': result.push('M'); i++; break;
      case 'n': result.push('N'); i++; break;
      case 'p': result.push('P'); i++; break;
      case 'r': result.push('R'); i++; break;
      case 's': {
        // intervocalic s → Z
        if (isVowelChar(prev) && isVowelChar(next)) { result.push('Z'); }
        else result.push('S');
        i++; break;
      }
      case 't': result.push('T'); i++; break;
      case 'v': result.push('V'); i++; break;
      case 'w': result.push('W'); i++; break;
      case 'x': result.push('K','S'); i++; break;
      case 'z': result.push('Z'); i++; break;
      default: i++; break;
    }
  }
  return result;
}

// Does position i in word w have a "magic e" pattern (V C+ e$)?
function hasMagicE(w, i) {
  const tail = w.slice(i + 1);
  return /^[^aeiou]{1,2}e$/.test(tail);
}

// ─── IPA → ARPAbet ────────────────────────────────────────────────────────────
//
// Supports the full set of English IPA symbols.
// Input may optionally be wrapped in /.../ or [...] brackets (ignored).
// Spaces and '.' (syllable boundary) become word pauses.
//
// Multi-character IPA sequences must be matched longest-first.

// IPA symbol → ARPAbet string(s)
const IPA_MAP = [
  // ── Diphthongs (must come before single vowels) ───────────────────────────
  ['aɪ',  ['AY']],
  ['aʊ',  ['AW']],
  ['eɪ',  ['EY']],
  ['oʊ',  ['OW']],
  ['ɔɪ',  ['OY']],
  // Affricates (must come before t, d)
  ['tʃ',  ['CH']],
  ['dʒ',  ['JH']],
  ['ʤ',   ['JH']],
  ['ʧ',   ['CH']],
  // ── Vowels ────────────────────────────────────────────────────────────────
  ['ɑ',   ['AA']],  // father
  ['a',   ['AA']],  // open (treat as AA)
  ['æ',   ['AE']],  // cat
  ['ʌ',   ['AH']],  // cut
  ['ə',   ['AH']],  // schwa
  ['ɔ',   ['AO']],  // caught
  ['ɛ',   ['EH']],  // bed
  ['e',   ['EH']],  // treat plain e as EH
  ['ɝ',   ['ER']],  // bird (stressed)
  ['ɜ',   ['ER']],  // bird (unstressed, no r-colour marker)
  ['ɚ',   ['ER']],  // butter (unstressed rhotacised)
  ['ɪ',   ['IH']],  // bit
  ['i',   ['IY']],  // beat
  ['ʊ',   ['UH']],  // book
  ['u',   ['UW']],  // boot
  ['o',   ['OW']],  // treat plain o as OW
  // ── Consonants ───────────────────────────────────────────────────────────
  ['b',   ['B']],
  ['d',   ['D']],
  ['f',   ['F']],
  ['ɡ',   ['G']],   // IPA g (U+0261)
  ['g',   ['G']],   // ASCII g fallback
  ['h',   ['HH']],
  ['j',   ['Y']],   // IPA j = English y
  ['k',   ['K']],
  ['l',   ['L']],
  ['m',   ['M']],
  ['n',   ['N']],
  ['ŋ',   ['NG']],
  ['p',   ['P']],
  ['ɹ',   ['R']],   // IPA r (approximant)
  ['r',   ['R']],   // ASCII r fallback
  ['s',   ['S']],
  ['ʃ',   ['SH']],
  ['t',   ['T']],
  ['θ',   ['TH']],
  ['ð',   ['DH']],
  ['v',   ['V']],
  ['w',   ['W']],
  ['z',   ['Z']],
  ['ʒ',   ['ZH']],
  ['ʔ',   ['T']],   // glottal stop → approximate as T
  ['x',   ['K']],   // velar fricative → K approximation
  // Stress marks and length marks — skip
  ['ˈ',   null],
  ['ˌ',   null],
  ['ː',   null],
  [':',   null],
];

// Pre-sort by descending key length so longest match wins
IPA_MAP.sort((a, b) => b[0].length - a[0].length);

export function ipaToPhonemes(input) {
  // Strip optional /…/ or […] delimiters
  let text = input.trim().replace(/^[/[](.*)[/\]]$/, '$1');
  const result = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    // Space, hyphen, syllable dot → word pause
    if (ch === ' ' || ch === '.' || ch === '-') {
      if (result.length && result[result.length - 1] !== '_PAUSE') result.push('_PAUSE');
      i++; continue;
    }
    // Try longest match first
    let matched = false;
    for (const [sym, arpa] of IPA_MAP) {
      if (text.startsWith(sym, i)) {
        if (arpa) result.push(...arpa);
        i += sym.length;
        matched = true;
        break;
      }
    }
    if (!matched) i++; // skip unknown character
  }
  // Append trailing pause
  if (result.length && result[result.length - 1] !== '_PAUSE') result.push('_PAUSE');
  return result;
}

// ─── IPA symbol groups (for the UI picker) ────────────────────────────────────
export const IPA_GROUPS = [
  {
    label: 'Vowels',
    symbols: [
      { sym: 'ɑ',  hint: 'AA  father'  },
      { sym: 'æ',  hint: 'AE  cat'     },
      { sym: 'ʌ',  hint: 'AH  cut'     },
      { sym: 'ə',  hint: 'AH  about'   },
      { sym: 'ɔ',  hint: 'AO  caught'  },
      { sym: 'ɛ',  hint: 'EH  bed'     },
      { sym: 'ɝ',  hint: 'ER  bird'    },
      { sym: 'ɚ',  hint: 'ER  butter'  },
      { sym: 'ɪ',  hint: 'IH  bit'     },
      { sym: 'i',  hint: 'IY  beat'    },
      { sym: 'ʊ',  hint: 'UH  book'    },
      { sym: 'u',  hint: 'UW  boot'    },
    ],
  },
  {
    label: 'Diphthongs',
    symbols: [
      { sym: 'aɪ', hint: 'AY  bite'   },
      { sym: 'aʊ', hint: 'AW  cow'    },
      { sym: 'eɪ', hint: 'EY  say'    },
      { sym: 'oʊ', hint: 'OW  go'     },
      { sym: 'ɔɪ', hint: 'OY  boy'    },
    ],
  },
  {
    label: 'Stops',
    symbols: [
      { sym: 'p',  hint: 'P  pit'   },
      { sym: 'b',  hint: 'B  bit'   },
      { sym: 't',  hint: 'T  tip'   },
      { sym: 'd',  hint: 'D  dip'   },
      { sym: 'k',  hint: 'K  kit'   },
      { sym: 'ɡ',  hint: 'G  get'   },
      { sym: 'ʔ',  hint: '(glottal)'},
    ],
  },
  {
    label: 'Fricatives',
    symbols: [
      { sym: 'f',  hint: 'F   fat'   },
      { sym: 'v',  hint: 'V   vat'   },
      { sym: 'θ',  hint: 'TH  thin'  },
      { sym: 'ð',  hint: 'DH  this'  },
      { sym: 's',  hint: 'S   sip'   },
      { sym: 'z',  hint: 'Z   zip'   },
      { sym: 'ʃ',  hint: 'SH  ship'  },
      { sym: 'ʒ',  hint: 'ZH  vision'},
      { sym: 'h',  hint: 'HH  hat'   },
    ],
  },
  {
    label: 'Affricates',
    symbols: [
      { sym: 'tʃ', hint: 'CH  chip' },
      { sym: 'dʒ', hint: 'JH  jam'  },
    ],
  },
  {
    label: 'Nasals & Approx.',
    symbols: [
      { sym: 'm',  hint: 'M   map'  },
      { sym: 'n',  hint: 'N   nap'  },
      { sym: 'ŋ',  hint: 'NG  sing' },
      { sym: 'l',  hint: 'L   lip'  },
      { sym: 'ɹ',  hint: 'R   rip'  },
      { sym: 'w',  hint: 'W   wet'  },
      { sym: 'j',  hint: 'Y   yet'  },
    ],
  },
  {
    label: 'Markers',
    symbols: [
      { sym: 'ˈ',  hint: 'primary stress (skipped)' },
      { sym: 'ˌ',  hint: 'secondary stress (skipped)' },
      { sym: 'ː',  hint: 'length mark (skipped)' },
      { sym: ' ',  hint: 'word boundary' },
    ],
  },
];
