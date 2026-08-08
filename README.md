# Next Puzzle

Marketing site for **Next Puzzle** — advisory at the intersection of AI and cybersecurity.

Live at **https://nextpuzzleai.com** (GitHub Pages).

## Stack
Static site — hand-written HTML / CSS / vanilla JS. No build step.

## Local preview
Open `index.html` directly, or serve the folder:
```
python3 -m http.server 8080
```

## Deploy
Push to `main`. GitHub Pages serves from the repo root.
The `CNAME` file binds the custom domain; `.nojekyll` disables Jekyll processing.

## Structure
- `index.html` — page markup
- `styles.css` — design system + layout
- `script.js` — nav, scroll-reveal, stat counters, cursor glow
- `assets/` — favicon and imagery
