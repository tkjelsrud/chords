/**
 * Main application entry point
 * Orchestrates all modules and initializes the chord analysis tool
 */

import { ChordAnalyzer } from './modules/ChordAnalyzer.js';
import { TabManager } from './modules/TabManager.js';
import { UIManager } from './modules/UIManager.js';
import { DataLoader } from './modules/DataLoader.js';
import { Analytics } from './modules/Analytics.js';
import { AudioSynth } from './modules/AudioSynth.js';
import { ChordPlayer } from './modules/ChordPlayer.js';
import { FretboardGrid } from './modules/FretboardGrid.js';

class ChordApp {
    constructor() {
        this.dataLoader = new DataLoader();
        this.chordAnalyzer = null;
        this.tabManager = null;
        this.uiManager = null;
        this.analytics = new Analytics();
        this.audioSynth = new AudioSynth();
        this.chordPlayer = null;
        this.fretboardGrid = null;
        
        // Current mode - 'chord' or 'fretboard'
        this.currentMode = 'chord';
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingMessage('Loading chord analysis data...');
            
            // Load chord and progression data first
            await this.dataLoader.loadAll();
            
            // Initialize core modules with error handling
            this.chordAnalyzer = new ChordAnalyzer(this.dataLoader.getData());
            this.tabManager = new TabManager();
            
            // Initialize audio modules
            this.chordPlayer = new ChordPlayer(this.audioSynth);
            
            // Initialize fretboard grid
            this.fretboardGrid = new FretboardGrid(this.audioSynth);
            
            // Initialize UI with all dependencies
            this.uiManager = new UIManager(this.chordAnalyzer, this.tabManager, this.analytics, this.audioSynth, this.chordPlayer);
            
            // Set up cross-module communication
            this.setupEventListeners();
            
            // Handle URL parameters for chord input
            this.handleURLParameters();
            
            this.hideLoadingMessage();
            console.log('Chord Analysis Tool initialized successfully');
            
            // Show welcome message if no data in URL
            const urlParams = new URLSearchParams(window.location.search);
            if (!urlParams.get('in')) {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            this.hideLoadingMessage();
            console.error('Failed to initialize application:', error);
            
            // Provide specific error messages based on error type
            let errorMessage = 'Failed to initialize the chord analysis tool.';
            
            if (error.message.includes('Failed to load chord analysis data')) {
                errorMessage = 'Could not load chord data files. Please check your internet connection and refresh the page.';
            } else if (error.message.includes('Required DOM elements not found')) {
                errorMessage = 'Page structure error. Please refresh the page.';
            }
            
            this.showErrorMessage(errorMessage);
            
            // Try to initialize with minimal functionality
            this.initializeMinimalMode();
        }
    }

    /**
     * Initialize minimal mode when full initialization fails
     */
    initializeMinimalMode() {
        try {
            console.warn('Initializing in minimal mode');
            
            // Try to at least initialize tab manager and basic UI
            this.tabManager = new TabManager();
            
            // Create a minimal UI without chord analysis
            const editor = document.getElementById('chordEditor');
            if (editor) {
                editor.addEventListener('input', () => {
                    // Basic functionality - just save to tabs
                    this.tabManager.updateActiveTabContent(editor.innerText);
                });
                
                editor.placeholder = 'Chord analysis temporarily unavailable - basic text editing only';
            }
            
            this.showErrorMessage('Running in minimal mode. Some features may be unavailable.', 'warning');
            
        } catch (minimalError) {
            console.error('Even minimal initialization failed:', minimalError);
            this.showErrorMessage('Critical application error. Please refresh the page.', 'error');
        }
    }

    setupEventListeners() {
        // Listen for tab changes and update UI accordingly
        this.tabManager.on('tabChanged', (tab) => {
            this.uiManager.loadTabContent(tab);
        });

        // Listen for chord analysis results
        this.uiManager.on('chordAnalysis', (results) => {
            this.analytics.trackChordInput(results.inputChords);
        });

        // Set up fretboard toggle
        this.setupFretboardToggle();
    }

    /**
     * Set up fretboard mode toggle functionality
     */
    setupFretboardToggle() {
        const fretboardToggle = document.getElementById('fretboardToggle');
        const fretboardContainer = document.getElementById('fretboardContainer');
        
        if (!fretboardToggle || !fretboardContainer) {
            console.warn('Fretboard toggle elements not found');
            return;
        }

        // Initialize fretboard grid
        this.fretboardGrid.init(fretboardContainer);

        // Add click handler
        fretboardToggle.addEventListener('click', () => {
            this.toggleMode();
        });
    }

    /**
     * Toggle between chord analysis mode and fretboard mode
     */
    toggleMode() {
        const fretboardToggle = document.getElementById('fretboardToggle');
        const fretboardSection = document.getElementById('fretboardSection');
        const editorSection = document.querySelector('.editor-section');
        const resultsSection = document.querySelector('.results-section');

        if (this.currentMode === 'chord') {
            // Switch to fretboard mode
            this.currentMode = 'fretboard';
            fretboardToggle.classList.add('active');
            fretboardToggle.setAttribute('aria-label', 'Switch to chord mode');
            fretboardToggle.title = 'Switch back to chord analysis';
            
            // Hide chord analysis UI
            if (editorSection) editorSection.style.display = 'none';
            if (resultsSection) resultsSection.style.display = 'none';
            
            // Show fretboard UI
            if (fretboardSection) {
                fretboardSection.style.display = 'block';
                this.fretboardGrid.show();
            }
            
            console.log('Switched to fretboard mode');
        } else {
            // Switch to chord mode
            this.currentMode = 'chord';
            fretboardToggle.classList.remove('active');
            fretboardToggle.setAttribute('aria-label', 'Switch to fretboard mode');
            fretboardToggle.title = 'Switch to fretboard melody sketcher';
            
            // Hide fretboard UI
            if (fretboardSection) {
                fretboardSection.style.display = 'none';
                this.fretboardGrid.hide();
            }
            
            // Show chord analysis UI
            if (editorSection) editorSection.style.display = 'block';
            if (resultsSection) resultsSection.style.display = 'block';
            
            console.log('Switched to chord mode');
        }
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const inputChords = urlParams.get('in');
        
        if (inputChords) {
            const decodedChords = decodeURIComponent(inputChords)
                .replace(/\+/g, ' ')
                .replace(/%23/g, '#');
            
            this.tabManager.setActiveTabContent(decodedChords);
            this.uiManager.setEditorContent(decodedChords);
        }
    }

    showErrorMessage(message, type = 'error') {
        this.hideLoadingMessage(); // Hide any loading message first
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `app-message message-${type}`;
        messageDiv.textContent = message;
        
        const colors = {
            error: { bg: '#ff6b6b', border: '#e74c3c' },
            warning: { bg: '#f39c12', border: '#d35400' },
            info: { bg: '#3498db', border: '#2980b9' }
        };
        
        const color = colors[type] || colors.error;
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${color.bg};
            color: white;
            padding: 12px 24px;
            border-radius: 4px;
            border-left: 4px solid ${color.border};
            z-index: 1001;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            animation: slideInDown 0.3s ease;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutUp 0.3s ease forwards';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, type === 'error' ? 8000 : 5000);
    }

    showLoadingMessage(message = 'Loading...') {
        this.hideLoadingMessage(); // Remove any existing loading message
        
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'app-loading-message';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        loadingDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 20px 30px;
            border-radius: 8px;
            z-index: 1002;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            backdrop-filter: blur(4px);
            border: 1px solid var(--color-border-light);
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid var(--color-primary-light);
                border-top: 2px solid var(--color-primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            .loading-text {
                color: var(--color-text-primary);
                font-size: var(--font-size-sm);
                font-weight: 500;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(loadingDiv);
    }

    hideLoadingMessage() {
        const existing = document.getElementById('app-loading-message');
        if (existing) {
            existing.remove();
        }
    }

    showWelcomeMessage() {
        setTimeout(() => {
            const editor = document.getElementById('chordEditor');
            if (editor && editor.innerText.trim() === '') {
                this.showErrorMessage('Welcome! Try typing some chords like: C Am F G', 'info');
            }
        }, 1000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChordApp();
});

// Export for potential external use
export { ChordApp };