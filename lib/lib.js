let chordData = [];

// Load chord data from the text file
async function loadChordData() {
    try {
        const response = await fetch('lib/data.txt'); // Adjust path if needed
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const text = await response.text();
        chordData = parseCSV(text);
    } catch (error) {
        console.error("Error loading chord data:", error);
    }
}

// Parse CSV text into an array of arrays (ensuring the first column remains intact)
function parseCSV(text) {
    return text
        .trim()
        .split("\n")
        .map(line => {
            const parts = line.split(",").map(item => item.trim());
            return [parts[0], ...parts.slice(1)]; // Keep "C Major" together
        });
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
    console.log('input: ' + inputChords);
    let scoredMatches = [];

    chordData.forEach(row => {
        let key = row[0]; // The first column is the key name (e.g., "C Major")
        let chords = row.slice(1); // The rest are the chords in that key
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

    return scoredMatches; // Returns an array of matches instead of updating the DOM
}

// Enharmonic mapping for chord equivalence
const enharmonicMap = {
    "C#": "Db", "Db": "C#",
    "D#": "Eb", "Eb": "D#",
    "F#": "Gb", "Gb": "F#",
    "G#": "Ab", "Ab": "G#",
    "A#": "Bb", "Bb": "A#", 
    "H": "B"
};

loadChordData();