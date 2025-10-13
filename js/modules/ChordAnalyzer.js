/**
 * ChordAnalyzer Module
 * Handles chord analysis, key detection, and progression matching
 */

export class ChordAnalyzer {
    constructor(data) {
        this.chordData = data.chords || [];
        this.progressionData = data.progressions || [];
        this.romanNumerals = data.romanNumerals || ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
        
        // Enharmonic equivalents for chord normalization
        this.enharmonicMap = {
            'Gb': 'F#', 'F#': 'Gb',
            'Ab': 'G#', 'G#': 'Ab',
            'Db': 'C#', 'C#': 'Db',
            'Eb': 'D#', 'D#': 'Eb',
            'Bb': 'A#', 'A#': 'Bb',
            'H': 'B'
        };
    }

    /**
     * Analyze a set of input chords and return matching keys and progressions
     * @param {Array<string>} inputChords - Array of chord names
     * @returns {Object} Analysis results with scales and progressions
     */
    analyzeChords(inputChords) {
        // Input validation
        if (!Array.isArray(inputChords)) {
            console.warn('Invalid input: expected array of chords, got:', typeof inputChords);
            return { scales: [], progressions: [], errors: ['Invalid input format'] };
        }
        
        if (inputChords.length === 0) {
            return { scales: [], progressions: [], inputChords: [] };
        }
        
        // Validate and clean input chords
        const { validChords, errors } = this.validateAndCleanChords(inputChords);
        
        if (validChords.length === 0) {
            return { 
                scales: [], 
                progressions: [], 
                inputChords: inputChords,
                errors: ['No valid chords found in input']
            };
        }

        try {
            const normalizedChords = validChords.map(chord => this.normalizeChord(chord));
            const scaleMatches = this.findScaleMatches(normalizedChords);
            const progressionMatches = this.findProgressionMatches(normalizedChords);

            return {
                scales: scaleMatches,
                progressions: progressionMatches,
                inputChords: validChords,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            console.error('Error during chord analysis:', error);
            return {
                scales: [],
                progressions: [],
                inputChords: inputChords,
                errors: [`Analysis failed: ${error.message}`]
            };
        }
    }

    /**
     * Validate and clean input chords
     * @param {Array<string>} inputChords - Raw input chord array
     * @returns {Object} Object with validChords array and errors array
     */
    validateAndCleanChords(inputChords) {
        const validChords = [];
        const errors = [];
        const chordPattern = /^[A-G](?:#|b|♯|♭)?(?:maj7|min7|m7|maj|min|m|7|dim|sus[24]?|add9|6|9|11|13)?$/i;
        
        inputChords.forEach((chord, index) => {
            // Check if chord is a string
            if (typeof chord !== 'string') {
                errors.push(`Chord at position ${index + 1} is not a string`);
                return;
            }
            
            // Clean whitespace
            const cleanChord = chord.trim();
            
            // Skip empty chords
            if (cleanChord === '') {
                return;
            }
            
            // Validate chord format
            if (!chordPattern.test(cleanChord)) {
                errors.push(`Invalid chord format: "${cleanChord}"`);
                return;
            }
            
            // Add to valid chords if not duplicate
            if (!validChords.includes(cleanChord)) {
                validChords.push(cleanChord);
            }
        });
        
        return { validChords, errors };
    }

    /**
     * Find matching musical scales/keys for the input chords
     * @param {Array<string>} normalizedChords - Normalized chord names
     * @returns {Array} Sorted array of scale matches
     */
    findScaleMatches(normalizedChords) {
        const scoredMatches = [];

        this.chordData.forEach(row => {
            const key = row[0]; // Key name (e.g., "C Major")
            const chords = row.slice(1); // Chords in this key
            let score = 0;
            const chordPlacements = [];

            // Create full scale chord mappings
            const fullScaleChords = chords.map((chord, idx) => ({
                chord: chord,
                placement: this.romanNumerals[idx] || "?"
            }));

            // Analyze each input chord
            normalizedChords.forEach(inputChord => {
                let matchIndex = chords.indexOf(inputChord);
                
                if (matchIndex !== -1) {
                    score += 1.0; // Exact match
                } else {
                    // Check for enharmonic equivalents
                    const enharmonic = this.enharmonicMap[inputChord];
                    if (enharmonic && chords.includes(enharmonic)) {
                        matchIndex = chords.indexOf(enharmonic);
                        score += 0.9; // Enharmonic match
                    }
                }

                // Determine roman numeral placement
                let placement = matchIndex !== -1 ? this.romanNumerals[matchIndex] || "" : "";
                const isMinor = /m|dim|min|m7|m6|°/.test(inputChord);
                if (placement && isMinor && !placement.includes('°')) {
                    placement = placement.toLowerCase();
                }

                chordPlacements.push({ chord: inputChord, placement });
            });

            // Generate chord suggestions (unused chords in key)
            const usedChords = chordPlacements.map(p => p.chord);
            const suggestions = chords
                .map((chord, idx) => ({ chord, placement: this.romanNumerals[idx] }))
                .filter(p => 
                    !usedChords.includes(p.chord) && 
                    p.placement !== "I" && 
                    !p.chord.includes("dim")
                )
                .slice(0, 3)
                .map(p => p.chord);

            // Boost scores for common scale types
            if (key.includes("Major") && !key.includes("Harmonic") && !key.includes("Melodic")) {
                score += 0.1;
            }
            if (key === "Minor" || key.includes(" Natural Minor")) {
                score += 0.1;
            }

            // Only include matches with positive scores
            if (score > 0) {
                scoredMatches.push({
                    key,
                    score,
                    chordPlacements,
                    suggestions,
                    fullScaleChords
                });
            }
        });

        // Sort by score (highest first)
        return scoredMatches.sort((a, b) => b.score - a.score);
    }

    /**
     * Find matching chord progressions
     * @param {Array<string>} normalizedChords - Normalized chord names
     * @returns {Array} Sorted array of progression matches
     */
    findProgressionMatches(normalizedChords) {
        const matchingProgressions = [];

        this.progressionData.forEach(row => {
            const progressionName = row[0];
            const chords = row.slice(1);

            // Count direct matches and enharmonic equivalents
            const matchCount = normalizedChords.filter(chord => {
                const enharmonic = this.enharmonicMap[chord];
                return chords.includes(chord) || (enharmonic && chords.includes(enharmonic));
            }).length;

            // Calculate sequence score (bonus for correct order)
            let sequenceScore = 0;
            normalizedChords.forEach((chord, idx) => {
                const enharmonic = this.enharmonicMap[chord];
                const isMatch = chords.includes(chord) || (enharmonic && chords.includes(enharmonic));

                if (isMatch) {
                    const progressionIndex = chords.indexOf(chord) !== -1 
                        ? chords.indexOf(chord) 
                        : chords.indexOf(enharmonic);
                    
                    if (progressionIndex === idx) {
                        sequenceScore += 1; // Boost for correct sequence order
                    }
                }
            });

            // Only include progressions with at least one match
            if (matchCount >= 1) {
                const keyRelevance = this.calculateKeyRelevance(normalizedChords, progressionName);
                
                matchingProgressions.push({
                    name: progressionName,
                    chords,
                    matchCount,
                    sequenceScore,
                    keyRelevance
                });
            }
        });

        // Sort by combined relevance score
        return matchingProgressions
            .sort((a, b) => (b.keyRelevance + b.sequenceScore) - (a.keyRelevance + a.sequenceScore))
            .slice(0, 5); // Limit to top 5 results
    }

    /**
     * Calculate how well input chords relate to a progression's key
     * @param {Array<string>} inputChords - Input chord names
     * @param {string} progressionKey - Key from progression name
     * @returns {number} Relevance score
     */
    calculateKeyRelevance(inputChords, progressionKey) {
        // Find best matching scale for input chords
        const bestScaleMatch = this.chordData.find(row =>
            inputChords.some(chord => row.includes(chord))
        );

        if (!bestScaleMatch) return -1.0;

        const scaleKey = bestScaleMatch[0];

        // Compare keys and return relevance score
        if (scaleKey === progressionKey) return 1.5;
        if (this.areRelativeMajorMinor(scaleKey, progressionKey)) return 1.0;
        if (this.areEnharmonic(scaleKey, progressionKey)) return 0.8;
        if (this.areCloselyRelated(scaleKey, progressionKey)) return 0.6;
        if (this.areWeaklyRelated(scaleKey, progressionKey)) return -0.5;
        
        return -1.0;
    }

    /**
     * Normalize chord name (handle enharmonic equivalents)
     * @param {string} chord - Chord name to normalize
     * @returns {string} Normalized chord name
     */
    normalizeChord(chord) {
        if (!chord || typeof chord !== 'string') return '';
        return this.enharmonicMap[chord] || chord;
    }

    /**
     * Check if two keys are relative major/minor
     * @param {string} key1 - First key
     * @param {string} key2 - Second key
     * @returns {boolean} True if keys are relative major/minor
     */
    areRelativeMajorMinor(key1, key2) {
        const relativePairs = {
            "C Major": "A Minor", "A Minor": "C Major",
            "G Major": "E Minor", "E Minor": "G Major",
            "D Major": "B Minor", "B Minor": "D Major",
            "A Major": "F# Minor", "F# Minor": "A Major",
            "E Major": "C# Minor", "C# Minor": "E Major",
            "B Major": "G# Minor", "G# Minor": "B Major",
            "F Major": "D Minor", "D Minor": "F Major",
            "Bb Major": "G Minor", "G Minor": "Bb Major",
            "Eb Major": "C Minor", "C Minor": "Eb Major",
            "Ab Major": "F Minor", "F Minor": "Ab Major",
            "Db Major": "Bb Minor", "Bb Minor": "Db Major",
            "Gb Major": "Eb Minor", "Eb Minor": "Gb Major"
        };
        return relativePairs[key1] === key2;
    }

    /**
     * Check if two keys are enharmonic equivalents
     * @param {string} key1 - First key
     * @param {string} key2 - Second key
     * @returns {boolean} True if keys are enharmonic
     */
    areEnharmonic(key1, key2) {
        const enharmonicPairs = {
            "C# Major": "Db Major", "Db Major": "C# Major",
            "D# Minor": "Eb Minor", "Eb Minor": "D# Minor",
            "F# Major": "Gb Major", "Gb Major": "F# Major",
            "G# Minor": "Ab Minor", "Ab Minor": "G# Minor",
            "A# Minor": "Bb Minor", "Bb Minor": "A# Minor"
        };
        return enharmonicPairs[key1] === key2;
    }

    /**
     * Check if keys are closely related (parallel major/minor)
     * @param {string} key1 - First key
     * @param {string} key2 - Second key
     * @returns {boolean} True if closely related
     */
    areCloselyRelated(key1, key2) {
        const root1 = key1.replace(" Major", "").replace(" Minor", "");
        const root2 = key2.replace(" Major", "").replace(" Minor", "");
        return root1 === root2;
    }

    /**
     * Check if keys are weakly related (dominant/subdominant relationships)
     * @param {string} key1 - First key
     * @param {string} key2 - Second key
     * @returns {boolean} True if weakly related
     */
    areWeaklyRelated(key1, key2) {
        const weakRelations = {
            "C Major": ["G Major", "F Major"],
            "A Minor": ["E Minor", "D Minor"],
            "G Major": ["D Major", "C Major"],
            "E Minor": ["B Minor", "A Minor"],
            // Add more relationships as needed...
        };
        return weakRelations[key1]?.includes(key2) || false;
    }
}