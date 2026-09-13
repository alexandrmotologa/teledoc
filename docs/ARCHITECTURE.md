# TeleDoc architecture guide

This document outlines the architectural components of TeleDoc, their communication patterns, and how data moves through the application.

## Core design principles

1. **Client-side image processing**: All intensive pixel manipulations (perspective transformation, bilinear interpolation, adaptive thresholding, and OCR) execute in the user's browser using HTML5 Canvas and WebAssembly. The backend server does not need expensive GPU or image processing dependencies.
2. **Zero external domain requirement**: The Telegram bot operates using long polling (`getUpdates`). No reverse proxies, public SSL certificates, or custom domains are mandatory for local development and self-hosting.
3. **Graceful degradation**: TeleDoc works as a Telegram Mini App with Telegram theme parameters, haptic feedback, and in-chat delivery, but falls back seamlessly to standard web browser APIs when loaded outside Telegram.
4. **Data minimalism**: Uploaded photos and compiled PDFs reside on ephemeral disk storage with automatic hourly expiration cleanup. No database is required.

## System components

### 1. Telegram bot service (`server/src/bot/`)

Built on the grammY framework. When a user sends a photo to the bot:
- The bot extracts the highest-resolution file ID using Telegram's Bot API.
- The file is saved to the local temporary storage directory.
- The bot replies with an inline keyboard button pointing to the TeleDoc Mini App with the image identifier passed as a query parameter.
- When notified by the Mini App export endpoint, the bot sends the compiled PDF document back into the user's chat.

### 2. Fastify backend service (`server/src/`)

- Serves the static assets of the compiled React Mini App (`web/dist`).
- Provides REST endpoints for image uploads, demo assets, and PDF export requests.
- Assembles multi-page PDF files using `pdf-lib` from processed image buffers sent by the client.
- Runs a background cleanup schedule that removes files older than one hour from `./storage/`.

### 3. React Mini App frontend (`web/src/`)

- Initialized with React 19, TypeScript, Vite, and Tailwind CSS.
- Integrates `@twa-dev/sdk` for Telegram viewport management, theme variables, and haptic feedback.
- Uses an interactive canvas overlay with draggable handles and a floating loupe to adjust document corners.
- Houses the mathematical homography solver and Bradley-Roth binarizer.
- Runs Tesseract.js in a dedicated WebAssembly worker for text extraction without blocking the main UI thread.

## Interaction flow

```
User -> Telegram Chat: Sends document photo
Telegram Bot -> User: Replies with "Scan, Straighten & OCR" button
User -> Mini App: Taps button, Mini App opens in WebApp webview
Mini App -> User: Displays image with detected 4 corners
User -> Mini App: Adjusts corners using magnifying loupe, chooses "Magic B&W"
Mini App -> Fastify Backend: Sends processed page images (POST /api/export-pdf)
Fastify Backend -> pdf-lib: Compiles A4 PDF
Fastify Backend -> Telegram Bot: Dispatches PDF to user chat
User <- Telegram Chat: Receives "Scanned_Document.pdf"
```
