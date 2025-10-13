/**
 * ChordPlayer Module
 * Converts chord names to frequencies and handles chord playback
 */

export class ChordPlayer {
    constructor(audioSynth) {
        this.audioSynth = audioSynth;
        
        // Note frequency map (4th octave as base)
        this.noteFrequencies = {
            'C': 261.63,
            'C#': 277.18, 'Db': 277.18,
            'D': 293.66,
            'D#': 311.13, 'Eb': 311.13,
            'E': 329.63,
            'F': 349.23,
            'F#': 369.99, 'Gb': 369.99,
            'G': 392.00,
            'G#': 415.30, 'Ab': 415.30,
            'A': 440.00,
            'A#': 466.16, 'Bb': 466.16,
            'B': 493.88
        };
        
        // Chord interval patterns (semitones from root)
        this.chordPatterns = {
            // Triads
            'major': [0, 4, 7],           // Major triad
            'minor': [0, 3, 7],           // Minor triad
            'dim': [0, 3, 6],             // Diminished
            'aug': [0, 4, 8],             // Augmented
            
            // Seventh chords
            '7': [0, 4, 7, 10],           // Dominant 7th
            'maj7': [0, 4, 7, 11],        // Major 7th
            'm7': [0, 3, 7, 10],          // Minor 7th
            'm7b5': [0, 3, 6, 10],        // Half-diminished 7th
            'dim7': [0, 3, 6, 9],         // Diminished 7th
            'mMaj7': [0, 3, 7, 11],       // Minor major 7th
            
            // Extended chords (simplified to essential tones)
            '9': [0, 4, 7, 10, 14],       // Dominant 9th
            'maj9': [0, 4, 7, 11, 14],    // Major 9th
            'm9': [0, 3, 7, 10, 14],      // Minor 9th
            '11': [0, 4, 7, 10, 14, 17],  // Dominant 11th
            '13': [0, 4, 7, 10, 14, 21],  // Dominant 13th
            
            // Sus chords
            'sus2': [0, 2, 7],            // Suspended 2nd
            'sus4': [0, 5, 7],            // Suspended 4th
            
            // Add chords
            'add9': [0, 4, 7, 14],        // Add 9th
            '6': [0, 4, 7, 9],            // Major 6th
            'm6': [0, 3, 7, 9],           // Minor 6th
        };
        
        // Common chord aliases and patterns
        this.chordAliases = {
            '': 'major',      // No suffix = major
            'M': 'major',
            'm': 'minor',
            'min': 'minor',
            '-': 'minor',
            '+': 'aug',
            '°': 'dim',
            'o': 'dim',
            'Δ7': 'maj7',
            'M7': 'maj7',
            'maj7': 'maj7',
            'min7': 'm7',
            '-7': 'm7',
            'ø7': 'm7b5',
            '°7': 'dim7'
        };
        
        // Voicing preferences for different chord types
        this.voicingPreferences = {
            'major': 'close',
            'minor': 'close', 
            '7': 'rootless',      // Drop root for jazz voicing
            'maj7': 'spread',
            'm7': 'close'
        };
    }

    /**
     * Parse chord name and extract root note and chord type
     */
    parseChord(chordName) {
        if (!chordName || typeof chordName !== 'string') {
            return null;
        }
        
        const chord = chordName.trim();
        if (!chord) return null;
        
        // Match root note (with optional sharp/flat)
        const rootMatch = chord.match(/^([A-G][#b]?)/);
        if (!rootMatch) return null;
        
        const root = rootMatch[1];
        const suffix = chord.substring(root.length);
        
        // Resolve chord type through aliases
        const chordType = this.chordAliases[suffix] || suffix;
        
        return {
            root,
            type: chordType,
            suffix,
            original: chord
        };
    }

    /**
     * Get frequency for a note name at a specific octave
     */
    getNoteFrequency(noteName, octave = 4) {
        const baseFreq = this.noteFrequencies[noteName];
        if (!baseFreq) return null;
        
        // Calculate frequency for the specified octave
        // Each octave doubles the frequency
        const octaveAdjustment = Math.pow(2, octave - 4);
        return baseFreq * octaveAdjustment;
    }

    /**
     * Calculate semitone offset from a root note
     */
    getIntervalNote(rootNote, semitones) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const enharmonics = {
            'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
        };
        
        // Normalize enharmonics
        const normalizedRoot = enharmonics[rootNote] || rootNote;
        const rootIndex = noteNames.indexOf(normalizedRoot);
        
        if (rootIndex === -1) return null;
        
        // Calculate target note index with wrap-around
        const targetIndex = (rootIndex + semitones) % 12;
        return noteNames[targetIndex];
    }

    /**
     * Generate chord frequencies based on chord name
     */
    getChordFrequencies(chordName, octave = 4) {
        const parsed = this.parseChord(chordName);
        if (!parsed) {
            console.warn('Could not parse chord:', chordName);
            return [];
        }
        
        const pattern = this.chordPatterns[parsed.type];
        if (!pattern) {
            console.warn('Unknown chord type:', parsed.type);
            // Fallback to major triad
            return this.getChordFrequencies(parsed.root, octave);
        }
        
        const frequencies = [];
        
        for (let i = 0; i < pattern.length; i++) {
            const interval = pattern[i];
            const noteName = this.getIntervalNote(parsed.root, interval);
            
            if (noteName) {
                // Calculate octave for this note (handle octave wrapping)
                const noteOctave = octave + Math.floor((interval) / 12);
                const frequency = this.getNoteFrequency(noteName, noteOctave);
                
                if (frequency) {
                    frequencies.push(frequency);
                }
            }
        }
        
        return frequencies;
    }

    /**
     * Play a chord with the specified duration
     */
    async playChord(chordName, duration = 800) {
        if (!this.audioSynth.isReady()) {
            console.warn('Audio not ready for chord playback');
            return false;
        }
        
        const frequencies = this.getChordFrequencies(chordName);
        
        if (frequencies.length === 0) {
            console.warn('No frequencies generated for chord:', chordName);
            return false;
        }
        
        try {
            const noteIds = this.audioSynth.playChord(frequencies, duration);
            console.log(`Playing chord ${chordName}:`, frequencies.map(f => Math.round(f)));
            return noteIds.length > 0;
            
        } catch (error) {
            console.error('Error playing chord:', error);
            return false;
        }
    }

    /**
     * Stop all currently playing chords
     */
    stopAll() {
        this.audioSynth.stopAllNotes();
    }

    /**
     * Test if a chord name is valid
     */
    isValidChord(chordName) {
        const frequencies = this.getChordFrequencies(chordName);
        return frequencies.length > 0;
    }

    /**
     * Get supported chord types for reference
     */
    getSupportedChordTypes() {
        return Object.keys(this.chordPatterns);
    }

    /**
     * Get chord information including notes and frequencies
     */
    getChordInfo(chordName, octave = 4) {
        const parsed = this.parseChord(chordName);
        if (!parsed) return null;
        
        const pattern = this.chordPatterns[parsed.type];
        if (!pattern) return null;
        
        const frequencies = this.getChordFrequencies(chordName, octave);
        const notes = [];
        
        for (const interval of pattern) {
            const noteName = this.getIntervalNote(parsed.root, interval);
            if (noteName) {
                notes.push(noteName);
            }
        }
        
        return {
            chord: parsed.original,
            root: parsed.root,
            type: parsed.type,
            notes,
            frequencies,
            intervals: pattern
        };
    }
}