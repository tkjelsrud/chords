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
        let progressionName = row[0]; // Progression name
        let chords = row.slice(1); // Chords in the progression
    
        let matchCount = normalizedChords.filter(chord => chords.includes(chord)).length;
        let sequenceScore = 0;
    
        normalizedChords.forEach((chord, idx) => {
            let enharmonic = enharmonicMap[chord]; // Handle enharmonics (e.g., Dbm → C#m)
            let isMatch = chords.includes(chord) || (enharmonic && chords.includes(enharmonic));
    
            if (isMatch) {
                let progressionIndex = chords.indexOf(chord) !== -1 ? chords.indexOf(chord) : chords.indexOf(enharmonic);
                if (progressionIndex === idx) sequenceScore += 1; // Boost when sequence order matches
            }
        });
    
        if (matchCount >= 1) {
            matchingProgressions.push({ 
                name: progressionName, 
                chords, 
                matchCount, 
                sequenceScore, 
                keyRelevance: calculateKeyMatch(inputChords, row[0]) // 🔥 New: Function to score key closeness
            });
        }
    });
    
    // 🔥 New: Sort by key relevance first, then by sequence score
    matchingProgressions.sort((a, b) => (b.keyRelevance + b.sequenceScore) - (a.keyRelevance + a.sequenceScore));


    scoredMatches.sort((a, b) => b.score - a.score);

    return {
        scales: scoredMatches,
        progressions: matchingProgressions.slice(0, 5)
    };
}

function calculateKeyMatch(inputChords, progressionKey) {
    // Step 1: Find the best matching scale for input chords
    let bestScaleMatch = chordData.find(row => 
        inputChords.some(chord => row.includes(chord))
    );

    if (!bestScaleMatch) return -1.0; // No good match, return a penalty

    let scaleKey = bestScaleMatch[0]; // Extract the matched scale key

    // Step 2: Compare scale key to progression key
    if (scaleKey === progressionKey) return 1.5; // ✅ Exact match
    if (areRelativeMajorMinor(scaleKey, progressionKey)) return 1.0; // ✅ Relative major/minor
    if (areEnharmonic(scaleKey, progressionKey)) return 0.8; // ✅ Enharmonic equivalent
    if (areCloselyRelatedKeys(scaleKey, progressionKey)) return 0.6; // ✅ Close key
    if (areWeaklyRelatedKeys(scaleKey, progressionKey)) return -0.5; // ❌ Weak match
    return -1.0; // ❌ Unrelated keys
}

// ✅ Helper function: Check if keys are relative major/minor
function areRelativeMajorMinor(key1, key2) {
    const relativePairs = {
        "C Major": "A Minor", "A Minor": "C Major",
        "G Major": "E Minor", "E Minor": "G Major",
        "D Major": "B Minor", "B Minor": "D Major",
        "A Major": "F# Minor", "F# Minor": "A Major",
        "E Major": "C# Minor", "C# Minor": "E Major",
        "B Major": "G# Minor", "G# Minor": "B Major",
        "F Major": "D Minor", "D Minor": "F Major",
        "Bb Major": "G Minor", "G Minor": "Bb Major",
        "Eb Major": "C Minor", "C Minor": "Eb Major",
        "Ab Major": "F Minor", "F Minor": "Ab Major",
        "Db Major": "Bb Minor", "Bb Minor": "Db Major",
        "Gb Major": "Eb Minor", "Eb Minor": "Gb Major"
    };
    return relativePairs[key1] === key2;
}

// ✅ Helper function: Check if keys are enharmonic (e.g., C# Major == Db Major)
function areEnharmonic(key1, key2) {
    const enharmonicPairs = {
        "C# Major": "Db Major", "Db Major": "C# Major",
        "D# Minor": "Eb Minor", "Eb Minor": "D# Minor",
        "F# Major": "Gb Major", "Gb Major": "F# Major",
        "G# Minor": "Ab Minor", "Ab Minor": "G# Minor",
        "A# Minor": "Bb Minor", "Bb Minor": "A# Minor"
    };
    return enharmonicPairs[key1] === key2;
}

// ✅ Helper function: Check if keys are closely related (e.g., Parallel Major/Minor)
function areCloselyRelatedKeys(key1, key2) {
    return key1.replace(" Major", "").replace(" Minor", "") === key2.replace(" Major", "").replace(" Minor", "");
}

// ✅ Helper function: Check if keys are weakly related (dominant/subdominant)
function areWeaklyRelatedKeys(key1, key2) {
    const weakRelations = {
        "C Major": ["G Major", "F Major"],
        "A Minor": ["E Minor", "D Minor"],
        "G Major": ["D Major", "C Major"],
        "E Minor": ["B Minor", "A Minor"],
        "D Major": ["A Major", "G Major"],
        "B Minor": ["F# Minor", "E Minor"],
        "A Major": ["E Major", "D Major"],
        "F# Minor": ["C# Minor", "B Minor"],
        "E Major": ["B Major", "A Major"],
        "C# Minor": ["G# Minor", "F# Minor"],
        "B Major": ["F# Major", "E Major"],
        "G# Minor": ["D# Minor", "C# Minor"],
        "F Major": ["C Major", "Bb Major"],
        "D Minor": ["A Minor", "G Minor"],
        "Bb Major": ["F Major", "Eb Major"],
        "G Minor": ["D Minor", "C Minor"],
        "Eb Major": ["Bb Major", "Ab Major"],
        "C Minor": ["G Minor", "F Minor"],
        "Ab Major": ["Eb Major", "Db Major"],
        "F Minor": ["C Minor", "Bb Minor"],
        "Db Major": ["Ab Major", "Gb Major"],
        "Bb Minor": ["F Minor", "Eb Minor"],
        "Gb Major": ["Db Major", "Cb Major"],
        "Eb Minor": ["Bb Minor", "Ab Minor"]
    };
    return weakRelations[key1]?.includes(key2);
}

// Enharmonic mapping for chord equivalence
const enharmonicMap = { "Gb": "F#", "F#": "Gb", "Ab": "G#", "G#": "Ab", "Db": "C#", "C#": "Db", "Eb": "D#", "D#": "Eb", "Bb": "A#", "A#": "Bb", "H": "B"};

function normalizeChord(chord) {
    return enharmonicMap[chord] || chord;
}

loadChordData();
loadProgressionsData();