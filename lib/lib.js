let chordData = [];
let progressionsData = [];
let romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

// Load chord data from the text file
async function loadChordData() {
    try {
        const response = await fetch('lib/scales.txt'); // Adjust path if needed
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const text = await response.text();
        chordData = parseCSV(text);
    } catch (error) {
        console.error("Error loading chord data:", error);
    }
}

async function loadProgressionsData() {
    const response = await fetch("lib/progressions.txt");
    const text = await response.text();
    progressionsData = parseCSV(text);
}

// Parse CSV text into an array of arrays (ensuring the first column remains intact)
function parseCSV(text) {
    return text
        .trim()
        .split("\n")
        .map(line => {
            if (line.startsWith("#") || line.trim() === "") return null; // Ignore comments & empty lines
            const parts = line.split(/\s*,\s*/).map(item => item.trim());
            return parts.length > 1 ? [parts[0], ...parts.slice(1)] : null; // Keep "C Major" together
        })
        .filter(line => line !== null); // Remove ignored lines
}

// Function to search each line separately
function searchChords() {
    const inputLines = document.getElementById("chordInput").value
        .trim()
        .split("\n") // Split input into lines
        .map(line => line.trim()) // Trim each line
        .filter(line => line !== ""); // Remove empty lines

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    inputLines.forEach((line, index) => {
        const inputChords = line
            .split(/\s*,\s*|\s+/) // Split on commas and spaces
            .map(chord => chord.trim())
            .filter(chord => chord !== ""); // Remove empty items

        const matches = getChordMatches(inputChords);

        // Display results for this line
        const section = document.createElement("div");
        section.classList.add("result-section");
        section.innerHTML = `<strong>Line ${index + 1}: ${line}</strong>`;

        if (matches.length > 0) {
            const list = document.createElement("ul");
            matches.forEach(match => {
                const listItem = document.createElement("li");
                listItem.textContent = `${match.key} (Score: ${match.score.toFixed(1)}) → ${match.chords.join(" | ")}`;
                list.appendChild(listItem);
            });
            section.appendChild(list);
        } else {
            section.innerHTML += "<p>No matching keys found.</p>";
        }

        resultsDiv.appendChild(section);
    });
}

function getChordMatches(inputChords) {
    let scoredMatches = [];
    let normalizedChords = inputChords.map(chord => normalizeChord(chord));

    // Standard Roman numeral mappings for major/minor scales
    const romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];

    // 🔹 Search in Scale Data (chordData)
    chordData.forEach(row => {
        let key = row[0]; // Key name (e.g., "C Major")
        let chords = row.slice(1); // Full list of chords in the key
        let score = 0;
        let chordPlacements = [];

        // 🔹 Ensure full scale chords are stored
        let fullScaleChords = chords.map((chord, idx) => ({
            chord: chord,
            placement: romanNumerals[idx] || "?" // Map correct numerals
        }));

        normalizedChords.forEach(inputChord => {
            let matchIndex = chords.indexOf(inputChord);
            
            if (matchIndex !== -1) {
                score += 1.0; // Exact match
            } else {
                // Check for enharmonic match
                let enharmonic = enharmonicMap[inputChord];
                if (enharmonic && chords.includes(enharmonic)) {
                    matchIndex = chords.indexOf(enharmonic);
                    score += 0.9; // Enharmonic match (e.g., F# → Gb)
                }
            }
        
            let placement = matchIndex !== -1 ? romanNumerals[matchIndex] || "" : "";
            let isMinor = /m|dim|min|m7|m6|°/.test(inputChord);
            if (placement) placement = isMinor ? placement.toLowerCase() : placement;
        
            chordPlacements.push({ chord: inputChord, placement });
        });

        // 🔹 Generate suggestions (unused chords in key)
        let usedChords = chordPlacements.map(p => p.chord);
        let suggestions = chords
            .map((chord, idx) => ({ chord, placement: romanNumerals[idx] }))
            .filter(p => !usedChords.includes(p.chord) && p.placement !== "I" && !p.chord.includes("dim"))
            .slice(0, 3)
            .map(p => p.chord);

        // Boost pure Major or Natural Minor scales
        if (key.includes("Major") && !key.includes("Harmonic") && !key.includes("Melodic")) score += 0.1;
        if (key === "Minor" || key.includes(" Natural Minor")) score += 0.1;

        if (score > 0) {
            scoredMatches.push({ 
                key, 
                score, 
                chordPlacements, 
                suggestions, 
                fullScaleChords
            });
        }
    });

    // 🔹 Search in Progressions (Fix Matching Logic)
    let matchingProgressions = [];
    progressionsData.forEach(row => {
        let progressionName = row[0]; // Name of progression
        let chords = row.slice(1); // Chords in the progression

        let matchCount = normalizedChords.filter(chord => chords.includes(chord)).length;
        let sequenceScore = 0;

        normalizedChords.forEach((chord, idx) => {
            if (chords.includes(chord)) {
                let progressionIndex = chords.indexOf(chord);
                if (progressionIndex === idx) sequenceScore += 1; 
            }
        });

        if (matchCount >= 1) {
            matchingProgressions.push({ 
                name: progressionName, 
                chords, 
                matchCount, 
                sequenceScore,
                fullProgressionChords: chords.map((chord, i) => ({ chord, placement: romanNumerals[i] || "?" })) // 🔥 Now stores **all chords** in progression
            });
        }
    });

    matchingProgressions.sort((a, b) => (b.matchCount + b.sequenceScore) - (a.matchCount + a.sequenceScore));

    scoredMatches.sort((a, b) => b.score - a.score);

    return {
        scales: scoredMatches,
        progressions: matchingProgressions.slice(0, 5)
    };
}

// Enharmonic mapping for chord equivalence
const enharmonicMap = { "Gb": "F#", "F#": "Gb", "Ab": "G#", "G#": "Ab", "Db": "C#", "C#": "Db", "Eb": "D#", "D#": "Eb", "Bb": "A#", "A#": "Bb", "H": "B"};

function normalizeChord(chord) {
    return enharmonicMap[chord] || chord;
}

loadChordData();
loadProgressionsData();