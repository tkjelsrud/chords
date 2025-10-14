/**
 * AudioSynth Module
 * Web Audio API synthesizer for chord preview playback
 */

export class AudioSynth {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.activeOscillators = new Map();
        this.isInitialized = false;
        this.isEnabled = false;
        
        // Synth parameters
        this.masterVolume = 0.3;
        this.attackTime = 0.01;   // 10ms attack
        this.decayTime = 0.1;     // 100ms decay
        this.sustainLevel = 0.7;  // 70% sustain
        this.releaseTime = 0.5;   // 500ms release
        this.waveform = 'sawtooth'; // Warm chord sound
        
        // Performance optimization
        this.maxPolyphony = 8; // Limit concurrent notes
        this.noteOffTimeout = 1000; // Auto-release after 1 second
    }

    /**
     * Initialize the audio context and master gain
     * Requires user gesture to activate
     */
    async initialize() {
        if (this.isInitialized) return true;
        
        try {
            // Create audio context
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) {
                throw new Error('Web Audio API not supported');
            }
            
            this.audioContext = new AudioContext();
            
            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            this.masterGain.connect(this.audioContext.destination);
            
            // Resume context if suspended (required by some browsers)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.isInitialized = true;
            console.log('AudioSynth initialized successfully');
            return true;
            
        } catch (error) {
            console.error('Failed to initialize AudioSynth:', error);
            return false;
        }
    }

    /**
     * Enable audio preview functionality
     */
    async enable() {
        if (!this.isInitialized) {
            const success = await this.initialize();
            if (!success) return false;
        }
        
        this.isEnabled = true;
        return true;
    }

    /**
     * Disable audio preview and stop all sounds
     */
    disable() {
        this.isEnabled = false;
        this.stopAllNotes();
    }

    /**
     * Play a single note with ADSR envelope
     */
    playNote(frequency, duration = 1000) {
        if (!this.isEnabled || !this.isInitialized) return null;
        
        try {
            const now = this.audioContext.currentTime;
            
            // Create oscillator
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = this.waveform;
            oscillator.frequency.setValueAtTime(frequency, now);
            
            // Create gain envelope
            const gainNode = this.audioContext.createGain();
            gainNode.gain.setValueAtTime(0, now);
            
            // ADSR envelope
            // Attack
            gainNode.gain.linearRampToValueAtTime(1, now + this.attackTime);
            // Decay
            gainNode.gain.linearRampToValueAtTime(this.sustainLevel, now + this.attackTime + this.decayTime);
            // Sustain (implicit - holds at sustainLevel)
            // Release
            const releaseStart = now + (duration / 1000);
            gainNode.gain.setValueAtTime(this.sustainLevel, releaseStart);
            gainNode.gain.linearRampToValueAtTime(0, releaseStart + this.releaseTime);
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            // Start and schedule stop
            oscillator.start(now);
            oscillator.stop(releaseStart + this.releaseTime);
            
            // Store reference for cleanup
            const noteId = `${frequency}_${Date.now()}`;
            this.activeOscillators.set(noteId, { oscillator, gainNode });
            
            // Clean up when finished
            oscillator.onended = () => {
                this.activeOscillators.delete(noteId);
                gainNode.disconnect();
                oscillator.disconnect();
            };
            
            return noteId;
            
        } catch (error) {
            console.error('Error playing note:', error);
            return null;
        }
    }

    /**
     * Play multiple notes simultaneously (chord)
     */
    playChord(frequencies, duration = 1000) {
        if (!this.isEnabled || !this.isInitialized) return [];
        
        // Limit polyphony to prevent audio issues
        if (frequencies.length > this.maxPolyphony) {
            frequencies = frequencies.slice(0, this.maxPolyphony);
        }
        
        const noteIds = [];
        for (const frequency of frequencies) {
            const noteId = this.playNote(frequency, duration);
            if (noteId) {
                noteIds.push(noteId);
            }
        }
        
        return noteIds;
    }

    /**
     * Stop all currently playing notes
     */
    stopAllNotes() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        for (const [noteId, { oscillator, gainNode }] of this.activeOscillators) {
            try {
                // Fast release to stop gracefully
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
                
                // Schedule stop
                oscillator.stop(now + 0.05);
                
            } catch (error) {
                // Oscillator might already be stopped
                console.warn('Error stopping note:', error);
            }
        }
        
        // Clear the active oscillators map
        this.activeOscillators.clear();
    }

    /**
     * Stop a specific note by its ID or frequency
     * @param {string|number} noteIdentifier - Note ID or frequency to stop
     */
    stopNote(noteIdentifier) {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        let noteToStop = null;
        let noteIdToDelete = null;
        
        // Find note by ID or frequency
        for (const [noteId, noteData] of this.activeOscillators) {
            if (noteId === noteIdentifier || 
                (typeof noteIdentifier === 'number' && noteId.startsWith(`${noteIdentifier}_`))) {
                noteToStop = noteData;
                noteIdToDelete = noteId;
                break;
            }
        }
        
        if (noteToStop) {
            try {
                const { oscillator, gainNode } = noteToStop;
                
                // Fast release to stop gracefully
                gainNode.gain.cancelScheduledValues(now);
                gainNode.gain.setValueAtTime(gainNode.gain.value, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
                
                // Schedule stop
                oscillator.stop(now + 0.05);
                
                // Remove from active oscillators
                this.activeOscillators.delete(noteIdToDelete);
                
            } catch (error) {
                console.warn('Error stopping specific note:', error);
            }
        }
    }

    /**
     * Set master volume (0-1)
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.masterGain && this.audioContext) {
            this.masterGain.gain.setValueAtTime(
                this.masterVolume, 
                this.audioContext.currentTime
            );
        }
    }

    /**
     * Get current volume
     */
    getVolume() {
        return this.masterVolume;
    }

    /**
     * Check if audio is enabled and ready
     */
    isReady() {
        return this.isEnabled && this.isInitialized && 
               this.audioContext && this.audioContext.state === 'running';
    }

    /**
     * Get audio context state for debugging
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isEnabled: this.isEnabled,
            contextState: this.audioContext?.state || 'none',
            activeNotes: this.activeOscillators.size,
            volume: this.masterVolume
        };
    }

    /**
     * Cleanup resources
     */
    destroy() {
        this.stopAllNotes();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.masterGain = null;
        this.isInitialized = false;
        this.isEnabled = false;
    }
}