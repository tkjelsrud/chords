/**
 * DataLoader Module
 * Handles loading and parsing of chord scales and progression data
 */

export class DataLoader {
    constructor() {
        this.chordData = [];
        this.progressionData = [];
        this.romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
    }

    /**
     * Load all data files with comprehensive error handling
     */
    async loadAll() {
        const errors = [];
        
        try {
            // Load data files with individual error tracking
            const results = await Promise.allSettled([
                this.loadChordData(),
                this.loadProgressionData()
            ]);
            
            // Check for failed loads
            results.forEach((result, index) => {
                if (result.status === 'rejected') {
                    const fileName = index === 0 ? 'scales.txt' : 'progressions.txt';
                    errors.push(`Failed to load ${fileName}: ${result.reason.message}`);
                }
            });
            
            // Validate that we have minimum required data
            if (this.chordData.length === 0 && this.progressionData.length === 0) {
                throw new Error('No chord or progression data could be loaded');
            }
            
            if (this.chordData.length === 0) {
                errors.push('Warning: No chord scale data available - chord analysis will be limited');
            }
            
            if (this.progressionData.length === 0) {
                errors.push('Warning: No progression data available - progression suggestions will be unavailable');
            }
            
            // Log warnings but continue if we have at least some data
            if (errors.length > 0) {
                console.warn('Data loading completed with warnings:', errors);
            }
            
        } catch (error) {
            console.error('Critical error loading data files:', error);
            throw new Error(`Failed to load chord analysis data: ${error.message}`);
        }
    }

    /**
     * Load chord scales data
     */
    async loadChordData() {
        try {
            const response = await fetch('lib/scales.txt');
            if (!response.ok) {
                throw new Error(`Failed to load scales.txt: ${response.status}`);
            }
            
            const text = await response.text();
            this.chordData = this.parseCSV(text);
            
            if (this.chordData.length === 0) {
                throw new Error('No chord data found in scales.txt');
            }
            
            console.log(`Loaded ${this.chordData.length} chord scales`);
        } catch (error) {
            console.error('Error loading chord data:', error);
            throw error;
        }
    }

    /**
     * Load chord progressions data
     */
    async loadProgressionData() {
        try {
            const response = await fetch('lib/progressions.txt');
            if (!response.ok) {
                throw new Error(`Failed to load progressions.txt: ${response.status}`);
            }
            
            const text = await response.text();
            this.progressionData = this.parseCSV(text);
            
            if (this.progressionData.length === 0) {
                throw new Error('No progression data found in progressions.txt');
            }
            
            console.log(`Loaded ${this.progressionData.length} chord progressions`);
        } catch (error) {
            console.error('Error loading progression data:', error);
            throw error;
        }
    }

    /**
     * Parse CSV text into array format with validation
     * @param {string} text - Raw CSV text
     * @returns {Array<Array>} Parsed data rows
     */
    parseCSV(text) {
        if (!text || typeof text !== 'string') {
            throw new Error('Invalid CSV text: must be a non-empty string');
        }

        try {
            const lines = text.trim().split('\n');
            const validRows = [];
            let lineNumber = 0;
            
            for (const line of lines) {
                lineNumber++;
                
                // Skip comments and empty lines
                if (line.startsWith('#') || line.trim() === '') {
                    continue;
                }
                
                // Split on commas and clean up whitespace
                const parts = line.split(/\s*,\s*/).map(item => item.trim());
                
                // Validate row structure
                if (parts.length < 2) {
                    console.warn(`Skipping invalid row at line ${lineNumber}: insufficient columns`);
                    continue;
                }
                
                // Validate that first column (key name) is not empty
                if (!parts[0] || parts[0].trim() === '') {
                    console.warn(`Skipping invalid row at line ${lineNumber}: empty key name`);
                    continue;
                }
                
                // Validate that we have at least one chord/progression item
                const dataItems = parts.slice(1).filter(item => item.trim() !== '');
                if (dataItems.length === 0) {
                    console.warn(`Skipping invalid row at line ${lineNumber}: no data items`);
                    continue;
                }
                
                validRows.push([parts[0], ...dataItems]);
            }
            
            if (validRows.length === 0) {
                throw new Error('No valid rows found in CSV data');
            }
            
            return validRows;
            
        } catch (error) {
            throw new Error(`Failed to parse CSV data: ${error.message}`);
        }
    }

    /**
     * Get all loaded data
     * @returns {Object} Object containing chord and progression data
     */
    getData() {
        return {
            chords: this.chordData,
            progressions: this.progressionData,
            romanNumerals: this.romanNumerals
        };
    }

    /**
     * Get chord data only
     * @returns {Array} Chord scales data
     */
    getChordData() {
        return this.chordData;
    }

    /**
     * Get progression data only
     * @returns {Array} Progression data
     */
    getProgressionData() {
        return this.progressionData;
    }

    /**
     * Get roman numerals
     * @returns {Array} Roman numeral notation array
     */
    getRomanNumerals() {
        return this.romanNumerals;
    }

    /**
     * Validate if data is loaded
     * @returns {boolean} True if all data is loaded
     */
    isDataLoaded() {
        return this.chordData.length > 0 && this.progressionData.length > 0;
    }
}