/**
 * Analytics Module
 * Handles user interaction tracking and analytics
 */

export class Analytics {
    constructor() {
        this.isEnabled = true;
        this.sessionId = this.generateSessionId();
        this.lastTrackedInput = '';
        
        this.init();
    }

    /**
     * Initialize analytics
     */
    init() {
        // Check if gtag is available
        this.isEnabled = typeof window.gtag === 'function';
        
        if (!this.isEnabled) {
            console.log('Analytics disabled: gtag not available');
        }
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Track chord input event
     * @param {Array<string>} chords - Array of chord names
     */
    trackChordInput(chords) {
        if (!this.isEnabled || !Array.isArray(chords) || chords.length === 0) {
            return;
        }

        const inputText = chords.join(' ');
        
        // Avoid tracking the same input repeatedly
        if (inputText === this.lastTrackedInput) {
            return;
        }
        
        this.lastTrackedInput = inputText;

        try {
            window.gtag('event', 'chord_input', {
                'event_category': 'User Input',
                'event_label': inputText,
                'value': chords.length,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'chord_count': chords.length,
                    'input_length': inputText.length
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track chord analysis results
     * @param {Object} results - Analysis results
     */
    trackAnalysisResults(results) {
        if (!this.isEnabled || !results) {
            return;
        }

        try {
            window.gtag('event', 'chord_analysis', {
                'event_category': 'Analysis',
                'event_label': 'chord_matches',
                'value': results.scales ? results.scales.length : 0,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'scale_matches': results.scales ? results.scales.length : 0,
                    'progression_matches': results.progressions ? results.progressions.length : 0
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track tab management actions
     * @param {string} action - Action performed (create, switch, rename, close)
     * @param {Object} data - Additional data about the action
     */
    trackTabAction(action, data = {}) {
        if (!this.isEnabled) {
            return;
        }

        try {
            window.gtag('event', 'tab_action', {
                'event_category': 'Tab Management',
                'event_label': action,
                'value': data.tabIndex || 0,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'action': action,
                    'tab_count': data.totalTabs || 1
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track user engagement metrics
     * @param {string} eventType - Type of engagement event
     * @param {Object} data - Event data
     */
    trackEngagement(eventType, data = {}) {
        if (!this.isEnabled) {
            return;
        }

        try {
            window.gtag('event', 'user_engagement', {
                'event_category': 'Engagement',
                'event_label': eventType,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'engagement_type': eventType,
                    ...data
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track errors and exceptions
     * @param {Error} error - Error object
     * @param {string} context - Context where error occurred
     */
    trackError(error, context = 'unknown') {
        if (!this.isEnabled) {
            return;
        }

        try {
            window.gtag('event', 'exception', {
                'description': error.message || 'Unknown error',
                'fatal': false,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'error_context': context,
                    'error_stack': error.stack ? error.stack.substring(0, 150) : ''
                }
            });
        } catch (trackingError) {
            console.error('Analytics error tracking failed:', trackingError);
        }
    }

    /**
     * Track feature usage
     * @param {string} feature - Feature name
     * @param {Object} data - Usage data
     */
    trackFeatureUsage(feature, data = {}) {
        if (!this.isEnabled) {
            return;
        }

        try {
            window.gtag('event', 'feature_usage', {
                'event_category': 'Features',
                'event_label': feature,
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'feature_name': feature,
                    ...data
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Track session duration and activity
     */
    trackSessionMetrics() {
        if (!this.isEnabled) {
            return;
        }

        const sessionDuration = Date.now() - parseInt(this.sessionId, 36);

        try {
            window.gtag('event', 'session_metrics', {
                'event_category': 'Session',
                'event_label': 'session_duration',
                'value': Math.floor(sessionDuration / 1000), // Convert to seconds
                'custom_parameters': {
                    'session_id': this.sessionId,
                    'duration_seconds': Math.floor(sessionDuration / 1000)
                }
            });
        } catch (error) {
            console.error('Analytics tracking error:', error);
        }
    }

    /**
     * Enable analytics tracking
     */
    enable() {
        this.isEnabled = typeof window.gtag === 'function';
    }

    /**
     * Disable analytics tracking
     */
    disable() {
        this.isEnabled = false;
    }

    /**
     * Check if analytics is enabled
     * @returns {boolean} True if analytics is enabled
     */
    isAnalyticsEnabled() {
        return this.isEnabled;
    }
}