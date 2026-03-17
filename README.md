# Git Buddy 🐣

A super simple Git GUI for beginners. Only two actions: **Save a Snapshot** and **Go Back in Time**.

No branches, no merge conflicts, no terminal commands. Just save your work and go back if you need to.

![Git Buddy screenshot](docs/screenshot.png)

---

## Download

Grab the latest version from the [Releases page](../../releases/latest):

- **macOS** — Apple Silicon (`.dmg`)
- **Windows** — x64 installer (`.exe`)

---

## Installation

### macOS

1. Download the `.dmg` file from the [Releases page](../../releases/latest)
2. Open it and drag **Git Buddy** into your Applications folder
3. Open Terminal and run:
   ```
   xattr -cr /Applications/Git\ Buddy.app
   ```
4. Launch Git Buddy from your Applications folder

> **Why the Terminal step?** macOS blocks apps that aren't from the App Store until you explicitly trust them. This is normal for free, open-source tools — the command just removes the quarantine flag. Code signing requires a paid yearly certificate; we'll add it once the app has enough users to justify the cost.

### Windows

1. Download the `.exe` installer from the [Releases page](../../releases/latest)
2. Run the installer
3. If Windows SmartScreen appears, click **More info** → **Run anyway**
4. Launch Git Buddy from the Start menu

> **Why the SmartScreen warning?** Windows warns about apps from unknown publishers. This is expected for open-source tools without a paid code signing certificate. We'll add signing once the app has enough users to justify the yearly cost.

---

## Features

- **Save a Snapshot** — Write a short note, click save. Your work is backed up.
- **Go Back in Time** — See all your save points. Click one to go back to it.
- **Auto-detect changes** — See at a glance if you have unsaved work.
- **Works with or without GitHub** — Pushes online if a remote is configured, works locally if not.

---

## Development

```bash
npm install
npm run dev
```

### Building

```bash
# macOS (Apple Silicon)
npm run package:mac

# Windows
npm run package:win

# Both
npm run package:all
```

### Tech Stack

- Electron + Vue 3 + TypeScript
- electron-vite for development and building
- electron-builder for packaging
