# Deployment guide

TeleDoc can be deployed using standard Docker containers or run directly via Node.js on any Linux or Windows server.

## 1. Running with Docker Compose (recommended)

1. Ensure Docker Engine and Docker Compose are installed on your host.
2. Clone the repository and configure `.env`:
   ```bash
   git clone https://github.com/alexandrmotologa/teledoc.git
   cd teledoc
   cp .env.example .env
   ```
3. Set your `TELEGRAM_BOT_TOKEN` in `.env` if you plan to use live Telegram integration.
4. Launch the stack:
   ```bash
   docker compose up -d --build
   ```
5. Check service logs:
   ```bash
   docker compose logs -f
   ```

The container handles both building the frontend Vite assets and running the Fastify server with long polling enabled.

## 2. Bare-metal Node.js deployment

For deployment on a VPS (Ubuntu, Debian) or Windows Server:

1. Install Node.js 20 or later:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
2. Install project dependencies and build all workspaces:
   ```bash
   npm install
   npm run build
   ```
3. Use a process manager like `pm2` or a systemd service to keep the process running:
   ```bash
   npm install -g pm2
   pm2 start npm --name "teledoc" -- run start
   pm2 save
   ```

## 3. Configuring your Telegram bot with @BotFather

1. Message `@BotFather` on Telegram.
2. Create a new bot with `/newbot` and follow the prompts to name it (e.g., `TeleDoc Scanner`).
3. Copy the HTTP API token into your `.env` as `TELEGRAM_BOT_TOKEN`.
4. Configure the Menu Button to open your Mini App:
   - Send `/setmenubutton` to @BotFather.
   - Select your bot.
   - Provide the URL where TeleDoc is hosted (e.g. `https://your-domain.com` or a tunneling URL like `https://xxx.ngrok-free.app` during development).
5. For local testing without a public domain, use `DEMO_MODE=true` in a web browser directly at `http://localhost:8080`.
