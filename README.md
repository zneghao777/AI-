<div align="center">
<img
  width="1200"
  height="475"
  alt="Project banner"
  src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6"
/>
</div>

# Run and deploy your AI Studio app

This project uses a Vite frontend and a FastAPI backend. In production, the
backend serves the built frontend assets, so you only need one service on the
server.

View your app in AI Studio:
https://ai.studio/apps/6d59d25c-2cf6-49f1-8329-76af77b5c869

## Local development

Use the development commands when you are working locally and want frontend HMR
plus a reloading backend.

1. Install frontend dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`, then set `GEMINI_API_KEY`.

3. Start the backend:

   ```bash
   npm run dev:backend
   ```

4. In a separate terminal, start the frontend:

   ```bash
   npm run dev
   ```

5. Open `http://127.0.0.1:3000`.

## Production deployment

Use the production scripts when you deploy to a cloud server. The install
script creates a Python virtual environment, installs backend and frontend
dependencies, and builds the frontend. The start script runs one FastAPI
process that serves both the frontend and the API.

If the server is brand new and does not have Python or Node.js yet, you can
use the bootstrap script or the one-command deploy script first.

1. Copy the project to your server and enter the project directory.

2. Create `.env` from `.env.example`, then set your real `GEMINI_API_KEY`.

3. If the server is a fresh machine, run:

   ```bash
   ./scripts/bootstrap-server.sh
   ```

   Or run everything in one command:

   ```bash
   ./scripts/deploy-server.sh
   ```

4. If you did not use `deploy-server.sh`, run the install script:

   ```bash
   ./scripts/prod-install.sh
   ```

5. Start the app:

   ```bash
   ./scripts/prod-start.sh
   ```

6. Open `http://<your-server-ip>:8000`.

## Production script reference

Use these commands to manage the deployed app.

- Bootstrap a fresh Linux server: `./scripts/bootstrap-server.sh`
- Bootstrap, install, and start in one command: `./scripts/deploy-server.sh`
- Start the app: `./scripts/prod-start.sh`
- Stop the app: `./scripts/prod-stop.sh`
- Restart the app: `./scripts/prod-restart.sh`
- Check status: `./scripts/prod-status.sh`

## Configuration

You can override the default runtime settings with environment variables.

- `APP_HOST`: Host for Uvicorn. Default: `0.0.0.0`
- `APP_PORT`: Port for the combined frontend and backend service. Default:
  `8000`
- `VENV_DIR`: Python virtual environment path. Default: `.venv`
- `BACKEND_LOG_FILE`: Backend log file path. Default: `logs/backend.log`
- `PID_FILE`: PID file path. Default: `run/backend.pid`

If port `8000` is already in use, start the app on another port:

```bash
APP_PORT=18000 ./scripts/prod-start.sh
```

## Notes

The backend stores generated images and history under `output/`. Make sure that
the deploy user has read and write permission for that directory.

The bootstrap script currently supports common Linux distributions with
`apt-get`, `dnf`, or `yum`. It installs `python3` and Node.js 20.
