const commonProgRaw = {
  'minor': 'i iidim III iv v VI VII',
  'major': 'I ii iii IV V vi viidim',
  'test': 'I V vi IV',
  'test2': 'I V ♭VII IV',
};

const chordToRelativeNumber = {
    'I': 0,
    'ii': 1.9,
    'iidim': 1.9,
    'II': 2,
    'iii': 3.9,
    'III': 4,
    'iv': 4.9,
    'IV': 5,
    'v': 6.9,
    'V': 7,
    '♭VI': 8,
    'vi': 8.9,
    'VI': 9,
    '♭VII': 10,
    'vii': 10.9,
    'viidim': 10.9,
    'VII': 11,
};
/*const romanToTone = {
    'I': [0, ''],
    'i': [0, 'm'],
    'ii': [2, 'm'],
    'II': [2, ''],
    'iii': [3, 'm'],
    'III': [3, ''],
    'iv': [4, 'm'],
    'IV': [4, ''],
    '
};*/
const allStartingChords = {
  "C": 0,
  "C#": 1,
  "Db": 1,
  "D": 2,
  "D#": 3,
  "Eb": 3,
  "E": 4,
  "F": 5,
  "F#": 6,
  "Gb": 6, 
  "G": 7, 
  "G#": 8, 
  "Ab": 8, 
  "A": 9,
  "A#": 10,
  "Bb": 10,
  "B": 11
};

function isUpperCase(str) {
    return str === str.toUpperCase();
}

function getKeyByValue(obj, value) {
    return Object.keys(obj)
           .filter(key => obj[key] === value);
}

function createChordSequence(progression, transpose = 0) {
  const relatives = progression.map(chord => Math.round(chordToRelativeNumber[chord]));
  let res = new Array(progression.length);
  
  for(let i = 0; i < relatives.length; i++) {
    let m = (!isUpperCase(progression[i]) ? 'm': '');
    if(progressions[i].endsWidth('dim')
       m = 'dim';
    
    res[i] = getKeyByValue(allStartingChords, (relatives[i] + transpose) % 12)[0] + m;
  }

  return res;
}

// This quickly becomes complex, need to match progression labels to potential key, but key could be any to match
// Maybe a easier way is to measure the distance between the chords?

function progressionToDistance(progList) {
  const relatives = progList.map(chord => chordToRelativeNumber[chord]);
  let distances = new Array(relatives.length -1);

  // TODO: find the "lowest" note (whatever that means)
  // and relate to it, ie: all notes must be related to the same note
  // maybe for now just use the first note in the sequence?
  
  for(let i = 1; i < relatives.length; i++) {
    distances[i-1] = Math.abs(relatives[i] - relatives[0]);
  }
  
  return distances;
}

function chordsToProgressions(chordList) {
  let progression = new Array();
  
  // How to balance the complete list (may not fit)
  // with recent, like the last two chords (progression change)
  // return array has to be the same length so that it can fit in the same visualization (?)

  return progressions;
}
