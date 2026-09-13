# TeleDoc

TeleDoc is a self-hosted document scanner designed as a Telegram Mini App with a companion Telegram bot and standalone web UI. It turns angled camera photographs of papers, receipts, and invoices into clean, upright PDF documents with shadow removal and client-side text recognition.

Most commercial scanner apps gate basic exports behind monthly subscriptions, slap watermarks on pages, and upload personal documents to third-party servers. TeleDoc keeps image processing inside your browser via Canvas and WebAssembly, runs without external domain requirements, and sends clean multi-page PDFs directly back into your Telegram chat.

## Features

- **4-point perspective warp**: Straightens angled photos into rectangular pages using homography matrices and bilinear interpolation.
- **Interactive corner handles with magnifying loupe**: Draggable pins with a 2x floating loupe allow exact corner placement on mobile touchscreens.
- **Automatic edge detection**: Heuristic contour detector suggests initial crop boundaries when an image loads.
- **Bradley-Roth adaptive thresholding ("Magic B&W")**: Eliminates shadows, yellow room lighting, and camera flash gradients by comparing each pixel to its local neighborhood.
- **Color and grayscale presets**: Preserves colored stamps and signatures or produces neutral grayscale scans.
- **Client-side OCR**: WebAssembly Tesseract.js extracts text directly in the browser with word counts and instant clipboard copy.
- **Multi-page document assembly**: Rotate, reorder, add, or delete pages, then compile into standard ISO A4 PDFs using pdf-lib.
- **Dual delivery**: Works inside Telegram Mini App (with chat delivery via bot) or in any modern desktop and mobile browser with direct download.
- **Built-in demo mode**: Bundles a sample angled receipt image for immediate testing without taking camera photos.

## Quick start

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- (Optional) Telegram Bot token from @BotFather

### Running locally

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/alexandrmotologa/teledoc.git
cd teledoc
npm install
```

2. Copy the sample environment file:

```bash
cp .env.example .env
```

3. Start development servers:

```bash
# Start frontend (Vite)
npm run dev

# Or start both frontend and backend concurrently
npm run dev:all
```

Open `http://localhost:5173` in your browser. With `DEMO_MODE=true`, you can load the bundled sample document and test perspective correction, filters, OCR, and PDF generation immediately.

### Running with Docker

```bash
docker compose up --build
```

The service will be accessible on `http://localhost:8080`.

## Architecture overview

```
                                +---------------------------+
                                |  Telegram Client / App    |
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

Detailed architectural specifications and data flows are documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Image processing pipeline

1. **Corner detection and adjustment**: The user places four corner points `[Top-Left, Top-Right, Bottom-Right, Bottom-Left]` on the document boundary.
2. **Projective transformation**: Solves an 8-parameter system of linear equations using Gaussian elimination to obtain the 3x3 homography matrix $H$. Backward mapping samples source pixels via bilinear interpolation to avoid aliasing.
3. **Bradley-Roth binarization**: Computes an integral image in $O(1)$ time per pixel over an adaptive window. If a pixel's luminance is $T\%$ lower than the local neighborhood average, it becomes black, otherwise white.

Read [docs/IMAGE_PIPELINE.md](docs/IMAGE_PIPELINE.md) for full mathematical derivations and code examples.

## Environment variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `TELEGRAM_BOT_TOKEN` | Token provided by @BotFather. Optional in demo mode. | `""` |
| `PORT` | HTTP port for the Fastify server. | `8080` |
| `HOST` | Host address to bind the server. | `0.0.0.0` |
| `APP_URL` | Public Mini App URL used in inline keyboard buttons. | `http://localhost:8080` |
| `DEMO_MODE` | Enables sample assets and bypasses bot token requirement. | `true` |
| `STORAGE_DIR` | Directory for ephemeral uploads and generated PDFs. | `./storage` |

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Image Pipeline and Mathematics](docs/IMAGE_PIPELINE.md)
- [REST and Bot API Reference](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
