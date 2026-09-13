<div align="center">

<img src="docs/images/logo.png?raw=true" alt="TeleDoc Logo" width="130" style="border-radius: 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.3);" />

# TeleDoc

**Self-Hosted Document Scanner for Telegram & The Modern Web**

*Turn crumpled receipts, skewed invoices, and angled paperwork into crisp, archival-grade PDFs directly in Telegram or any browser.*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-4.28-black?style=flat-square&logo=fastify)](https://fastify.dev/)
[![grammY](https://img.shields.io/badge/grammY-1.29-24A1DE?style=flat-square&logo=telegram)](https://grammy.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-purple?style=flat-square)](docs/ARCHITECTURE.md)

<br/>

<img src="docs/images/screenshot_studio_desktop.png?raw=true" alt="TeleDoc Desktop Pro Studio Layout" width="100%" style="border-radius: 14px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />

<p align="center"><em>TeleDoc Pro Studio Layout (Desktop / Tablet): Left-rail page filmstrip, center dark canvas stage, and right-rail inspector drawer with live tuning sliders and document tools.</em></p>

<br/>

<img src="docs/images/demo_walkthrough.gif?raw=true" alt="TeleDoc Mobile Telegram Mini App Interactive Walkthrough" width="360" style="border-radius: 16px; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 20px 40px rgba(0,0,0,0.5);" />

<p align="center"><em>Mobile Telegram Mini App Walkthrough: 4-point homography warp, fine-tuning drawer, vector signature signing, official stamp overlay, client OCR, and PDF compilation.</em></p>

</div>

---

## Why TeleDoc?

Most mobile scanner utilities lock core functionality behind costly recurring subscriptions, stamp intrusive watermarks over your pages, or silently transmit sensitive bank statements to remote cloud servers.

**TeleDoc** provides a self-hosted, private alternative built specifically for Telegram's ecosystem and standalone web environments:

- **Adaptive Dual-Mode Architecture**: Seamlessly scales from a compact Telegram Mini App on iOS/Android to an expansive 3-column Pro Studio on desktop and tablet screens.
- **100% In-Browser Computation**: Homography perspective warps, Bradley-Roth binarization, and OCR text extraction happen directly inside the client engine via HTML5 Canvas and WebAssembly.
- **Zero Document Retention**: Images never touch cloud AI services. Fastify acts solely as an ephemeral PDF compiler and direct pipe back to your Telegram chat.
- **No Domain Hassles**: Operates seamlessly in local demo mode, private Docker containers, or public Telegram Mini App deployments behind an HTTPS reverse proxy.

---

## Key Features

### 📐 Computer Vision & Image Processing
- **4-Point Perspective Warp**: Corrects severe keystoning and angle distortion using bilinear interpolation over an 8-parameter homography matrix ($H$).
- **Interactive Corner Handles with Magnifying Loupe**: Position document corners down to the single pixel using touch handles paired with an automatic $2\times$ magnification loupe.
- **Automatic Boundary Detection**: Analyzes high-contrast contours to immediately pre-select document edges when an image is loaded.
- **Bradley-Roth Adaptive Thresholding ("Magic B&W")**: Eliminates shadows, ambient yellow lamp tints, and phone flash hot-spots using an $O(1)$ integral image calculation.
- **Manual Fine-Tuning Sliders**: Micro-adjust threshold sensitivity ($5\%\text{--}30\%$), contrast ($-50\%\text{--}+50\%$), and brightness on the fly.
- **Color & Grayscale Modes**: Retain colorful tax stamps and blue ink signatures, or switch to clean neutral grayscale.

### ✍️ Document Editing & Personalization
- **Digital Signature Pad**: Sign contracts and receipts on a smooth, vector-like touch canvas with variable line width and high-DPI export.
- **Watermarks & Verification Stamps**: Overlay preset official stamps (`APPROVED`, `PAID`, `CONFIDENTIAL`, `DRAFT`) or type custom watermark labels with angle and opacity tuning.
- **Movable & Scalable Overlays**: Drag, reposition, and scale signatures and stamps anywhere on the document canvas with direct delete controls.

### 🔍 Recognition & Multi-Page PDF Assembly
- **Client-Side Multilingual OCR**: Extract machine text directly within the browser using WebAssembly Tesseract.js across English, Romanian, French, German, and Spanish.
- **Multi-Page Document Carousel**: Rearrange pages, rotate individual sheets in $90^\circ$ increments, or add new snaps via camera or gallery.
- **Flexible PDF Page Sizing**: Export as standardized ISO A4, US Letter, or original image aspect ratio (`Fit Page`) with adjustable JPEG compression ratios.
- **Draft Session Recovery**: Protects your work against accidental tab closes or Telegram Mini App reloads by persisting incomplete scans in local browser storage.
- **Dual Delivery Pipeline**: Receive finished multi-page PDFs directly in your Telegram chat or download immediately via browser.

---

## Visual Showcase (Mobile Telegram Mini App)

| Perspective Correction & Loupe | Magic B&W & Manual Fine-Tuning |
| :---: | :---: |
| <img src="docs/images/screenshot_crop.png?raw=true" width="340" alt="Perspective Crop with Loupe" /> | <img src="docs/images/screenshot_tuning.png?raw=true" width="340" alt="Fine Tuning Sliders" /> |
| *Pinpoint corner handles with live 2x floating loupe* | *Adaptive thresholding and real-time contrast controls* |

| Digital Signature Pad & Stamps | Document Text Extraction (OCR) |
| :---: | :---: |
| <img src="docs/images/screenshot_signed_doc.png?raw=true" width="340" alt="Signed Document with Stamp" /> | <img src="docs/images/screenshot_ocr.png?raw=true" width="340" alt="Multilingual OCR" /> |
| *Touch-drawn signature and official watermark stamp* | *WASM-powered text recognition with word count* |

| Watermark & Stamp Customizer | PDF Export & Compression Options |
| :---: | :---: |
| <img src="docs/images/screenshot_stamp.png?raw=true" width="340" alt="Watermark Customizer" /> | <img src="docs/images/screenshot_export.png?raw=true" width="340" alt="PDF Export Dialog" /> |
| *Preset chips, angle slider, opacity & color palette* | *ISO A4 / Letter format, title, and compression presets* |

---

## System Architecture

```
                                +---------------------------+
                                |   Telegram Client / App   |
                                +-------------+-------------+
                                              |
                     Photos sent to bot       | Open Mini App
                             v                v
                  +--------------------+  +--------------------+
                  |  grammY Bot        |  |  React Mini App    |
                  |  (Long Polling)    |  |  (Vite + Tailwind) |
                  +---------+----------+  +---------+----------+
                            |                       |
                 Saves raw  |                       | 1. Homography warp
                 photo to   |                       | 2. Bradley-Roth threshold
                 temp disk  |                       | 3. Client OCR (Tesseract)
                            v                       v
                  +--------------------------------------------+
                  |  Fastify Backend Service                   |
                  |  - Serves static Mini App bundle           |
                  |  - Compiles multi-page PDF via pdf-lib     |
                  |  - Sends PDF back to chat via bot          |
                  |  - Cleans expired temp files               |
                  +--------------------------------------------+
```

For deeper insights into data flow and architectural design choices, read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Quick Start

### Prerequisites

- **Node.js**: v20.x or later
- **npm**: v10.x or later
- *(Optional)* A Telegram Bot Token from [@BotFather](https://t.me/BotFather) for live Telegram integration.

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/alexandrmotologa/teledoc.git
cd teledoc
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Set `DEMO_MODE=true` if testing locally without a Telegram bot token.

### 3. Start Development Mode

```bash
# Launch both frontend (Vite) and backend (Fastify) concurrently
npm run dev:all
```

Navigate to `http://localhost:5173/?demo=true` in your browser. TeleDoc will load with sample skewed paperwork ready for testing.

### 4. Running Production Bundle

```bash
# Build both web client and server
npm run build

# Start the unified production server
npm start
```

### 5. Running with Docker

```bash
docker compose up --build
```

The containerized service binds to `http://localhost:8080`.

---

## Configuration Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Bot API token from @BotFather. Optional when `DEMO_MODE=true`. | `""` |
| `PORT` | HTTP port for the Fastify server. | `8080` |
| `HOST` | Network interface to bind. | `0.0.0.0` |
| `APP_URL` | Public Mini App URL sent in bot buttons. | `http://localhost:8080` |
| `DEMO_MODE` | Serves mock user profile and bundled sample document. | `true` |
| `STORAGE_DIR` | Filesystem path for ephemeral photo uploads and PDFs. | `./storage` |

---

## Documentation Library

- [📐 Computer Vision & Image Pipeline](docs/IMAGE_PIPELINE.md): Mathematical derivations for Gaussian elimination homography, bilinear sampling, and integral image thresholding.
- [🏛 Architecture Guide](docs/ARCHITECTURE.md): Component breakdown, security boundaries, and memory lifecycle.
- [📡 API Reference](docs/API.md): Specification for the REST endpoints and Telegram bot commands.
- [🚀 Deployment Guide](docs/DEPLOYMENT.md): Production setups with Docker, Nginx reverse proxy, and SSL termination.

---

## Testing

TeleDoc maintains automated test suites across the computer vision algorithms, Fastify REST endpoints, and PDF compilation pipelines:

```bash
# Run all automated tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## License

TeleDoc is open-source software licensed under the [MIT License](LICENSE).
