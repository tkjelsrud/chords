let chordData = [];
let progressionsData = [];

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

// Function to score matches for a given set of chords
function getChordMatches(inputChords) {
    let scoredMatches = [];

    chordData.forEach(row => {
        let key = row[0]; // The first column is the key name
        let chords = row.slice(1); // The rest are the chords
        let score = 0;

        inputChords.forEach(inputChord => {
            if (chords.includes(inputChord)) {
                score += 1; // Direct match
            } else {
                let enharmonic = enharmonicMap[inputChord];
                if (enharmonic && chords.includes(enharmonic)) {
                    score += 0.8; // Enharmonic match
                }
            }
        });

        // Boost for Pure Major and Natural Minor scales
        if (key.includes("Major") && !key.includes("Harmonic") && !key.includes("Melodic")) {
            score += 0.1;
        }
        if (key === "Minor" || key.includes(" Natural Minor")) {
            score += 0.1;
        }

        if (score > 0) {
            scoredMatches.push({ key, score, chords: row });
        }
    });

    // Sort matches by highest score
    scoredMatches.sort((a, b) => b.score - a.score);

    return scoredMatches;
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
    let romanNumerals = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
    let normalizedChords = inputChords.map(chord => normalizeChord(chord));

    //console.log("🔍 Input Chords:", normalizedChords);
    //console.log("🎶 Loaded Progressions:", progressionsData);

    // 🔹 Search in Scale Data (chordData)
    chordData.forEach(row => {
        let key = row[0]; 
        let chords = row.slice(1); 
        let score = 0;
        let chordPlacements = [];

        normalizedChords.forEach(inputChord => {
            let matchIndex = chords.indexOf(inputChord);
            if (matchIndex !== -1) {
                score += 1;
                let placement = romanNumerals[matchIndex] || "";
                let isMinor = /m|dim|°/.test(inputChord);
                if (placement) placement = isMinor ? placement.toLowerCase() : placement;
                chordPlacements.push({ chord: inputChord, placement });
            } else {
                chordPlacements.push({ chord: inputChord, placement: "" });
            }
        });

        let usedChords = chordPlacements.map(p => p.chord);
        let suggestions = chords
            .map((chord, idx) => ({ chord, placement: romanNumerals[idx] }))
            .filter(p => !usedChords.includes(p.chord) && p.placement !== "I" && !p.chord.includes("dim"))
            .slice(0, 3)
            .map(p => p.chord);

        if (key.includes("Major") && !key.includes("Harmonic") && !key.includes("Melodic")) score += 0.1;
        if (key === "Minor" || key.includes(" Natural Minor")) score += 0.1;

        if (score > 0) {
            scoredMatches.push({ key, score, chordPlacements, suggestions, progressions: [] });
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

        if (matchCount >= 1) { // 🔹 Allow matching with at least one chord
            matchingProgressions.push({ name: progressionName, chords, matchCount, sequenceScore });
        }
    });

    matchingProgressions.sort((a, b) => (b.matchCount + b.sequenceScore) - (a.matchCount + a.sequenceScore));

    //console.log("🎼 Matched Progressions:", matchingProgressions);

    // 🔹 Attach progressions to all matching keys (not just the first)
    scoredMatches.forEach(match => {
        match.progressions = matchingProgressions.slice(0, 3);
    });

    scoredMatches.sort((a, b) => b.score - a.score);

    return scoredMatches;
}

// Enharmonic mapping for chord equivalence
const enharmonicMap = { "Gb": "F#", "F#": "Gb", "Ab": "G#", "G#": "Ab", "Db": "C#", "C#": "Db", "Eb": "D#", "D#": "Eb", "Bb": "A#", "A#": "Bb", "H": "B"};

function normalizeChord(chord) {
    return enharmonicMap[chord] || chord;
}

loadChordData();
loadProgressionsData();