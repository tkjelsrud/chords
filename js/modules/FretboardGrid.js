/**
 * FretboardGrid Module
 * Displays E and A guitar strings as a clickable note grid for melody sketching
 */

export class FretboardGrid {
    constructor(audioSynth) {
        this.audioSynth = audioSynth;
        
        // Guitar string data - Standard tuning for A and E strings (A on top, E on bottom)
        this.strings = {
            A: {
                name: 'A (5th string)', 
                openNote: 'A',
                openFreq: 110.00, // A2
                frets: []
            },
            E: {
                name: 'E (6th string)',
                openNote: 'E',
                openFreq: 82.41, // E2
                frets: []
            }
        };
        
        // Note names for chromatic scale
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Initialize fret data
        this.initializeFrets();
        
        // State
        this.container = null;
        this.isVisible = false;
        this.lastPlayedNote = null;
    }
    
    /**
     * Initialize fret data for both strings (0-12 frets)
     */
    initializeFrets() {
        // E string (6th string) - starts at E2
        const eBaseNote = 4; // E in chromatic scale (0=C)
        const eBaseOctave = 2;
        
        for (let fret = 0; fret <= 12; fret++) {
            const noteIndex = (eBaseNote + fret) % 12;
            const octave = eBaseOctave + Math.floor((eBaseNote + fret) / 12);
            const noteName = this.noteNames[noteIndex];
            const freq = this.calculateFrequency(noteIndex, octave);
            
            this.strings.E.frets.push({
                fret,
                noteName: `${noteName}${octave}`,
                frequency: freq,
                displayName: fret === 0 ? 'Open' : `${fret}`
            });
        }
        
        // A string (5th string) - starts at A2  
        const aBaseNote = 9; // A in chromatic scale
        const aBaseOctave = 2;
        
        for (let fret = 0; fret <= 12; fret++) {
            const noteIndex = (aBaseNote + fret) % 12;
            const octave = aBaseOctave + Math.floor((aBaseNote + fret) / 12);
            const noteName = this.noteNames[noteIndex];
            const freq = this.calculateFrequency(noteIndex, octave);
            
            this.strings.A.frets.push({
                fret,
                noteName: `${noteName}${octave}`,
                frequency: freq,
                displayName: fret === 0 ? 'Open' : `${fret}`
            });
        }
    }
    
    /**
     * Calculate frequency for a note
     * @param {number} noteIndex - Index in chromatic scale (0=C)
     * @param {number} octave - Octave number
     * @returns {number} Frequency in Hz
     */
    calculateFrequency(noteIndex, octave) {
        // A4 = 440 Hz is our reference (noteIndex 9, octave 4)
        const A4 = 440;
        const A4NoteIndex = 9;
        const A4Octave = 4;
        
        // Calculate semitones from A4
        const semitoneDistance = (octave - A4Octave) * 12 + (noteIndex - A4NoteIndex);
        
        // Frequency = A4 * 2^(semitones/12)
        return A4 * Math.pow(2, semitoneDistance / 12);
    }
    
    /**
     * Create the fretboard grid HTML
     */
    createFretboardHTML() {
        let html = `
            <div class="fretboard-container">
                <div class="fretboard-header">
                    <h3>Guitar Fretboard - Melody Sketcher</h3>
                    <p>Click any fret to play the note. A string (top) and E string (bottom).</p>
                </div>
                <div class="fretboard-grid">
        `;
        
        // Create fretboard for both strings
        for (const [stringKey, stringData] of Object.entries(this.strings)) {
            html += `
                <div class="guitar-string" data-string="${stringKey}">
                    <div class="string-label">${stringData.name}</div>
                    <div class="frets">
            `;
            
            // Create frets for this string
            stringData.frets.forEach(fret => {
                const fretClass = fret.fret === 0 ? 'fret open-string' : 'fret';
                const inlays = [3, 5, 7, 9, 12]; // Fret marker positions
                const hasInlay = inlays.includes(fret.fret);
                
                html += `
                    <div class="${fretClass} ${hasInlay ? 'fret-marker' : ''}" 
                         data-string="${stringKey}" 
                         data-fret="${fret.fret}"
                         data-note="${fret.noteName}"
                         data-freq="${fret.frequency}"
                         title="${fret.noteName} (${fret.frequency.toFixed(2)} Hz)">
                        <div class="fret-number">${fret.displayName}</div>
                        <div class="note-name">${fret.noteName.replace(/\d+/, '')}</div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
                <div class="fretboard-info">
                    <div class="current-note" id="currentNote">Click a fret to play a note</div>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Initialize the fretboard grid
     * @param {HTMLElement} container - Container element to render fretboard
     */
    init(container) {
        this.container = container;
        this.render();
        this.attachEventListeners();
    }
    
    /**
     * Render the fretboard
     */
    render() {
        if (!this.container) return;
        
        this.container.innerHTML = this.createFretboardHTML();
    }
    
    /**
     * Attach event listeners to fret buttons
     */
    attachEventListeners() {
        if (!this.container) return;
        
        // Add click handlers to all frets
        const frets = this.container.querySelectorAll('.fret');
        frets.forEach(fret => {
            fret.addEventListener('click', (e) => this.handleFretClick(e));
            fret.addEventListener('mouseenter', (e) => this.handleFretHover(e));
        });
    }
    
    /**
     * Handle fret click event
     * @param {Event} event - Click event
     */
    handleFretClick(event) {
        const fret = event.currentTarget;
        const stringName = fret.getAttribute('data-string');
        const fretNumber = parseInt(fret.getAttribute('data-fret'));
        const noteName = fret.getAttribute('data-note');
        const frequency = parseFloat(fret.getAttribute('data-freq'));
        
        // Visual feedback
        this.highlightFret(fret);
        
        // Play the note
        this.playNote(frequency, noteName);
        
        // Update info display
        this.updateCurrentNote(stringName, fretNumber, noteName, frequency);
        
        console.log(`Playing note: ${noteName} (${stringName} string, fret ${fretNumber}) - ${frequency.toFixed(2)} Hz`);
    }
    
    /**
     * Handle fret hover event
     * @param {Event} event - Hover event  
     */
    handleFretHover(event) {
        const fret = event.currentTarget;
        const noteName = fret.getAttribute('data-note');
        const frequency = parseFloat(fret.getAttribute('data-freq'));
        
        // Show note info on hover
        fret.title = `${noteName} - ${frequency.toFixed(2)} Hz`;
    }
    
    /**
     * Play a single note
     * @param {number} frequency - Frequency in Hz
     * @param {string} noteName - Note name for logging
     */
    async playNote(frequency, noteName) {
        if (!this.audioSynth) {
            console.warn('AudioSynth not initialized');
            this.showAudioMessage('Audio system not available');
            return;
        }
        
        if (!this.audioSynth.isReady()) {
            console.warn('Audio not enabled - please click the audio toggle button (🔊) first');
            this.showAudioMessage('Please enable audio first by clicking the 🔊 button');
            return;
        }
        
        try {
            // Stop previous note if still playing
            if (this.lastPlayedNote) {
                this.audioSynth.stopNote(this.lastPlayedNote);
            }
            
            // Play the note with a shorter duration for melody sketching
            this.lastPlayedNote = frequency;
            await this.audioSynth.playNote(frequency, 800); // 800ms duration
            
        } catch (error) {
            console.error('Error playing note:', error);
            this.showAudioMessage('Error playing note - check browser audio settings');
        }
    }
    
    /**
     * Show audio-related message to user
     * @param {string} message - Message to display
     */
    showAudioMessage(message) {
        const noteDisplay = this.container.querySelector('#currentNote');
        if (noteDisplay) {
            const originalText = noteDisplay.textContent;
            noteDisplay.textContent = message;
            noteDisplay.style.color = '#e74c3c'; // Red color for error/warning
            
            // Restore original text after 3 seconds
            setTimeout(() => {
                noteDisplay.textContent = originalText;
                noteDisplay.style.color = ''; // Reset color
            }, 3000);
        }
    }
    
    /**
     * Highlight clicked fret with visual feedback
     * @param {HTMLElement} fret - Fret element
     */
    highlightFret(fret) {
        // Remove previous highlights
        this.container.querySelectorAll('.fret.active').forEach(f => {
            f.classList.remove('active');
        });
        
        // Add highlight to clicked fret
        fret.classList.add('active');
        
        // Remove highlight after animation
        setTimeout(() => {
            fret.classList.remove('active');
        }, 300);
    }
    
    /**
     * Update the current note display
     * @param {string} stringName - String name (E or A)
     * @param {number} fretNumber - Fret number
     * @param {string} noteName - Note name
     * @param {number} frequency - Frequency in Hz
     */
    updateCurrentNote(stringName, fretNumber, noteName, frequency) {
        const noteDisplay = this.container.querySelector('#currentNote');
        if (noteDisplay) {
            const fretText = fretNumber === 0 ? 'Open' : `Fret ${fretNumber}`;
            noteDisplay.textContent = `${stringName} String - ${fretText}: ${noteName} (${frequency.toFixed(1)} Hz)`;
        }
    }
    
    /**
     * Show the fretboard grid
     */
    show() {
        if (this.container) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    /**
     * Hide the fretboard grid
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    /**
     * Check if fretboard is visible
     * @returns {boolean}
     */
    isShown() {
        return this.isVisible;
    }
    
    /**
     * Cleanup method
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.lastPlayedNote = null;
    }
}