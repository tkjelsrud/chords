const commonProgRaw = {
  'test': 'I V vi IV',
  'test2': 'I V ♭VII IV',
};

const chordToRelativeNumber = {
    'I': 0,
    'II': 2,
    'III': 4,
    'IV': 5,
    'V': 7,
    'VI': 9,
    'VII': 11,
};

// This quickly becomes complex, need to match progression labels to potential key, but key could be any to match
// Maybe a easier way is to measure the distance between the chords?

function progressionToDistance(progList) {
  const relations = progList.map(chord => chordToRelativeNumber[chord.toUpperCase()]);
  
  return relations;
}

function chordsToProgressions(chordList) {
  let progression = new Array();
  
  // How to balance the complete list (may not fit)
  // with recent, like the last two chords (progression change)
  // return array has to be the same length so that it can fit in the same visualization (?)

  return progressions;
}
