/**
 * UIManager Module
 * Handles all UI interactions, DOM manipulation, and visual updates
 */

export class UIManager {
    constructor(chordAnalyzer, tabManager, analytics, audioSynth, chordPlayer) {
        this.chordAnalyzer = chordAnalyzer;
        this.tabManager = tabManager;
        this.analytics = analytics;
        this.audioSynth = audioSynth;
        this.chordPlayer = chordPlayer;
        this.eventListeners = new Map();
        
        // DOM elements
        this.editor = null;
        this.tabsContainer = null;
        this.resultsContainer = null;
        this.detailsContainer = null;
        this.addTabButton = null;
        this.audioToggle = null;
        
        // State
        this.lastAnalyzedText = '';
        this.debounceTimer = null;
        this.selectionRange = null;
        
        // Performance monitoring
        this.performanceMetrics = {
            analysisCount: 0,
            totalAnalysisTime: 0,
            lastAnalysisTime: 0
        };
        
        // Throttled resize handler for responsive updates
        this.resizeTimer = null;
        
        this.init();
    }

    /**
     * Initialize UI Manager
     */
    init() {
        this.bindDOMElements();
        this.setupEventListeners();
        this.setupMutationObserver();
        this.renderTabs();
        this.loadActiveTab();
    }

    /**
     * Bind DOM elements
     */
    bindDOMElements() {
        this.editor = document.getElementById('chordEditor');
        this.tabsContainer = document.getElementById('tabs-container');
        this.resultsContainer = document.getElementById('floatingResultsContainer');
        this.detailsContainer = document.getElementById('details');
        this.addTabButton = document.getElementById('addTab');
        this.audioToggle = document.getElementById('audioToggle');
        
        if (!this.editor || !this.tabsContainer) {
            throw new Error('Required DOM elements not found');
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', this.handleEditorInput.bind(this));
        this.editor.addEventListener('paste', this.handleEditorPaste.bind(this));
        this.editor.addEventListener('focus', this.handleEditorFocus.bind(this));
        this.editor.addEventListener('blur', this.handleEditorBlur.bind(this));
        
        // Tab management events
        this.addTabButton.addEventListener('click', this.handleAddTab.bind(this));
        
        // Audio toggle event
        if (this.audioToggle) {
            this.audioToggle.addEventListener('click', this.handleAudioToggle.bind(this));
        }
        
        // Tab manager events
        this.tabManager.on('tabChanged', this.handleTabChanged.bind(this));
        this.tabManager.on('tabRenamed', this.handleTabRenamed.bind(this));
        this.tabManager.on('tabRemoved', this.handleTabRemoved.bind(this));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Responsive handling
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // Performance monitoring
        this.setupPerformanceMonitoring();
    }

    /**
     * Set up mutation observer for chord formatting
     */
    setupMutationObserver() {
        const observer = new MutationObserver(() => {
            this.formatChords();
        });
        
        observer.observe(this.editor, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    /**
     * Handle editor input with debouncing
     */
    handleEditorInput() {
        const content = this.editor.innerText;
        
        // Update tab content
        this.tabManager.updateActiveTabContent(content);
        
        // Format chords immediately for visual feedback
        this.formatChords();
        
        // Adaptive debouncing - shorter for small inputs, longer for large inputs
        clearTimeout(this.debounceTimer);
        const debounceDelay = Math.min(500, Math.max(100, content.length * 2));
        
        this.debounceTimer = setTimeout(() => {
            this.analyzeCurrentContent();
        }, debounceDelay);
    }

    /**
     * Handle paste events - convert to plain text
     */
    handleEditorPaste(event) {
        event.preventDefault();
        
        // Get clipboard data
        const clipboardData = event.clipboardData || window.clipboardData;
        let pastedText = '';
        
        if (clipboardData) {
            // Try to get plain text first
            pastedText = clipboardData.getData('text/plain');
            
            // If no plain text, try to extract text from HTML
            if (!pastedText) {
                const htmlData = clipboardData.getData('text/html');
                if (htmlData) {
                    // Create temporary element to extract text content
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlData;
                    pastedText = tempDiv.textContent || tempDiv.innerText || '';
                }
            }
        }
        
        // Process the text to merge single newlines but preserve intentional breaks
        if (pastedText) {
            const processedText = this.processTablePastedText(pastedText);
            this.insertTextAtCursor(processedText);
            
            // Format and analyze after insertion
            setTimeout(() => {
                this.formatChords();
                this.analyzeCurrentContent();
            }, 10);
        }
    }

    /**
     * Insert plain text at the current cursor position
     */
    insertTextAtCursor(text) {
        const selection = window.getSelection();
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            // Create text node and insert
            const textNode = document.createTextNode(text);
            range.insertNode(textNode);
            
            // Move cursor to end of inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // If no selection, append to the end of the editor
            this.editor.appendChild(document.createTextNode(text));
        }
    }

    /**
     * Process pasted text to intelligently merge newlines for chord progression
     * Converts single newlines to spaces, preserves double newlines as breaks
     */
    processTablePastedText(text) {
        if (!text) return text;
        
        // First, normalize different types of line breaks
        let processed = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        // Replace sequences of tabs and multiple spaces with single spaces
        processed = processed.replace(/[\t ]+/g, ' ');
        
        // Mark double+ newlines with a temporary placeholder to preserve them
        processed = processed.replace(/\n\n+/g, '###DOUBLE_NEWLINE###');
        
        // Convert all remaining single newlines to spaces
        processed = processed.replace(/\n/g, ' ');
        
        // Restore the double newlines as single newlines (paragraph breaks)
        processed = processed.replace(/###DOUBLE_NEWLINE###/g, '\n');
        
        // Clean up any resulting multiple spaces
        processed = processed.replace(/ +/g, ' ');
        
        // Trim whitespace from start and end
        processed = processed.trim();
        
        return processed;
    }

    /**
     * Handle editor focus
     */
    handleEditorFocus() {
        this.editor.classList.add('focused');
    }

    /**
     * Handle editor blur
     */
    handleEditorBlur() {
        this.editor.classList.remove('focused');
    }

    /**
     * Handle keyboard shortcuts and navigation
     */
    handleKeyboardShortcuts(event) {
        // Don't interfere with typing in the editor
        if (event.target === this.editor) {
            this.handleEditorKeyboard(event);
            return;
        }
        
        // Global shortcuts
        // Ctrl/Cmd + T: New tab
        if ((event.ctrlKey || event.metaKey) && event.key === 't') {
            event.preventDefault();
            this.handleAddTab();
            return;
        }
        
        // Ctrl/Cmd + W: Close tab (if more than one)
        if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
            const tabs = this.tabManager.getAllTabs();
            if (tabs.length > 1) {
                event.preventDefault();
                this.closeCurrentTab();
            }
            return;
        }
        
        // Ctrl/Cmd + 1-9: Switch to tab by number
        if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
            event.preventDefault();
            const tabIndex = parseInt(event.key) - 1;
            const tabs = this.tabManager.getAllTabs();
            if (tabIndex < tabs.length) {
                this.tabManager.switchToTab(tabIndex);
            }
            return;
        }
        
        // Ctrl/Cmd + Left/Right: Navigate between tabs
        if ((event.ctrlKey || event.metaKey) && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
            event.preventDefault();
            this.navigateTabs(event.key === 'ArrowRight' ? 1 : -1);
            return;
        }
        
        // Escape: Focus editor
        if (event.key === 'Escape') {
            event.preventDefault();
            this.editor.focus();
            return;
        }
        
        // F1: Show help (you can implement this later)
        if (event.key === 'F1') {
            event.preventDefault();
            this.showHelp();
            return;
        }
    }

    /**
     * Handle keyboard events in the editor
     */
    handleEditorKeyboard(event) {
        // Ctrl/Cmd + Enter: Force analysis update
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            this.analyzeCurrentContent();
            return;
        }
        
        // Tab: Insert 4 spaces (prevent losing focus)
        if (event.key === 'Tab') {
            event.preventDefault();
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode('    ')); // 4 spaces
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
            return;
        }
    }

    /**
     * Navigate between tabs
     * @param {number} direction - 1 for next, -1 for previous
     */
    navigateTabs(direction) {
        const tabs = this.tabManager.getAllTabs();
        const currentIndex = this.tabManager.getActiveTabIndex();
        let newIndex = currentIndex + direction;
        
        // Wrap around
        if (newIndex >= tabs.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = tabs.length - 1;
        }
        
        this.tabManager.switchToTab(newIndex);
    }

    /**
     * Show help information
     */
    showHelp() {
        const helpMessage = `
Keyboard Shortcuts:
• Ctrl/Cmd + T: New tab
• Ctrl/Cmd + W: Close tab
• Ctrl/Cmd + 1-9: Switch to tab
• Ctrl/Cmd + ←/→: Navigate tabs
• Ctrl/Cmd + Enter: Update analysis
• Tab (in editor): Insert spaces
• Escape: Focus editor
• F1: Show this help
        `.trim();
        
        this.showTemporaryMessage(helpMessage, 'info', 8000);
    }

    /**
     * Format chords in the editor content
     * FRAGILE: Carefully preserves cursor position during DOM manipulation
     */
    formatChords() {
        // Store selection info before DOM changes
        const selection = window.getSelection();
        let selectionInfo = null;
        
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            selectionInfo = {
                startContainer: range.startContainer,
                startOffset: range.startOffset,
                endContainer: range.endContainer,
                endOffset: range.endOffset,
                collapsed: range.collapsed
            };
        }

        // Process only text nodes to avoid breaking existing chord spans
        const textNodes = [...this.editor.childNodes].filter(node => node.nodeType === 3);
        
        textNodes.forEach(node => {
            // Fixed chord regex that properly handles # and b accidentals
            const chordRegex = /(?:^|[\s,])([A-G](?:#|b|♯|♭)?(?:maj7|min7|m7|maj|min|m|7|dim|sus[24]?|add9|6|9|11|13)?)(?=[\s,]|$)/g;
            const originalText = node.textContent;
            const formatted = originalText.replace(chordRegex, (match, chord) => {
                // Preserve the spacing around the chord
                const prefix = match.match(/^[\s,]*/)[0];
                return `${prefix}<span class="chord">${chord}</span>`;
            });

            // Only replace if content actually changed (avoids unnecessary DOM thrashing)
            if (originalText !== formatted && formatted.includes('<span class="chord">')) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formatted;
                
                // Replace the text node with formatted content
                const fragment = document.createDocumentFragment();
                while (tempDiv.firstChild) {
                    fragment.appendChild(tempDiv.firstChild);
                }
                node.replaceWith(fragment);
            }
        });

        // Carefully restore selection - improved cursor position handling
        if (selectionInfo && selection) {
            try {
                // Create a text walker to find the correct position after DOM changes
                const walker = document.createTreeWalker(
                    this.editor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let currentOffset = 0;
                let targetNode = null;
                let targetOffset = 0;
                
                // Calculate original cursor position as text offset
                const originalOffset = this.getTextOffset(selectionInfo.startContainer, selectionInfo.startOffset);
                
                // Find the new position after DOM changes
                let node;
                while (node = walker.nextNode()) {
                    const nodeLength = node.textContent.length;
                    if (currentOffset + nodeLength >= originalOffset) {
                        targetNode = node;
                        targetOffset = originalOffset - currentOffset;
                        break;
                    }
                    currentOffset += nodeLength;
                }
                
                if (targetNode) {
                    const newRange = document.createRange();
                    newRange.setStart(targetNode, Math.min(targetOffset, targetNode.textContent.length));
                    newRange.collapse(true);
                    
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                } else {
                    // Fallback: place cursor at end
                    const range = document.createRange();
                    range.selectNodeContents(this.editor);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } catch (error) {
                console.warn('Selection restoration failed:', error);
                // Try simple fallback
                try {
                    const range = document.createRange();
                    range.selectNodeContents(this.editor);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                } catch (fallbackError) {
                    selection.removeAllRanges();
                }
            }
        }
    }

    /**
     * Check if a node is valid for selection restoration
     */
    isValidSelectionNode(node) {
        return node && 
               node.parentNode && 
               this.editor.contains(node) && 
               (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE);
    }

    /**
     * Get text offset from the beginning of the editor
     * @param {Node} container - The container node
     * @param {number} offset - The offset within the container
     * @returns {number} Total text offset from editor start
     */
    getTextOffset(container, offset) {
        if (!this.editor.contains(container)) {
            return 0;
        }

        const walker = document.createTreeWalker(
            this.editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let totalOffset = 0;
        let node;

        while (node = walker.nextNode()) {
            if (node === container) {
                return totalOffset + offset;
            }
            totalOffset += node.textContent.length;
        }

        return totalOffset;
    }

    /**
     * Analyze current editor content with error handling and performance monitoring
     */
    analyzeCurrentContent() {
        const startTime = this.startPerformanceTiming();
        
        try {
            const content = this.editor.innerText.trim();
            
            if (content === this.lastAnalyzedText || content === '') {
                if (content === '') {
                    this.clearResults();
                }
                return;
            }
            
            this.lastAnalyzedText = content;
            
            // Extract chords from content
            const lines = content.split('\n').filter(line => line.trim() !== '');
            const allChords = [];
            
            lines.forEach(line => {
                try {
                    const chords = this.extractChordsFromLine(line);
                    allChords.push(...chords);
                } catch (error) {
                    console.warn(`Error extracting chords from line "${line}":`, error);
                }
            });
            
            if (allChords.length === 0) {
                this.clearResults();
                return;
            }
            
            // Validate chord analyzer is available
            if (!this.chordAnalyzer) {
                this.showError('Chord analysis is currently unavailable. Please refresh the page.');
                return;
            }
            
            // Analyze chords
            const results = this.chordAnalyzer.analyzeChords(allChords);
            
            // Check for analysis errors
            if (results.errors && results.errors.length > 0) {
                console.warn('Chord analysis warnings:', results.errors);
                // Continue with partial results but log warnings
            }
            
            // Update UI with results
            this.updateFloatingResults(lines);
            this.updateDetailsResults(results);
            
            // Update chord click handlers for audio preview
            this.updateChordClickHandlers();
            
            // Show any user-facing errors
            if (results.errors && results.errors.some(error => error.includes('No valid chords'))) {
                this.showTemporaryMessage('No valid chords detected. Try: C Am F G', 'info');
            }
            
            // Emit event for analytics
            this.emit('chordAnalysis', { results, inputChords: allChords });
            
            // Track analytics safely
            try {
                if (this.analytics) {
                    this.analytics.trackChordInput(allChords);
                }
            } catch (analyticsError) {
                console.warn('Analytics tracking failed:', analyticsError);
            }
            
        } catch (error) {
            console.error('Critical error during content analysis:', error);
            this.showError('An error occurred while analyzing chords. Please try again.');
            this.clearResults();
        } finally {
            // Always record performance metrics
            this.endPerformanceTiming(startTime);
        }
    }

    /**
     * Extract chord names from a line of text
     * Fixed: Better regex that handles # and b properly without word boundaries
     */
    extractChordsFromLine(line) {
        // More precise regex that doesn't rely on word boundaries for accidentals
        const chordRegex = /(?:^|[\s,]|^)([A-G](?:#|b|♯|♭)?(?:maj7|min7|m7|maj|min|m|7|dim|sus[24]?|add9|6|9|11|13)?)(?=[\s,]|$)/g;
        const matches = [];
        let match;
        
        while ((match = chordRegex.exec(line)) !== null) {
            const chord = match[1].trim();
            if (chord && !matches.includes(chord)) {
                matches.push(chord);
            }
        }
        
        return matches;
    }

    /**
     * Update floating results above chord lines
     */
    updateFloatingResults(lines) {
        this.resultsContainer.innerHTML = '';
        
        lines.forEach((line, index) => {
            const chords = this.extractChordsFromLine(line);
            if (chords.length === 0) return;
            
            const results = this.chordAnalyzer.analyzeChords(chords);
            if (results.scales.length === 0) return;
            
            const resultBox = document.createElement('div');
            resultBox.classList.add('chord-results');
            resultBox.setAttribute('data-line', index);
            
            // Show top match
            const topMatch = results.scales[0];
            const placements = topMatch.chordPlacements
                .filter(p => p.placement !== '')
                .map(p => `${p.chord} (${p.placement})`)
                .join(', ');
            
            const suggestions = topMatch.suggestions.length > 0
                ? ` | <span class="suggestion">Try: ${topMatch.suggestions.join(', ')}</span>`
                : '';
            
            resultBox.innerHTML = `
                <strong>${topMatch.key}</strong>: ${placements}
                ${suggestions}
                <span class="score">[${topMatch.score.toFixed(1)}]</span>
            `;
            
            // Calculate precise position relative to text line
            this.positionResultBox(resultBox, index);
            
            // Add click handler for detailed view
            resultBox.addEventListener('click', () => {
                this.updateDetailsResults(results);
            });
            
            this.resultsContainer.appendChild(resultBox);
        });
    }

    /**
     * Update detailed results section
     */
    updateDetailsResults(results) {
        if (!results || (!results.scales.length && !results.progressions.length)) {
            this.clearDetails();
            return;
        }
        
        let html = '';
        
        // Add progression matches
        if (results.progressions.length > 0) {
            html += '<div class="detailhead">Similar Progressions</div>';
            html += '<div class="progressions">';
            
            results.progressions.slice(0, 5).forEach(prog => {
                const chordList = prog.chords
                    .map((chord, idx) => {
                        const romanNumeral = this.chordAnalyzer.romanNumerals[idx] || '?';
                        return `<strong>${chord}</strong> (${romanNumeral})`;
                    })
                    .join(' - ');
                
                html += `<div class="progression-item">
                    <strong>${prog.name}</strong>: ${chordList}
                </div>`;
            });
            
            html += '</div><br>';
        }
        
        // Add scale matches
        if (results.scales.length > 0) {
            results.scales.slice(0, 8).forEach(match => {
                const keyChordsWithPlacement = match.fullScaleChords
                    .map(p => `<strong>${p.chord}</strong> (${p.placement || '?'})`)
                    .join(' - ');
                
                const suggestions = match.suggestions.length > 0
                    ? `<br><span class="suggestion">Suggestions: ${match.suggestions.join(', ')}</span>`
                    : '';
                
                html += `<div class="detail-item">
                    <div class="detailhead">
                        ${match.key} 
                        <span class="score">Score: ${match.score.toFixed(1)}</span>
                    </div>
                    <div><strong>Chords in key:</strong> ${keyChordsWithPlacement}</div>
                    ${suggestions}
                </div>`;
            });
        }
        
        this.detailsContainer.innerHTML = html;
    }

    /**
     * Clear all results
     */
    clearResults() {
        this.resultsContainer.innerHTML = '';
        this.clearDetails();
    }

    /**
     * Clear details section
     */
    clearDetails() {
        this.detailsContainer.innerHTML = '';
    }

    /**
     * Render tabs UI
     */
    renderTabs() {
        // Clear existing tabs (but keep add button)
        const existingTabs = this.tabsContainer.querySelectorAll('.tab');
        existingTabs.forEach(tab => tab.remove());
        
        const tabs = this.tabManager.getAllTabs();
        const activeIndex = this.tabManager.getActiveTabIndex();
        
        tabs.forEach((tab, index) => {
            const tabElement = document.createElement('div');
            tabElement.classList.add('tab');
            tabElement.setAttribute('role', 'tab');
            tabElement.setAttribute('aria-selected', index === activeIndex);
            
            if (index === activeIndex) {
                tabElement.classList.add('active');
            }
            
            tabElement.innerHTML = `
                <span class="tab-name">${this.escapeHtml(tab.name)}</span>
                ${tabs.length > 1 ? '<button class="tab-close" aria-label="Close tab">×</button>' : ''}
            `;
            
            // Tab click handler
            tabElement.querySelector('.tab-name').addEventListener('click', () => {
                this.tabManager.switchToTab(index);
            });
            
            // Tab double-click for rename
            tabElement.querySelector('.tab-name').addEventListener('dblclick', () => {
                this.renameTab(index);
            });
            
            // Close button handler
            const closeBtn = tabElement.querySelector('.tab-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.closeTab(index);
                });
            }
            
            // Insert before add button
            this.tabsContainer.insertBefore(tabElement, this.addTabButton);
        });
    }

    /**
     * Handle tab changed event
     */
    handleTabChanged(tab) {
        this.loadTabContent(tab);
        this.renderTabs();
    }

    /**
     * Handle tab renamed event
     */
    handleTabRenamed() {
        this.renderTabs();
    }

    /**
     * Handle tab removed event
     */
    handleTabRemoved() {
        this.renderTabs();
        this.loadActiveTab();
    }

    /**
     * Load content from tab into editor
     */
    loadTabContent(tab) {
        if (!tab) return;
        
        this.editor.innerText = tab.content || '';
        this.formatChords();
        this.analyzeCurrentContent();
    }

    /**
     * Load active tab
     */
    loadActiveTab() {
        const activeTab = this.tabManager.getActiveTab();
        this.loadTabContent(activeTab);
    }

    /**
     * Handle add tab button click
     */
    handleAddTab() {
        const newTab = this.tabManager.createTab();
        this.tabManager.switchToTab(this.tabManager.getAllTabs().length - 1);
        this.renderTabs();
    }

    /**
     * Rename tab
     */
    renameTab(index) {
        const tab = this.tabManager.getTab(index);
        if (!tab) return;
        
        const newName = prompt('Rename Tab:', tab.name);
        if (newName && newName.trim()) {
            this.tabManager.renameTab(index, newName.trim());
        }
    }

    /**
     * Close tab
     */
    closeTab(index) {
        this.tabManager.removeTab(index);
    }

    /**
     * Close current tab
     */
    closeCurrentTab() {
        this.closeTab(this.tabManager.getActiveTabIndex());
    }

    /**
     * Set editor content
     */
    setEditorContent(content) {
        this.editor.innerText = content || '';
        this.formatChords();
        this.analyzeCurrentContent();
    }

    /**
     * Get current editor content
     */
    getEditorContent() {
        return this.editor.innerText;
    }

    /**
     * Add event listener
     */
    on(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }

    /**
     * Emit event
     */
    emit(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    /**
     * Show error message to user
     * @param {string} message - Error message to display
     * @param {string} type - Type of message ('error', 'warning', 'info')
     */
    showError(message, type = 'error') {
        this.showTemporaryMessage(message, type, 5000);
    }

    /**
     * Show temporary message to user
     * @param {string} message - Message to display
     * @param {string} type - Type of message ('error', 'warning', 'info')
     * @param {number} duration - Duration in milliseconds
     */
    showTemporaryMessage(message, type = 'info', duration = 3000) {
        // Remove existing messages of the same type
        const existing = document.querySelectorAll(`.message-${type}`);
        existing.forEach(el => el.remove());
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message message-${type}`;
        messageDiv.textContent = message;
        
        // Style based on type
        const styles = {
            error: {
                background: '#ff6b6b',
                color: 'white',
                borderLeft: '4px solid #e74c3c'
            },
            warning: {
                background: '#f39c12',
                color: 'white',
                borderLeft: '4px solid #d35400'
            },
            info: {
                background: '#3498db',
                color: 'white',
                borderLeft: '4px solid #2980b9'
            }
        };
        
        const style = styles[type] || styles.info;
        Object.assign(messageDiv.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: '1001',
            maxWidth: '400px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            animation: 'slideInRight 0.3s ease',
            ...style
        });
        
        document.body.appendChild(messageDiv);
        
        // Auto-remove after duration
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.remove();
                    }
                }, 300);
            }
        }, duration);
    }

    /**
     * Show loading state
     * @param {HTMLElement} element - Element to show loading on
     */
    showLoading(element = this.editor) {
        if (element) {
            element.classList.add('loading');
        }
    }

    /**
     * Hide loading state
     * @param {HTMLElement} element - Element to hide loading on
     */
    hideLoading(element = this.editor) {
        if (element) {
            element.classList.remove('loading');
        }
    }

    /**
     * Handle critical errors gracefully
     * @param {Error} error - The error that occurred
     * @param {string} context - Context where error occurred
     */
    handleCriticalError(error, context = 'Unknown') {
        console.error(`Critical error in ${context}:`, error);
        
        this.showError(`Application error in ${context}. Please refresh the page if the problem persists.`);
        
        // Track error for analytics
        try {
            if (this.analytics) {
                this.analytics.trackError(error, context);
            }
        } catch (analyticsError) {
            console.warn('Could not track error:', analyticsError);
        }
    }

    /**
     * Handle window resize events
     */
    handleResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            this.updateFloatingResultsLayout();
        }, 150);
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor analysis performance
        if (typeof performance !== 'undefined' && performance.mark) {
            this.performanceMonitoringEnabled = true;
        }
        
        // Log performance stats every 50 analyses
        setInterval(() => {
            if (this.performanceMetrics.analysisCount > 0 && 
                this.performanceMetrics.analysisCount % 50 === 0) {
                this.logPerformanceStats();
            }
        }, 30000); // Every 30 seconds
    }

    /**
     * Start performance timing
     */
    startPerformanceTiming() {
        if (this.performanceMonitoringEnabled) {
            performance.mark('chord-analysis-start');
        }
        return Date.now();
    }

    /**
     * End performance timing
     */
    endPerformanceTiming(startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        if (this.performanceMonitoringEnabled) {
            performance.mark('chord-analysis-end');
            performance.measure('chord-analysis', 'chord-analysis-start', 'chord-analysis-end');
        }
        
        // Update metrics
        this.performanceMetrics.analysisCount++;
        this.performanceMetrics.totalAnalysisTime += duration;
        this.performanceMetrics.lastAnalysisTime = duration;
        
        return duration;
    }

    /**
     * Log performance statistics
     */
    logPerformanceStats() {
        const metrics = this.performanceMetrics;
        const avgTime = metrics.totalAnalysisTime / metrics.analysisCount;
        
        console.log('🎵 Chord Analysis Performance:', {
            totalAnalyses: metrics.analysisCount,
            averageTime: `${avgTime.toFixed(2)}ms`,
            lastAnalysisTime: `${metrics.lastAnalysisTime}ms`,
            totalTime: `${(metrics.totalAnalysisTime / 1000).toFixed(2)}s`
        });
    }

    /**
     * Position a result box relative to its corresponding text line
     */
    positionResultBox(resultBox, lineIndex) {
        // Get editor computed styles
        const editorStyles = getComputedStyle(this.editor);
        const lineHeight = parseInt(editorStyles.lineHeight);
        const paddingTop = parseInt(editorStyles.paddingTop);
        
        // Calculate position: padding + (line index * line height) + small offset for alignment
        const topPosition = paddingTop + (lineIndex * lineHeight) + 5;
        
        // Position within the floating results container (which is to the left of editor)
        resultBox.style.position = 'absolute';
        resultBox.style.top = `${topPosition}px`;
        resultBox.style.right = '10px'; // Position from the right edge of the container
        resultBox.style.left = 'auto';
        resultBox.style.transform = 'none';
    }

    /**
     * Update floating results layout (for responsive design)
     */
    updateFloatingResultsLayout() {
        const results = this.resultsContainer.querySelectorAll('.chord-results');
        results.forEach((result, index) => {
            // Recalculate positions using the new positioning method
            this.positionResultBox(result, index);
        });
    }

    /**
     * Optimize DOM updates using DocumentFragment
     */
    createOptimizedResultsFragment(resultsHTML) {
        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = resultsHTML;
        
        while (tempDiv.firstChild) {
            fragment.appendChild(tempDiv.firstChild);
        }
        
        return fragment;
    }

    /**
     * Throttled chord extraction for better performance
     */
    extractChordsFromLineThrottled = this.throttle(this.extractChordsFromLine.bind(this), 16);

    /**
     * Throttle function for performance optimization
     */
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Check if device has reduced motion preference
     */
    prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle audio preview toggle
     */
    async handleAudioToggle() {
        if (!this.audioSynth || !this.audioToggle) return;

        const isCurrentlyEnabled = this.audioSynth.isReady();
        
        try {
            if (isCurrentlyEnabled) {
                // Disable audio
                this.audioSynth.disable();
                this.updateAudioToggleUI(false);
                // Remove click handlers from existing chords
                this.updateChordClickHandlers();
            } else {
                // Enable audio (requires user gesture)
                const success = await this.audioSynth.enable();
                if (success) {
                    this.updateAudioToggleUI(true);
                    // Add click handlers to existing chords
                    this.updateChordClickHandlers();
                } else {
                    console.error('Failed to enable audio');
                    this.showError('Audio could not be enabled. Please check your browser settings.');
                }
            }
        } catch (error) {
            console.error('Audio toggle error:', error);
            this.showError('Audio feature is not available in this browser.');
        }
    }

    /**
     * Update the audio toggle button UI
     */
    updateAudioToggleUI(enabled) {
        if (!this.audioToggle) return;
        
        if (enabled) {
            this.audioToggle.classList.add('audio-enabled');
            this.audioToggle.classList.remove('audio-disabled');
            this.audioToggle.title = 'Disable chord preview (click chords to hear them)';
            this.audioToggle.setAttribute('aria-label', 'Audio preview enabled');
        } else {
            this.audioToggle.classList.remove('audio-enabled');
            this.audioToggle.classList.add('audio-disabled');
            this.audioToggle.title = 'Enable chord preview';
            this.audioToggle.setAttribute('aria-label', 'Audio preview disabled');
        }
    }

    /**
     * Handle chord click for audio preview
     */
    handleChordClick(event, chordName) {
        // Prevent default behavior if audio is not enabled
        if (!this.audioSynth?.isReady()) {
            return;
        }

        // Stop event propagation to prevent other handlers
        event.preventDefault();
        event.stopPropagation();

        // Play the chord
        this.playChordPreview(chordName);
    }

    /**
     * Play chord preview audio
     */
    async playChordPreview(chordName) {
        if (!this.chordPlayer || !this.audioSynth?.isReady()) {
            return;
        }

        try {
            // Stop any currently playing chords
            this.chordPlayer.stopAll();
            
            // Play the new chord
            const success = await this.chordPlayer.playChord(chordName);
            
            if (!success) {
                console.warn('Could not play chord:', chordName);
            }
            
        } catch (error) {
            console.error('Error playing chord preview:', error);
        }
    }

    /**
     * Add click handlers to chord elements for audio preview
     */
    addChordClickHandlers() {
        if (!this.audioSynth) return;

        // Find all chord elements in the results (strong elements and span.chord elements)
        const chordElements = document.querySelectorAll('strong, span.chord');
        
        chordElements.forEach(element => {
            // Remove existing audio handlers to prevent duplicates
            element.removeEventListener('click', element._chordAudioHandler);
            
            // Extract chord name from element
            const chordName = this.extractChordNameFromElement(element);
            if (chordName) {
                // Create and store handler
                const handler = (event) => this.handleChordClick(event, chordName);
                element._chordAudioHandler = handler;
                
                // Add click handler
                element.addEventListener('click', handler);
                
                // Add visual indicator for clickable chords when audio is enabled
                if (this.audioSynth.isReady()) {
                    element.classList.add('chord-clickable');
                    element.title = `Click to hear ${chordName}`;
                }
            }
        });
    }

    /**
     * Extract chord name from DOM element
     */
    extractChordNameFromElement(element) {
        // Try different methods to extract chord name
        const text = element.textContent?.trim();
        if (!text) return null;

        // For chord names in results (often just the chord name)
        if (/^[A-G][#b]?[^:\s]*$/.test(text)) {
            return text;
        }

        // For chord suggestions or other formats, look for chord pattern
        const chordMatch = text.match(/([A-G][#b]?[^:\s,]*)/);
        return chordMatch ? chordMatch[1] : null;
    }

    /**
     * Update chord click handlers when results change
     */
    updateChordClickHandlers() {
        // Remove old handlers
        document.querySelectorAll('.chord-clickable').forEach(element => {
            element.classList.remove('chord-clickable');
            element.removeEventListener('click', element._chordAudioHandler);
            delete element._chordAudioHandler;
        });

        // Add new handlers if audio is enabled
        if (this.audioSynth?.isReady()) {
            setTimeout(() => this.addChordClickHandlers(), 100);
        }
    }
}