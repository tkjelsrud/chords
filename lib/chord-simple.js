/**
 * Optional JS for chord display
 * Auto-parser og tooltip funksjonalitet
 */

(function() {
    'use strict';

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
        parseChords();
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
