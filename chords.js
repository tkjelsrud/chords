var chordList = {"ionian": ["maj", "min7", "min7", "maj7", "dom7", "min7", "dim"]};
var chordNotes = {"maj": ["1", "3", "5"], "maj7": ["1", "3", "5", "7"], "min": ["1", "b3", "5"],
                  "min7": ["1", "b3", "5", "b7"], "sus2": ["1","2","5"], "sus4": ["1","4","5"], "5": ["1", "5"],
                  "6": ["1", "3", "6"], "min6": ["1", "b3", "5", "b6"]};
var scaleNotes = {"major": ["1", "2", "3", "4", "5", "6", "7"], "minor": ["1", "2", "b3", "4", "5", "b6", "b7"], "mixolydian" : ["1", "2", "3", "4", "5", "6", "b7"]};
var notes = new Array("C", "C# Db", "D", "D# Eb", "E", "F", "F# Gb", "G", "G# Ab", "A", "A# Bb", "B");
var roots = new Array("C", "D", "E", "F", "G", "A", "B");
var positions = new Array("1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7");

function chordToStruct(chord) {
  chS = {'root': "", 'flat': false, 'raised': false, 'tone': "", 'notes': [], 'actual': []};
  chord = chord.replace(" ", "");

  // Following two statements are bad as # and b can be on multiple stages
  if(chord.indexOf("#") >= 0) {
    chS.raised = true;
    chord = chord.replace("#", "");
  }
  // Case sensitive
  if(chord.indexOf("b") >= 0) {
    chS.flat = true;
    chord = chord.replace("b", "");
  }
  if(chord.indexOf("min") == -1) {
    chord = chord.replace("m", "min");
  }

  r = chord.charAt(0).toUpperCase();
  if(r == "H") r = "B";
  if(roots.indexOf(r) >= 0) {
    chS.root = r;
  }

  rootNum = notes.indexOf(chS.root);
  rootNum = rootNum + (chS.raised ? 1 : 0) + (chS.flat ? -1 : 0);

  chS.tone = chord.slice(1);
  if(chS.tone == "")
     chS.tone = "maj";
  if(chS.tone == "7")
     chS.tone = "maj7";

  if(chS.tone in chordNotes)
    chS.notes = chordNotes[chS.tone];

  chS.actual = chordToNotes(rootNum, chS.notes);

  return chS;
}

function chordToNotes(rootNum, pos) {
  if(rootNum < 0)
    rootNum += notes.length;
  if(rootNum >= notes.length)
    rootNum -= notes.length;

  noteList = new Array();

  for(i = 0; i < pos.length; i++) {
    off = positions.indexOf(pos[i]);
    npos = rootNum + off;
    if(npos >= notes.length)
      npos -= notes.length;
    noteList.push(notes[npos]);
  }

  return noteList;
}

function possibleScales(chordStructList) {
  nList = allNotes(chordStructList);
  console.log(nList);
  for(nx = 0; nx < nList.length; nx++) {
    nStruct = noteListToPos(Object.keys(nList), nx);
    console.log(nStruct);
    sList = posToScales(nStruct.positions);
    console.log(nStruct.root);
    console.log(sList);
  }
}

function allNotes(chordStructList) {
  // Collect all individual notes from all chords, exclude duplicates, sorted
  foundNotes = {};
  for(i = 0; i < notes.length; i++) {
    n = notes[i];
    for(j = 0; j < chordStructList.length; j++) {
      cNotes = chordStructList[j].actual;
      if(cNotes.indexOf(n) != -1) {
        if(n in foundNotes) {
          foundNotes[n]++;
        }
        else {
          foundNotes[n] = 1;
        }
      }
    }
  }

  return foundNotes;
}

function noteListToPos(noteList, rX = 0) {
  // ...
  struct = {'root': noteList[rX], 'rootPos': notes.indexOf(noteList[rX]), 'positions': ["1"]}; //
  
  for(i = 1; i < noteList.length; i++) {
    n = noteList[i];
    off = struct.rootPos + notes.indexOf(n);
    if(off >= notes.length)
      off -= notes.length;
    struct.positions.push(positions[off]);
  }
  return struct;
}

function chordsToScale(chordStructList) {
  // Find the notes of the chords, then find a matching scale?
  // However, how do we know what is the correct root?
  // So we iterate and score all found matches by weight
  // Convert from notes to relative positions, then find match

}

function posToScales(posList) {
  foundScales = {};

  for(i = 0; i < posList.length; i++) {
    p = posList[i];

    for(scale in scaleNotes) {
      s = scaleNotes[scale];

      if(s.indexOf(p) != -1) {
        // Found
        if(scale in foundScales) {
          foundScales[scale]++;
        }
        else {
          foundScales[scale] = 1;
        }
      }
    }
  }

  return foundScales;
}
