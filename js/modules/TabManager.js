/**
 * TabManager Module
 * Handles tab creation, management, and persistence
 */

export class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabIndex = 0;
        this.storageKey = 'chordTabs';
        this.eventListeners = new Map();
        
        this.init();
    }

    /**
     * Initialize tab manager
     */
    init() {
        this.loadTabsFromStorage();
        if (this.tabs.length === 0) {
            this.createDefaultTab();
        }
    }

    /**
     * Add event listener
     * @param {string} eventType - Type of event
     * @param {Function} callback - Callback function
     */
    on(eventType, callback) {
        if (!this.eventListeners.has(eventType)) {
            this.eventListeners.set(eventType, []);
        }
        this.eventListeners.get(eventType).push(callback);
    }

    /**
     * Emit event to listeners
     * @param {string} eventType - Type of event
     * @param {*} data - Event data
     */
    emit(eventType, data) {
        const listeners = this.eventListeners.get(eventType);
        if (listeners) {
            listeners.forEach(callback => callback(data));
        }
    }

    /**
     * Create a new tab
     * @param {string} name - Tab name (optional)
     * @param {string} content - Tab content (optional)
     * @returns {Object} Created tab
     */
    createTab(name = '', content = '') {
        const tabName = name || `Tab ${this.tabs.length + 1}`;
        const newTab = {
            id: Date.now(), // Simple ID generation
            name: tabName,
            content: content,
            created: new Date().toISOString()
        };

        this.tabs.push(newTab);
        this.saveTabsToStorage();
        
        return newTab;
    }

    /**
     * Create default tab if none exist
     */
    createDefaultTab() {
        this.createTab('Untitled', '');
    }

    /**
     * Remove a tab by index
     * @param {number} index - Tab index to remove
     * @returns {boolean} True if tab was removed
     */
    removeTab(index) {
        if (index < 0 || index >= this.tabs.length || this.tabs.length <= 1) {
            return false; // Don't remove if it's the last tab or invalid index
        }

        this.tabs.splice(index, 1);
        
        // Adjust active tab index if necessary
        if (this.activeTabIndex >= this.tabs.length) {
            this.activeTabIndex = this.tabs.length - 1;
        } else if (index < this.activeTabIndex) {
            this.activeTabIndex--;
        }

        this.saveTabsToStorage();
        this.emit('tabRemoved', { index, activeTabIndex: this.activeTabIndex });
        
        return true;
    }

    /**
     * Rename a tab
     * @param {number} index - Tab index
     * @param {string} newName - New tab name
     * @returns {boolean} True if renamed successfully
     */
    renameTab(index, newName) {
        if (index < 0 || index >= this.tabs.length || !newName || !newName.trim()) {
            return false;
        }

        this.tabs[index].name = newName.trim();
        this.saveTabsToStorage();
        this.emit('tabRenamed', { index, newName: newName.trim() });
        
        return true;
    }

    /**
     * Switch to a specific tab
     * @param {number} index - Tab index to switch to
     * @returns {Object|null} Active tab or null if invalid
     */
    switchToTab(index) {
        if (index < 0 || index >= this.tabs.length) {
            return null;
        }

        this.activeTabIndex = index;
        const activeTab = this.tabs[this.activeTabIndex];
        
        this.emit('tabChanged', activeTab);
        
        return activeTab;
    }

    /**
     * Update content of the active tab
     * @param {string} content - New content
     */
    updateActiveTabContent(content) {
        if (this.activeTabIndex >= 0 && this.activeTabIndex < this.tabs.length) {
            this.tabs[this.activeTabIndex].content = content;
            this.tabs[this.activeTabIndex].modified = new Date().toISOString();
            this.saveTabsToStorage();
        }
    }

    /**
     * Set content for active tab (convenience method)
     * @param {string} content - Content to set
     */
    setActiveTabContent(content) {
        this.updateActiveTabContent(content);
    }

    /**
     * Get the currently active tab
     * @returns {Object|null} Active tab or null
     */
    getActiveTab() {
        if (this.activeTabIndex >= 0 && this.activeTabIndex < this.tabs.length) {
            return this.tabs[this.activeTabIndex];
        }
        return null;
    }

    /**
     * Get all tabs
     * @returns {Array} Array of all tabs
     */
    getAllTabs() {
        return [...this.tabs]; // Return copy to prevent direct mutation
    }

    /**
     * Get tab by index
     * @param {number} index - Tab index
     * @returns {Object|null} Tab or null if not found
     */
    getTab(index) {
        if (index >= 0 && index < this.tabs.length) {
            return this.tabs[index];
        }
        return null;
    }

    /**
     * Get active tab index
     * @returns {number} Current active tab index
     */
    getActiveTabIndex() {
        return this.activeTabIndex;
    }

    /**
     * Save tabs to localStorage
     */
    saveTabsToStorage() {
        try {
            const tabData = {
                tabs: this.tabs,
                activeTabIndex: this.activeTabIndex,
                lastSaved: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(tabData));
        } catch (error) {
            console.error('Failed to save tabs to localStorage:', error);
        }
    }

    /**
     * Load tabs from localStorage
     */
    loadTabsFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const tabData = JSON.parse(stored);
                
                if (Array.isArray(tabData.tabs) && tabData.tabs.length > 0) {
                    this.tabs = tabData.tabs;
                    this.activeTabIndex = Math.max(0, Math.min(
                        tabData.activeTabIndex || 0, 
                        this.tabs.length - 1
                    ));
                }
            }
        } catch (error) {
            console.error('Failed to load tabs from localStorage:', error);
            this.tabs = [];
            this.activeTabIndex = 0;
        }
    }

    /**
     * Clear all tabs and create a new default tab
     */
    clearAllTabs() {
        this.tabs = [];
        this.activeTabIndex = 0;
        this.createDefaultTab();
        this.saveTabsToStorage();
        this.emit('tabsCleared', {});
    }

    /**
     * Export tabs data
     * @returns {Object} Exportable tabs data
     */
    exportTabs() {
        return {
            tabs: this.tabs,
            activeTabIndex: this.activeTabIndex,
            exported: new Date().toISOString()
        };
    }

    /**
     * Import tabs data
     * @param {Object} tabData - Tabs data to import
     * @returns {boolean} True if import was successful
     */
    importTabs(tabData) {
        try {
            if (tabData && Array.isArray(tabData.tabs) && tabData.tabs.length > 0) {
                this.tabs = tabData.tabs;
                this.activeTabIndex = Math.max(0, Math.min(
                    tabData.activeTabIndex || 0,
                    this.tabs.length - 1
                ));
                this.saveTabsToStorage();
                this.emit('tabsImported', { count: this.tabs.length });
                return true;
            }
        } catch (error) {
            console.error('Failed to import tabs:', error);
        }
        return false;
    }
}