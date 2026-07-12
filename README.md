# garbl

Scramble audio into an unrecognizable mess. Unscramble it back.

Record directly in the browser or upload an mp3/wav (max 60 seconds). Garbl chops the audio into chunks and rearranges them — the result sounds like noise, but the original can be recovered by running it through again.

Live at [garbl.net](https://garbl.net)

## Stack

- React frontend
- Node/Express backend
- ffmpeg for audio processing
- pm2 + nginx on a VPS

## Local dev

```bash
# Install deps
npm install
cd client && npm install && cd ..

# Run backend (port 3009)
cd server && node index.js

# Run frontend with hot reload (port 3000, separate terminal)
cd client && npm start
```

The client proxies API calls to `localhost:3009` automatically when running locally.

## Deploy

```bash
# On the server
git pull
npm install
cd client && nvm use 16 && npm install && npm run build && nvm use default
pm2 restart garbl
```

## Requirements

- Node.js (v16+ for client build, v20+ for server)
- ffmpeg (`apt install ffmpeg`)
- pm2 (`npm install -g pm2`)
