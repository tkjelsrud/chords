/**
 * FretboardChordDetector Module
 * Converts guitar fretboard notation (e.g., "x32010", "x-7-8-7") to chord names
 */

export class FretboardChordDetector {
    constructor() {
        // Standard guitar tuning: low to high (string 6 to string 1)
        this.standardTuning = ['E', 'A', 'D', 'G', 'B', 'E'];
        
        // Chromatic scale for semitone calculations
        this.chromaticScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Chord patterns: intervals from root (in semitones)
        this.chordPatterns = [
            { intervals: [0, 4, 7], suffix: '' },                    // Major
            { intervals: [0, 3, 7], suffix: 'm' },                   // Minor
            { intervals: [0, 4, 7, 11], suffix: 'maj7' },            // Major 7th
            { intervals: [0, 4, 7, 10], suffix: '7' },               // Dominant 7th
            { intervals: [0, 3, 7, 10], suffix: 'm7' },              // Minor 7th
            { intervals: [0, 3, 6], suffix: 'dim' },                 // Diminished
            { intervals: [0, 3, 6, 9], suffix: 'dim7' },             // Diminished 7th
            { intervals: [0, 3, 6, 10], suffix: 'm7b5' },            // Half-diminished
            { intervals: [0, 4, 8], suffix: 'aug' },                 // Augmented
            { intervals: [0, 4, 7, 9], suffix: '6' },                // Major 6th
            { intervals: [0, 3, 7, 9], suffix: 'm6' },               // Minor 6th
            { intervals: [0, 2, 7], suffix: 'sus2' },                // Suspended 2nd
            { intervals: [0, 5, 7], suffix: 'sus4' },                // Suspended 4th
            { intervals: [0, 4, 7, 10, 14], suffix: '9' },           // Dominant 9th
            { intervals: [0, 4, 7, 11, 14], suffix: 'maj9' },        // Major 9th
            { intervals: [0, 3, 7, 10, 14], suffix: 'm9' },          // Minor 9th
            { intervals: [0, 4, 7, 10, 14, 17], suffix: '11' },      // Dominant 11th
            { intervals: [0, 4, 7, 10, 14, 21], suffix: '13' },      // Dominant 13th
        ];
    }

    /**
     * Parse fretboard notation into string positions
     * Supports: "x32010", "x-7-8-7", "x787", etc.
     */
    parseFretboard(notation) {
        notation = notation.trim().toLowerCase();
        
        let positions;
        
        // Check if using dash notation (for frets > 9)
        if (notation.includes('-')) {
            positions = notation.split('-').map(pos => {
                if (pos === 'x') return null;
                const num = parseInt(pos, 10);
                return isNaN(num) ? null : num;
            });
        } else {
            // Compact notation (single chars)
            positions = notation.split('').map(char => {
                if (char === 'x') return null;
                const num = parseInt(char, 10);
                return isNaN(num) ? null : num;
            });
        }
        
        // Pad with nulls if fewer than 6 strings specified
        while (positions.length < 6) {
            positions.push(null);
        }
        
        // Trim to 6 strings
        positions = positions.slice(0, 6);
        
        return positions;
    }

    /**
     * Convert fret positions to note names
     */
    positionsToNotes(positions) {
        const notes = [];
        
        for (let i = 0; i < positions.length; i++) {
            const fret = positions[i];
            if (fret === null) continue; // Muted/unplayed string
            
            const openString = this.standardTuning[i];
            const note = this.getNoteAtFret(openString, fret);
            notes.push({ note, string: i + 1, fret });
        }
        
        return notes;
    }

    /**
     * Get note name at specific fret for a given open string
     */
    getNoteAtFret(openNote, fret) {
        const openIndex = this.chromaticScale.indexOf(openNote);
        const noteIndex = (openIndex + fret) % 12;
        return this.chromaticScale[noteIndex];
    }

    /**
     * Calculate semitone interval between two notes
     */
    getSemitoneInterval(note1, note2) {
        const index1 = this.chromaticScale.indexOf(note1);
        const index2 = this.chromaticScale.indexOf(note2);
        let interval = index2 - index1;
        if (interval < 0) interval += 12;
        return interval;
    }

    /**
     * Identify chord from notes, assuming lowest note is root
     */
    identifyChord(notes) {
        if (notes.length === 0) {
            return null;
        }
        
        // Assume lowest (first) note is the root
        const root = notes[0].note;
        
        // Get unique notes and calculate intervals from root
        const uniqueNotes = [...new Set(notes.map(n => n.note))];
        const intervals = uniqueNotes
            .map(note => this.getSemitoneInterval(root, note))
            .sort((a, b) => a - b);
        
        // Try to match against known chord patterns
        for (const pattern of this.chordPatterns) {
            if (this.intervalsMatch(intervals, pattern.intervals)) {
                return root + pattern.suffix;
            }
        }
        
        // No match - just return the root note (treat as major chord)
        return root;
    }

    /**
     * Check if interval sets match (allowing subset matches)
     */
    intervalsMatch(played, pattern) {
        // All pattern intervals must be present in played intervals
        return pattern.every(interval => played.includes(interval));
    }

    /**
     * Main entry point: convert fretboard notation to chord name
     */
    detectChord(notation) {
        const positions = this.parseFretboard(notation);
        const notes = this.positionsToNotes(positions);
        
        if (notes.length === 0) {
            return null;
        }
        
        const chordName = this.identifyChord(notes);
        
        return {
            chord: chordName,
            notes: notes.map(n => n.note),
            positions,
            details: notes
        };
    }
}
