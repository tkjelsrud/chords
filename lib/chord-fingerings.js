/**
 * Guitar chord fingerings database
 * Format: [[string, fret], [string, fret], ...]
 * String 1 = høyeste E, String 6 = laveste E
 * 'x' = mute string, 0 = open string
 */

const CHORD_FINGERINGS = {
    // Major chords
    'C': {
        chord: [[6, 'x'], [5, 3], [4, 2], [3, 0], [2, 1], [1, 0]],
        position: 0
    },
    'D': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 3], [1, 2]],
        position: 0
    },
    'E': {
        chord: [[6, 0], [5, 2], [4, 2], [3, 1], [2, 0], [1, 0]],
        position: 0
    },
    'F': {
        chord: [[5, 3], [4, 3], [3, 2]],
        position: 1,
        barres: [{fromString: 6, toString: 1, fret: 1}]
    },
    'G': {
        chord: [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 3]],
        position: 0
    },
    'A': {
        chord: [[6, 'x'], [5, 0], [4, 2], [3, 2], [2, 2], [1, 0]],
        position: 0
    },
    'B': {
        chord: [[6, 'x'], [4, 4], [3, 4], [2, 4]],
        position: 2,
        barres: [{fromString: 5, toString: 1, fret: 2}]
    },
    
    // Sharp major chords
    'F#': {
        chord: [[5, 4], [4, 4], [3, 3]],
        position: 2,
        barres: [{fromString: 6, toString: 1, fret: 2}]
    },
    'G#': {
        chord: [[5, 6], [4, 6], [3, 5]],
        position: 4,
        barres: [{fromString: 6, toString: 1, fret: 4}]
    },
    'A#': {
        chord: [[5, 8], [4, 8], [3, 7]],
        position: 6,
        barres: [{fromString: 6, toString: 1, fret: 6}]
    },
    'C#': {
        chord: [[5, 6], [4, 5], [3, 3]],
        position: 4,
        barres: [{fromString: 6, toString: 1, fret: 4}]
    },
    'D#': {
        chord: [[5, 8], [4, 7], [3, 5]],
        position: 6,
        barres: [{fromString: 6, toString: 1, fret: 6}]
    },
    
    // Flat major chords (aliases)
    'Gb': { alias: 'F#' },
    'Ab': { alias: 'G#' },
    'Bb': { alias: 'A#' },
    'Db': { alias: 'C#' },
    'Eb': { alias: 'D#' },
    
    // Minor chords
    'Cm': {
        chord: [[5, 4], [4, 5], [3, 5]],
        position: 3,
        barres: [{fromString: 6, toString: 1, fret: 3}]
    },
    'Dm': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 3], [1, 1]],
        position: 0
    },
    'Em': {
        chord: [[6, 0], [5, 2], [4, 2], [3, 0], [2, 0], [1, 0]],
        position: 0
    },
    'Fm': {
        chord: [[5, 4], [4, 3]],
        position: 1,
        barres: [{fromString: 6, toString: 1, fret: 1}]
    },
    'Gm': {
        chord: [[5, 5], [4, 3]],
        position: 3,
        barres: [{fromString: 6, toString: 1, fret: 3}]
    },
    'Am': {
        chord: [[6, 'x'], [5, 0], [4, 2], [3, 2], [2, 1], [1, 0]],
        position: 0
    },
    'Bm': {
        chord: [[6, 'x'], [4, 4], [3, 4], [2, 3]],
        position: 2,
        barres: [{fromString: 5, toString: 1, fret: 2}]
    },
    
    // Sharp minor chords
    'F#m': {
        chord: [[6, 'x'], [4, 4], [3, 4], [2, 2]],
        position: 2,
        barres: [{fromString: 5, toString: 1, fret: 2}]
    },
    'G#m': {
        chord: [[5, 6], [4, 6]],
        position: 4,
        barres: [{fromString: 6, toString: 1, fret: 4}]
    },
    'A#m': {
        chord: [[5, 8], [4, 8]],
        position: 6,
        barres: [{fromString: 6, toString: 1, fret: 6}]
    },
    'C#m': {
        chord: [[5, 6], [4, 6], [3, 4]],
        position: 4,
        barres: [{fromString: 6, toString: 1, fret: 4}]
    },
    'D#m': {
        chord: [[5, 8], [4, 8], [3, 6]],
        position: 6,
        barres: [{fromString: 6, toString: 1, fret: 6}]
    },
    
    // Seventh chords
    'C7': {
        chord: [[6, 'x'], [5, 3], [4, 2], [3, 3], [2, 1], [1, 0]],
        position: 0
    },
    'D7': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 1], [1, 2]],
        position: 0
    },
    'E7': {
        chord: [[6, 0], [5, 2], [4, 0], [3, 1], [2, 0], [1, 0]],
        position: 0
    },
    'F7': {
        chord: [[5, 3], [4, 3], [3, 2], [2, 1]],
        position: 1,
        barres: [{fromString: 6, toString: 1, fret: 1}]
    },
    'G7': {
        chord: [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 1]],
        position: 0
    },
    'A7': {
        chord: [[6, 'x'], [5, 0], [4, 2], [3, 0], [2, 2], [1, 0]],
        position: 0
    },
    'B7': {
        chord: [[6, 'x'], [5, 2], [4, 1], [3, 2], [2, 0], [1, 2]],
        position: 0
    },
    
    // Minor 7th chords
    'Am7': {
        chord: [[6, 'x'], [5, 0], [4, 2], [3, 0], [2, 1], [1, 0]],
        position: 0
    },
    'Dm7': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 1], [1, 1]],
        position: 0
    },
    'Em7': {
        chord: [[6, 0], [5, 2], [4, 0], [3, 0], [2, 0], [1, 0]],
        position: 0
    },
    'Bm7': {
        chord: [[6, 'x'], [4, 4], [3, 2], [2, 3]],
        position: 2,
        barres: [{fromString: 5, toString: 1, fret: 2}]
    },
    
    // Major 7th chords
    'Cmaj7': {
        chord: [[6, 'x'], [5, 3], [4, 2], [3, 0], [2, 0], [1, 0]],
        position: 0
    },
    'Dmaj7': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 2], [1, 2]],
        position: 0
    },
    'Fmaj7': {
        chord: [[6, 'x'], [5, 'x'], [4, 3], [3, 2], [2, 1], [1, 0]],
        position: 0
    },
    'Gmaj7': {
        chord: [[6, 3], [5, 2], [4, 0], [3, 0], [2, 0], [1, 2]],
        position: 0
    },
    'Amaj7': {
        chord: [[6, 'x'], [5, 0], [4, 2], [3, 1], [2, 2], [1, 0]],
        position: 0
    },
    
    // Sus chords
    'Csus4': {
        chord: [[6, 'x'], [5, 3], [4, 3], [3, 0], [2, 1], [1, 1]],
        position: 0
    },
    'Dsus4': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 3], [1, 3]],
        position: 0
    },
    'Esus4': {
        chord: [[6, 0], [5, 2], [4, 2], [3, 2], [2, 0], [1, 0]],
        position: 0
    },
    'C#sus4': {
        chord: [[5, 6], [4, 6], [3, 6]],
        position: 4,
        barres: [{fromString: 6, toString: 1, fret: 4}]
    },
    
    // Power chords
    'C5': {
        chord: [[6, 'x'], [5, 3], [4, 5], [3, 'x'], [2, 'x'], [1, 'x']],
        position: 0
    },
    'D5': {
        chord: [[6, 'x'], [5, 'x'], [4, 0], [3, 2], [2, 'x'], [1, 'x']],
        position: 0
    },
    'E5': {
        chord: [[6, 0], [5, 2], [4, 'x'], [3, 'x'], [2, 'x'], [1, 'x']],
        position: 0
    },
    'F#sus4': {
        chord: [[5, 4], [4, 4], [3, 4]],
        position: 2,
        barres: [{fromString: 6, toString: 1, fret: 2}]
    },
    'C#5': {
        chord: [[6, 'x'], [5, 4], [4, 6], [3, 'x'], [2, 'x'], [1, 'x']],
        position: 0
    },
    'D#5': {
        chord: [[6, 'x'], [5, 6], [4, 8], [3, 'x'], [2, 'x'], [1, 'x']],
        position: 0
    }
};

// Resolve aliases
function getChordFingering(chordName) {
    const data = CHORD_FINGERINGS[chordName];
    if (!data) return null;
    if (data.alias) return getChordFingering(data.alias);
    return data;
}
