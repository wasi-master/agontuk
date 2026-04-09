# agontuk

A lightweight, mobile-first browser implementation of the social deduction "Spy" game, localized and adapted for Bangladesh.

## Overview

`agontuk` is a simple, client-side web game for local multiplayer. Players pass a single device around; one player is the spy who must guess the shared category while the others try to identify the spy. The project is static (HTML/CSS/JS) and includes PWA support for installation and offline play.

## Features

- **Installable (PWA)**: Adds to home screen using the included `manifest.json` and `sw.js`.
- **Offline-capable**: Service worker caches the app for offline play and faster loads.
- **Mobile-first**: Responsive UI optimized for phones and tablets.
- **Sound & Visuals**: Audio cues and confetti for celebrations and feedback.
- **Custom categories**: Easily localized or extended by editing the categories list.
- **No build step**: Runs as static files on any simple web server.

## Quick Start — Play locally

- **Open directly**: Double-click [index.html](index.html) to open the game (service worker features will be disabled when opened as a file).
- **Recommended (local server)**: Start a simple HTTP server so the service worker can register and PWA features work:

```bash
python3 -m http.server 8000
# or
npx http-server
```

Then open `http://localhost:8000` in your browser and play.

## Testing PWA & Offline

- Serve the files over HTTP (see Quick Start).
- Open DevTools → Application → Service Workers to confirm `sw.js` is registered.
- With the app cached, disable network and reload to verify offline behavior.
- Use the browser install prompt (or Application panel) to add the app to your device.

## Project structure

- [index.html](index.html) — entry page and UI
- [manifest.json](manifest.json) — PWA metadata
- [sw.js](sw.js) — service worker (caching/offline)
- [css/style.css](css/style.css) — styles
- [js/app.js](js/app.js) — main game logic
- [js/categories.js](js/categories.js) — category/word lists to customize
- [js/confetti.js](js/confetti.js) — celebration visuals
- [js/sounds.js](js/sounds.js) — sound effects and controls
- [icons/](icons/) — PWA icons and assets

## Customization

- **Categories**: Edit [js/categories.js](js/categories.js) to add or change categories and localized words.
- **UI & text**: Modify [index.html](index.html) and [css/style.css](css/style.css) to change appearance and wording.
- **Sounds**: Replace or add audio assets referenced by [js/sounds.js](js/sounds.js).

## Contributing

- **Issues**: Open an issue to report bugs or request features.
- **Pull requests**: Fork the repo, make changes, and open a PR. Keep PRs focused and include a short description of changes.

## License & attribution

- **License**: MIT (add a `LICENSE` file to make this explicit).
- **Attribution**: Inspired by the public "Spy"/"Spyfall" family of social deduction games; this repository contains an original, localized implementation.

---

If you'd like, I can also add a short screenshot, translate the README into Bangla, or create a `LICENSE` file.
