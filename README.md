# 🚶‍♀️ SafeWalk — Women Safety Map for Chandigarh

A hackathon demo app that shows color-coded safety zones across Chandigarh. Users can comment on places, an AI (Gemini) classifies the comment, scores update in real time, and every connected phone sees the change instantly.

## Architecture

```
/backend   Node.js + Express + Socket.IO + Gemini AI (in-memory, no DB)
/mobile    Expo React Native (runs in Expo Go)
```

## Prerequisites

- **Node.js** ≥ 18
- **Expo Go** app on your phone ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))
- **Gemini API key** — get one free at https://aistudio.google.com/apikey
- Phone and laptop on the **same Wi-Fi network**

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and paste your Gemini API key:
#   GEMINI_API_KEY=AIza...
npm install
node server.js
```

The server prints your LAN IP on startup:
```
🚶‍♀️ SafeWalk backend running
   Local:  http://localhost:3000
   LAN:    http://192.168.1.5:3000    ← copy this
```

### 2. Mobile

```bash
cd mobile
# Edit config.js — set API_URL to the LAN URL printed above:
#   export const API_URL = "http://192.168.1.5:3000";
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

---

## Where to paste your keys

| What | Where | Example |
|------|-------|---------|
| Gemini API key | `backend/.env` → `GEMINI_API_KEY` | `AIzaSy...` |
| Backend LAN URL | `mobile/config.js` → `API_URL` | `http://192.168.1.5:3000` |

> **Note:** If you don't set a Gemini key, the backend still works using a keyword-based fallback classifier — the demo won't break.

---

## How it works

1. **Login**: Enter any name → gets a temporary session ID
2. **Map**: See 12 Chandigarh locations with colored safety circles (green/yellow/red)
3. **Search**: Type to find a place → map flies to it
4. **Comment**: Tap a marker → see reports → add your own
5. **AI**: Gemini classifies your comment (harassment, stalking, safe, etc.) with severity
6. **Live update**: Score recalculates → circle color changes on every connected phone via Socket.IO

### Scoring

- `score = clamp(baseScore + Σ comment impacts, 0, 100)`
- Negative categories: impact = `-(severity × confidence × 4)`
- Safe: impact = `+(severity × confidence × 2)`
- Spam or low confidence (< 0.4): ignored
- Comments > 7 days old count at half weight
- Color: ≥ 65 green, 40–64 yellow, < 40 red

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/demo` | Demo login `{name}` → `{userId, name}` |
| GET | `/places` | All places with scores |
| GET | `/places/search?q=` | Case-insensitive partial search |
| GET | `/places/:id` | Place detail with comments |
| POST | `/places/:id/comments` | Add comment (rate limited: 1/20s/user/place) |

Socket.IO event: `place:updated` — emitted to all clients after every new comment.

---

## Troubleshooting

- **"Network Error" on phone**: Make sure `config.js` has the correct LAN IP and both devices are on the same Wi-Fi.
- **Map doesn't show on Android**: You may need a Google Maps API key in `app.json` → `android.config.googleMaps.apiKey`. Apple Maps works on iOS without a key.
- **Gemini errors**: The app falls back to keyword classification automatically. Check the server console for `source: gemini` or `source: fallback` logs.

---

Built for a hackathon 🏗️
