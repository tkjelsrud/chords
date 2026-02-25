# 🎵 Chord Analysis Tool

A modern, responsive web application for analyzing musical chord progressions and discovering musical possibilities. Built with a focus on guitar/bass instruments, providing real-time chord analysis, key detection, and progression suggestions.

## ✨ Features

- **Real-time Chord Analysis** - Type chords and instantly see which keys they belong to
- **Chord Progression Suggestions** - Get recommendations for next chords in your progression
- **Multiple Tabs** - Work on multiple chord progressions simultaneously
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
- **Keyboard Navigation** - Full keyboard shortcuts for power users
- **Error Resilience** - Graceful handling of network issues and invalid inputs
- **Performance Optimized** - Debounced input, efficient DOM updates, and performance monitoring

### 🎸 Pure HTML Chord Notation

A simple, standalone system for displaying songs with color-coded chords using custom HTML elements:

```html
<song>
    <h3>My Song</h3>
    <song-meta>Key: Am | Tempo: 120</song-meta>
    <chord>Am</chord> <chord>F</chord> <chord>C</chord> <chord>G</chord>
</song>
```

- **Color-coded**: Each root note (C, D, E...) has a unique Riso-inspired color
- **Interactive**: Click chords to see guitar fingerings (powered by VexChords)
- **Special notations**: `<chord alt>` (alternative), `<chord half>` (half-width/passing chord), `<chord oct="1|2">` / `<chord shell="1|2">` (technique icons), `<chord up>` / `<chord down>` (legacy octave direction arrows), `<chord>C <em>Play scale up</em></chord>` (inline chord subtext), `<chord bass="A">C</chord>` (split chord with bass box), `<chord half bass="A">C</chord>` (half-width split passing chord), `<sep>` (separator), `<riff>` (compact single-note/tab block with optional title/note/repeat)
- **Zero configuration**: Just write chord names, JS auto-parses everything
- See [demo.html](demo.html) for complete examples (it also works as a starter template)

## 🚀 Getting Started

### Live Demo
Visit the live app at: **[GitHub Pages URL]** (replace with your actual GitHub Pages URL)

### Quick Start
1. **No installation required!** - This is a pure front-end web app
2. Start typing chord names like: `C Am F G` or `F# Bb Cm G#`
3. See instant analysis results appear above your chords
4. Click on results for detailed key information

### Local Development
```bash
# Clone the repository
git clone https://github.com/tkjelsrud/chords.git
cd chords

# Serve locally (required for ES6 modules to work)
# Option 1: Python 3
python3 -m http.server 8000

# Option 2: Node.js
npx http-server

# Option 3: PHP
php -S localhost:8000

# Open http://localhost:8000 in your browser
```

> **Note**: The app must be served over HTTP/HTTPS (not opened as file://) due to ES6 module requirements and CORS restrictions.

## 📝 Usage Examples

### Basic Chord Input
```
C Am F G
```

### Complex Progressions
```
Cmaj7 Am7 Dm7 G7
Em B7 C Am
```

### Multiple Lines
```
C Am F G
Am F C G
F Am G C
```

## ⌨️ Keyboard Shortcuts

- **Ctrl/Cmd + T** - Create new tab
- **Ctrl/Cmd + W** - Close current tab
- **Ctrl/Cmd + 1-9** - Switch to tab by number
- **Ctrl/Cmd + ←/→** - Navigate between tabs
- **Ctrl/Cmd + Enter** - Force analysis update
- **Tab** - Insert spaces (in editor)
- **Escape** - Focus editor
- **F1** - Show help

## 🏗️ Architecture

This is a **100% front-end application** - no server or API required! It runs entirely in the browser using:

### File Structure
```
├── index.html               # Clean semantic HTML
├── js/
│   ├── app.js              # Main application entry point
│   └── modules/            # ES6 modules for organized code
│       ├── ChordAnalyzer.js   # Core music theory logic
│       ├── DataLoader.js      # Loads local text files
│       ├── TabManager.js      # Multi-tab functionality
│       ├── UIManager.js       # DOM manipulation & UI
│       └── Analytics.js       # Optional user tracking
├── lib/
│   ├── default.css         # Modern CSS with variables
│   ├── scales.txt          # Musical scales database
│   ├── progressions.txt    # Chord progressions database
│   └── lib.js             # Legacy compatibility
└── README.md
```

### Front-End Only Benefits
- **Zero Setup** - Just open in browser or host on GitHub Pages
- **No Dependencies** - Pure JavaScript, CSS, and HTML
- **Offline Capable** - Works without internet after first load
- **Fast Loading** - No server round-trips for chord analysis
- **Privacy Friendly** - All processing happens locally

### Key Design Principles
- **Pure Front-End** - All chord analysis happens in the browser
- **ES6 Modules** - Modern JavaScript architecture without build tools
- **Local Data** - Musical data stored in simple text files
- **Progressive Enhancement** - Works even if advanced features fail

## 🎵 Music Data

The app uses simple text files for all musical knowledge:

### lib/scales.txt
Musical scales with their chord relationships:
```
C Major, C, Dm, Em, F, G, Am, Bdim
F# Major, F#, G#m, A#m, B, C#, D#m, E#dim
Bb Major, Bb, Cm, Dm, Eb, F, Gm, Adim
```

### lib/progressions.txt  
Common chord progressions across genres:
```
Jazz ii-V-I (C), Dm7, G7, Cmaj7
Pop Progression, C, Am, F, G
Blues in E, E, E7, A, A7, E, B7, A7, E
```

> **Easy to Customize**: Just edit these text files to add your own scales or progressions!

## 🎨 Styling

The application uses modern CSS with:
- **CSS Custom Properties** for consistent theming
- **Responsive Design** with mobile-first approach
- **Smooth Animations** with reduced-motion support
- **Accessible Color Contrast** meeting WCAG guidelines

## 📱 Mobile Support

Optimized for mobile devices with:
- Touch-friendly interface elements
- Responsive typography and spacing
- Adaptive chord result positioning
- Gesture-based navigation

## 🔍 Browser Support

- **Modern Browsers** - Chrome 88+, Firefox 85+, Safari 14+, Edge 88+
- **ES6 Modules** - Required for module system
- **CSS Custom Properties** - Required for theming
- **Fetch API** - Required for data loading

## 🐛 Troubleshooting

### Common Issues

**Chords not being recognized:**
- Use standard notation: `C`, `Am`, `F#`, `Bb7`, `Cmaj7`
- Sharp notes: `F#`, `C#`, `G#` (use # symbol)
- Flat notes: `Bb`, `Eb`, `Ab` (use b letter)
- Complex chords: `Cmaj7`, `Dm7`, `G7sus4`

**App not loading:**
- Must be served over HTTP/HTTPS (not opened as file://)
- Check browser console for errors
- Try a different web browser (Chrome, Firefox, Safari)
- Ensure internet connection for first load

**Cursor jumping while typing:**
- This should be fixed! Report if you still see this issue
- Try typing slower if problem persists
- Refresh page as workaround

## 🔮 Future Enhancements

- [ ] **Audio Input** - Microphone chord detection using Web Audio API
- [ ] **Guitar Diagrams** - Visual chord fingerings for guitar/bass
- [ ] **Piano Visualization** - Piano keyboard chord visualization  
- [ ] **MIDI Support** - Import/export chord progressions as MIDI
- [ ] **Audio Playback** - Play chord progressions using Web Audio
- [ ] **Custom Scales** - Add your own musical scales and modes
- [ ] **Chord Inversions** - Support for chord inversions and voicings
- [ ] **Export Features** - Save progressions as text, PDF, or images

## 📄 License

This project is open source. See individual files for specific licensing information.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Bug Fixes

### Recent Fixes (Latest)

**Fixed F# Chord Recognition:**
- Problem: `F#` was being matched as just `F`
- Solution: Improved regex to properly handle accidentals (#, b, ♯, ♭)
- Now correctly recognizes: `F#`, `Bb`, `C#m7`, `Abmaj7`, etc.

**Fixed Cursor Jumping:**
- Problem: Typing cursor would jump backward during chord formatting
- Solution: Better selection preservation during DOM manipulation
- Now maintains cursor position while typing

**Front-End Optimizations:**
- Pure client-side application (no server required)
- Improved performance monitoring and error handling
- Better accessibility with ARIA labels and keyboard shortcuts

### Testing
To test the fixes, try typing:
```
F# Bb C# Eb
F#maj7 Bbm7 C#dim Eb7sus4
```

Both chord recognition and cursor position should work smoothly now!

---

Made with ❤️ for musicians and music lovers everywhere.
