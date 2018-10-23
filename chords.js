var chordList = {"ionian": ["maj", "min7", "min7", "maj7", "dom7", "min7", "dim"]};
var chordNotes = {"maj": ["1", "3", "5"], "maj7": ["1", "3", "5", "7"], "min": ["1", "b3", "5"],
                  "min7": ["1", "b3", "5", "b7"], "sus2": ["1","2","5"], "sus4": ["1","4","5"], "5": ["1", "5"],
                  "6": ["1", "3", "6"], "min6": ["1", "b3", "5", "b6"]};
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
