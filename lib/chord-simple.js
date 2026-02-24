/**
 * Optional JS for chord display
 * Auto-parser og tooltip funksjonalitet
 */

(function() {
    'use strict';

    const TAB_STRING_ORDER = ['e', 'b', 'g', 'd', 'a', 'E'];

    function isMinorChordName(chordName) {
        const name = (chordName || '').trim();
        const match = name.match(/^([A-G])(#|b|♯|♭)?(.*)$/);
        if (!match) return false;
        const rest = (match[3] || '').trim();
        // Minor if it starts with "m" but not "maj"/"may" (e.g. Am, Amin7, Am7).
        if (/^m(?!aj|ay)/i.test(rest)) return true;
        if (/^min/i.test(rest)) return true;
        return false;
    }

    // Maps ergonomic attributes like <chord shell="1">Am</chord> to
    // data-technique-icon values that CSS can render as 24x24 icons.
    function applyTechniqueIcons() {
        const chords = document.querySelectorAll('chord[shell], chord[oct]');

        chords.forEach(chord => {
            const chordName = chord.getAttribute('data-chord') || chord.textContent.trim();

            const shellStr = (chord.getAttribute('shell') || '').trim();
            const octStr = (chord.getAttribute('oct') || '').trim();

            let icon = null;

            if (shellStr === '1' || shellStr === '2') {
                const quality = isMinorChordName(chordName) ? 'min' : 'may';
                icon = `shell_${quality}_str${shellStr}`;
            }

            // If both are specified, prefer octave icon (more explicit/visual).
            if (octStr === '1' || octStr === '2') {
                icon = `oct_str${octStr}`;
            }

            if (icon) {
                chord.setAttribute('data-technique-icon', icon);
                let iconEl = chord.querySelector(':scope > .tech-icon');
                if (!iconEl) {
                    iconEl = document.createElement('span');
                    iconEl.className = 'tech-icon';
                    iconEl.setAttribute('aria-hidden', 'true');
                    chord.appendChild(iconEl);
                }
            } else {
                chord.removeAttribute('data-technique-icon');
                const iconEl = chord.querySelector(':scope > .tech-icon');
                if (iconEl) iconEl.remove();
            }
        });
    }

    function canonicalTabString(label) {
        const value = (label || '').trim();
        if (!value) return null;
        const first = value.charAt(0);
        const lowered = first.toLowerCase();

        if (lowered === 'e') {
            return first === 'E' ? 'E' : 'e';
        }
        if (lowered === 'b' || lowered === 'g' || lowered === 'd' || lowered === 'a') {
            return lowered;
        }

        return null;
    }

    function parseRiffLines(rawText) {
        const lines = (rawText || '')
            .split('\n')
            .map(line => line.replace(/\r/g, '').trim())
            .filter(Boolean);

        return lines
            .map(line => {
                const stringLabel = canonicalTabString(line.charAt(0));
                if (!stringLabel) return null;

                const content = line.slice(1).trimStart();
                return {
                    stringLabel,
                    content
                };
            })
            .filter(Boolean);
    }

    function buildEmptyTabContent(targetLength, includeBar) {
        const minimumLength = includeBar ? 8 : 7;
        const finalLength = Math.max(targetLength, minimumLength);

        if (!includeBar) {
            return '-'.repeat(finalLength);
        }

        const dashCount = Math.max(finalLength - 1, 6);
        return `${'-'.repeat(dashCount)}|`;
    }

    function normalizeRiffLines(parsedLines) {
        if (!parsedLines.length) return [];

        const lineMap = {};
        parsedLines.forEach(line => {
            lineMap[line.stringLabel] = line.content;
        });

        const observedLengths = parsedLines.map(line => line.content.length);
        const targetLength = Math.max(...observedLengths, 12);
        const includeBar = parsedLines.some(line => line.content.includes('|'));

        return TAB_STRING_ORDER.map(stringLabel => {
            const content = lineMap[stringLabel] || buildEmptyTabContent(targetLength, includeBar);
            return `${stringLabel}${content}`;
        });
    }

    function formatRepeatValue(repeatValue) {
        const value = (repeatValue || '').trim();
        if (!value) return '';
        return /^x/i.test(value) ? value : `x${value}`;
    }

    function renderRiffs() {
        const riffs = document.querySelectorAll('riff');

        riffs.forEach(riff => {
            if (riff.dataset.rendered === 'true') return;

            const rawTab = riff.textContent || '';
            const parsed = parseRiffLines(rawTab);

            if (!parsed.length) {
                riff.dataset.rendered = 'true';
                return;
            }

            const normalizedLines = normalizeRiffLines(parsed);
            const title = (riff.getAttribute('title') || riff.getAttribute('label') || '').trim();
            const note = (riff.getAttribute('note') || riff.getAttribute('hint') || '').trim();
            const repeat = formatRepeatValue(riff.getAttribute('repeat') || riff.getAttribute('x') || '');

            const head = document.createElement('div');
            head.className = 'riff-head';

            if (title) {
                const titleEl = document.createElement('span');
                titleEl.className = 'riff-title';
                titleEl.textContent = title;
                head.appendChild(titleEl);
            }

            if (repeat) {
                const repeatEl = document.createElement('span');
                repeatEl.className = 'riff-repeat';
                repeatEl.textContent = repeat;
                head.appendChild(repeatEl);
            }

            const pre = document.createElement('pre');
            pre.className = 'riff-tab';
            pre.textContent = normalizedLines.join('\n');

            riff.innerHTML = '';
            if (head.children.length) {
                riff.appendChild(head);
            }
            riff.appendChild(pre);

            if (note) {
                const noteEl = document.createElement('div');
                noteEl.className = 'riff-note';
                noteEl.textContent = note;
                riff.appendChild(noteEl);
            }

            riff.dataset.rendered = 'true';
        });
    }

    // Auto-parse chord elements som mangler data-chord attributt
    function parseChords() {
        const chords = document.querySelectorAll('chord:not([data-chord])');
        
        chords.forEach(chord => {
            const text = chord.textContent.trim();
            if (text) {
                chord.setAttribute('data-chord', text);
            }
        });
    }

    // Legg til tooltips med akkordinformasjon
    function addTooltips() {
        const chords = document.querySelectorAll('chord');
        
        chords.forEach(chord => {
            const chordName = chord.getAttribute('data-chord');
            const voicing = chord.getAttribute('data-voicing');
            const fret = chord.getAttribute('data-fret');
            
            let tooltip = chordName;
            if (voicing) tooltip += ` (${voicing})`;
            if (fret) tooltip += ` - ${fret}. bånd`;
            
            chord.setAttribute('title', tooltip);
        });
    }

    // Klikk-handler for akkorder - vis diagram popup
    function setupClickHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.tagName.toLowerCase() === 'chord') {
                const chordName = e.target.getAttribute('data-chord');
                showChordDiagram(chordName);
            }
        });
    }

    // Vis akkorddiagram i popup modal
    function showChordDiagram(chordName) {
        // Sjekk om VexChords er tilgjengelig
        if (typeof vexchords === 'undefined') {
            alert('VexChords library not loaded. Please refresh the page.');
            console.error('VexChords library not loaded');
            return;
        }

        // Hent fingering data
        const fingering = window.getChordFingering ? window.getChordFingering(chordName) : null;
        
        if (!fingering) {
            console.warn(`No fingering data for ${chordName}`);
            return;
        }

        // Opprett eller gjenbruk modal
        let modal = document.getElementById('chord-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'chord-modal';
            modal.innerHTML = `
                <div class="chord-modal-content">
                    <span class="chord-modal-close">&times;</span>
                    <h3 class="chord-modal-title"></h3>
                    <div id="chord-diagram"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Close handler
            modal.querySelector('.chord-modal-close').addEventListener('click', () => {
                modal.style.display = 'none';
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Oppdater tittel
        modal.querySelector('.chord-modal-title').textContent = chordName;

        // Clear previous diagram
        const container = modal.querySelector('#chord-diagram');
        container.innerHTML = '';

        // Tegn diagram med VexChords
        try {
            vexchords.draw(container, fingering, {
                width: 200,
                height: 240,
                strokeWidth: 2,
                showTuning: true
            });
        } catch (error) {
            console.error('Error drawing chord:', error);
            container.innerHTML = '<p style="color: #666; text-align: center;">Kunne ikke vise diagram</p>';
        }

        // Vis modal
        modal.style.display = 'flex';
    }

    // Finn akkordstatistikk for en låt
    function getChordStats(songElement) {
        const chords = songElement.querySelectorAll('chord');
        const stats = {};
        
        chords.forEach(chord => {
            const name = chord.getAttribute('data-chord');
            stats[name] = (stats[name] || 0) + 1;
        });
        
        return stats;
    }

    // Legg til søkefunksjon
    function setupSearch() {
        const searchInput = document.getElementById('chordSearch');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const songs = document.querySelectorAll('.song');
            
            songs.forEach(song => {
                const title = song.querySelector('h2')?.textContent.toLowerCase() || '';
                const chords = Array.from(song.querySelectorAll('chord'))
                    .map(c => c.getAttribute('data-chord')?.toLowerCase() || '')
                    .join(' ');
                
                const matches = title.includes(query) || chords.includes(query);
                song.style.display = matches ? 'block' : 'none';
            });
        });
    }

    // Eksporter akkorder til JSON (for backup/migrering)
    function exportToJSON() {
        const songs = document.querySelectorAll('.song');
        const data = { songs: [] };
        
        songs.forEach(song => {
            const title = song.querySelector('h2')?.textContent || 'Untitled';
            const chords = Array.from(song.querySelectorAll('chord')).map(chord => ({
                name: chord.getAttribute('data-chord'),
                voicing: chord.getAttribute('data-voicing'),
                fret: chord.getAttribute('data-fret')
            }));
            
            data.songs.push({ title, chords });
        });
        
        return data;
    }

    // Highlight alle forekomster av samme akkord ved hover
    function setupHoverHighlight() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.tagName.toLowerCase() === 'chord') {
                const chordName = e.target.getAttribute('data-chord');
                
                document.querySelectorAll(`chord[data-chord="${chordName}"]`).forEach(c => {
                    c.style.opacity = '1';
                    c.style.transform = 'scale(1.05)';
                });
                
                // Dim andre akkorder
                document.querySelectorAll(`chord:not([data-chord="${chordName}"])`).forEach(c => {
                    c.style.opacity = '0.5';
                });
            }
        });
        
        document.addEventListener('mouseout', (e) => {
            if (e.target.tagName.toLowerCase() === 'chord') {
                document.querySelectorAll('chord').forEach(c => {
                    c.style.opacity = '1';
                    c.style.transform = 'scale(1)';
                });
            }
        });
    }

    // Keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + F: Focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                const searchInput = document.getElementById('chordSearch');
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
            
            // Ctrl/Cmd + E: Export to JSON
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                const json = exportToJSON();
                console.log('Exported JSON:', json);
                // Du kan kopiere til clipboard eller laste ned
            }
        });
    }

    // Initialiser alt ved page load
    function init() {
        renderRiffs();
        parseChords();
        applyTechniqueIcons();
        addTooltips();
        setupClickHandlers();
        setupSearch();
        setupHoverHighlight();
        setupKeyboardShortcuts();
        
        console.log('Chord display initialized!');
        
        // Eksporter funksjoner for bruk i console/andre scripts
        window.ChordUtils = {
            getChordStats,
            exportToJSON,
            renderRiffs,
            parseChords,
            addTooltips
        };
    }

    // Kjør init når DOM er klar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
