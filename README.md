# LyangRecorder

<p align="center">
  <img src="public/mascot.png" width="160" alt="LyangRecorder Mascot" />
</p>

<p align="center">
  <strong>A modern, creator-focused screen recorder & video editor built for smooth presentations, tutorials, and demos.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Windows-10%20%2F%2011-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/macOS-14.0%2B-000000?style=for-the-badge&logo=apple&logoColor=white" alt="macOS" />
  <img src="https://img.shields.io/badge/Linux-Supported-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Linux" />
  <img src="https://img.shields.io/badge/License-AGPL%203.0-green?style=for-the-badge" alt="AGPL 3.0" />
</p>

---

## 🌟 Highlights

**LyangRecorder** transforms raw screen recordings into studio-quality demo videos in minutes without needing complex video editing software.

- 🔍 **Intelligent Auto-Zoom**: Automatically zooms and pans toward mouse clicks, keystrokes, and focused interactions.
- 🎯 **Cinematic Cursor Motion**: Smooth cursor telemetry interpolation, motion blur, customizable cursor styles, and click pulse effects.
- 🖼️ **Aesthetic Frames & Backgrounds**: Wrap captures in customizable aspect ratios (16:9, 9:16, 1:1, etc.), preset color palettes, gradients, wallpapers, and soft drop shadows.
- 🫧 **Webcam Bubble Overlays**: Picture-in-picture webcam with roundness control, custom borders, mirroring, and zoom reactivity.
- ✂️ **Built-in Timeline Editor**: Drag-and-drop cuts, trims, speed adjustments, annotations, and multi-track audio without leaving the app.
- 🔤 **Space Grotesk Typography**: Sleek, modern user interface customized with Space Grotesk variable font and an earthy minimalist aesthetic.
- 🚀 **Portable Distribution**: Zero-install portable build option for seamless recording on any Windows PC.

---

## 🛠️ Tech Stack

- **Framework**: Electron + React 19 + TypeScript + Vite
- **UI Components**: Tailwind CSS, HeroUI, Lucide & Phosphor Icons
- **Rendering & Video**: Pixi.js, WebCodecs, FFmpeg, WASAPI audio
- **Native Backends**: Windows Graphics Capture (WGC), ScreenCaptureKit (macOS), Whisper speech recognition

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)
- Windows 10/11, macOS 14+, or modern Linux

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/luongnghia6799/lyangrecorder.git
cd lyangrecorder
npm install
```

### Development

Start the development server with Vite and Electron:

```bash
npm run dev
```

*(On Windows, you can also run `test-dev.bat`)*

### Building

Build the desktop installer:

```bash
# Windows installer
npm run build:win

# Windows standalone portable executable (.exe)
npm run build:portable

# macOS build
npm run build:mac

# Linux build
npm run build:linux
```

Packaged outputs will be located in the `release/` folder.

---

## 📄 License

LyangRecorder is open-source under the [GNU Affero General Public License v3.0](LICENSE.md).

Based on and inspired by the [Recordly](https://github.com/webadderallorg/Recordly) project.
