/**
 * ChordDisplayRenderer
 * Renderer for å vise låter med fargekodede akkord-bokser
 * Kan hente data fra JSON eller direkte objekt
 */

export class ChordDisplayRenderer {
    constructor(options = {}) {
        this.container = options.container || document.body;
        this.showMetadata = options.showMetadata !== false; // default true
        this.showDuration = options.showDuration || false;
        this.showEffects = options.showEffects || false;
    }

    /**
     * Last og render låter fra JSON-fil
     */
    async loadFromJSON(jsonPath) {
        try {
            const response = await fetch(jsonPath);
            if (!response.ok) {
                throw new Error(`Failed to load ${jsonPath}: ${response.statusText}`);
            }
            const data = await response.json();
            this.renderSongs(data.songs);
            return data.songs;
        } catch (error) {
            console.error('Error loading songs:', error);
            this.showError('Could not load songs data');
            return [];
        }
    }

    /**
     * Render låter fra data-objekt
     */
    renderSongs(songs) {
        if (!Array.isArray(songs) || songs.length === 0) {
            this.showError('No songs to display');
            return;
        }

        const songsContainer = document.createElement('div');
        songsContainer.className = 'songs-container';

        songs.forEach(song => {
            const songElement = this.createSongElement(song);
            songsContainer.appendChild(songElement);
        });

        this.container.innerHTML = '';
        this.container.appendChild(songsContainer);
    }

    /**
     * Lag HTML-element for en låt
     */
    createSongElement(song) {
        const songDiv = document.createElement('div');
        songDiv.className = 'song';
        songDiv.dataset.songId = song.id;

        // Header
        const header = this.createSongHeader(song);
        songDiv.appendChild(header);

        // Akkord-grid
        const chordsGrid = this.createChordsGrid(song.chords);
        songDiv.appendChild(chordsGrid);

        // Notes (optional)
        if (song.notes) {
            const notes = document.createElement('div');
            notes.className = 'song-notes';
            notes.textContent = song.notes;
            songDiv.appendChild(notes);
        }

        return songDiv;
    }

    /**
     * Lag header for låt
     */
    createSongHeader(song) {
        const header = document.createElement('div');
        header.className = 'song-header';

        const title = document.createElement('h2');
        title.className = 'song-title';
        title.textContent = song.title;
        header.appendChild(title);

        if (song.artist) {
            const artist = document.createElement('div');
            artist.className = 'song-artist';
            artist.textContent = song.artist;
            header.appendChild(artist);
        }

        // Meta info (key, tempo, etc.)
        const metaInfo = [];
        if (song.key) metaInfo.push(`Key: ${song.key}`);
        if (song.tempo) metaInfo.push(`Tempo: ${song.tempo} BPM`);
        
        if (metaInfo.length > 0) {
            const meta = document.createElement('div');
            meta.className = 'song-meta';
            meta.innerHTML = metaInfo.map(info => `<span>${info}</span>`).join('');
            header.appendChild(meta);
        }

        return header;
    }

    /**
     * Lag grid med akkord-bokser
     */
    createChordsGrid(chords) {
        const grid = document.createElement('div');
        grid.className = 'chords-grid';

        chords.forEach((chord, index) => {
            const chordBox = this.createChordBox(chord, index);
            grid.appendChild(chordBox);
        });

        return grid;
    }

    /**
     * Lag individuell akkord-boks
     */
    createChordBox(chord, index) {
        const box = document.createElement('div');
        box.className = 'chord-box';
        
        // Parse akkordnavn for å bestemme farge og modifikatorer
        const parsed = this.parseChordName(chord.name);
        box.classList.add(`chord-${parsed.root}`);
        
        // Legg til modifikator-klasser
        if (parsed.quality === 'minor') box.classList.add('minor');
        if (parsed.quality === 'seventh') box.classList.add('seventh');
        if (parsed.quality === 'diminished') box.classList.add('diminished');
        if (parsed.quality === 'augmented') box.classList.add('augmented');

        // Akkordnavn
        const name = document.createElement('div');
        name.className = 'chord-name';
        name.textContent = chord.name;
        box.appendChild(name);

        // Metadata (voicing, fret)
        if (this.showMetadata && (chord.voicing || chord.fret)) {
            const meta = document.createElement('div');
            meta.className = 'chord-meta';
            const metaParts = [];
            if (chord.voicing) metaParts.push(chord.voicing);
            if (chord.fret) metaParts.push(`${chord.fret}fr`);
            meta.textContent = metaParts.join(' · ');
            box.appendChild(meta);
        }

        // Effekt-indikator
        if (this.showEffects && chord.effect) {
            const effect = document.createElement('div');
            effect.className = 'chord-effect';
            effect.title = `${chord.effect.bank} - ${chord.effect.patch}`;
            box.appendChild(effect);
        }

        // Varighet
        if (this.showDuration && chord.duration) {
            const duration = document.createElement('div');
            duration.className = 'chord-duration';
            duration.textContent = chord.duration;
            box.appendChild(duration);
        }

        // Data attributer for senere referanse
        box.dataset.chordName = chord.name;
        box.dataset.chordIndex = index;
        if (chord.voicing) box.dataset.voicing = chord.voicing;
        if (chord.fret) box.dataset.fret = chord.fret;

        return box;
    }

    /**
     * Parse akkordnavn til root og quality
     */
    parseChordName(chordName) {
        const name = chordName.trim();
        
        // Grunnton (C, D#, Eb, etc.)
        let root = name.charAt(0).toUpperCase();
        let rest = name.substring(1);
        
        // Sjekk for sharp/flat
        if (rest.charAt(0) === '#' || rest.charAt(0) === '♯') {
            root += 's'; // C# -> Cs
            rest = rest.substring(1);
        } else if (rest.charAt(0) === 'b' || rest.charAt(0) === '♭') {
            root += 'b';
            rest = rest.substring(1);
        }

        // Bestem kvalitet
        let quality = 'major'; // default
        
        if (rest.match(/^m(?!aj)/i)) {
            quality = 'minor';
        } else if (rest.includes('7')) {
            quality = 'seventh';
        } else if (rest.includes('dim') || rest.includes('°')) {
            quality = 'diminished';
        } else if (rest.includes('aug') || rest.includes('+')) {
            quality = 'augmented';
        }

        return { root, quality, original: chordName };
    }

    /**
     * Vis feilmelding
     */
    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.style.cssText = 'padding: 20px; background: #fee; color: #c00; border-radius: 4px; margin: 20px;';
        error.textContent = `Error: ${message}`;
        this.container.innerHTML = '';
        this.container.appendChild(error);
    }

    /**
     * Legg til event listener for akkord-klikk
     */
    onChordClick(callback) {
        this.container.addEventListener('click', (e) => {
            const chordBox = e.target.closest('.chord-box');
            if (chordBox) {
                const chordData = {
                    name: chordBox.dataset.chordName,
                    index: parseInt(chordBox.dataset.chordIndex),
                    voicing: chordBox.dataset.voicing,
                    fret: chordBox.dataset.fret ? parseInt(chordBox.dataset.fret) : null
                };
                callback(chordData, chordBox);
            }
        });
    }

    /**
     * Filtrer låter basert på key, artist, osv.
     */
    filterSongs(songs, filters) {
        return songs.filter(song => {
            if (filters.key && song.key !== filters.key) return false;
            if (filters.artist && song.artist !== filters.artist) return false;
            if (filters.search) {
                const search = filters.search.toLowerCase();
                return song.title.toLowerCase().includes(search) ||
                       (song.artist && song.artist.toLowerCase().includes(search));
            }
            return true;
        });
    }
}

// For bruk uten ES6 modules
if (typeof window !== 'undefined') {
    window.ChordDisplayRenderer = ChordDisplayRenderer;
}
