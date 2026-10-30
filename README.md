🚶‍♀️ SafeWalk — Women Safety Map for Chandigarh

A hackathon demo app that shows color-coded safety zones across Chandigarh. Users can comment on places, an AI (Gemini) classifies the comment, scores update in real time, and every connected phone sees the change instantly.

Architecture
text
/backend   Node.js + Express + Socket.IO + Gemini AI (in-memory, no DB)
/mobile    Expo React Native (runs in Expo Go)

Prerequisites
Node.js ≥ 18
Expo Go app on your phone
Gemini API key: https://aistudio.google.com/apikey
Phone and laptop on the same Wi-Fi network
Quick Start
1. Backend
bash
cd backend
cp .env.example .env


Add your Gemini API key to backend/.env:

env
GEMINI_API_KEY=your_api_key_here


Then run:

bash
npm install
node server.js

2. Mobile

Update mobile/config.js with your backend LAN URL:

javascript
export const API_URL = "http://YOUR_LAN_IP:3000";


Then run:

bash
npm install
npx expo start


Scan the QR code using Expo Go.

How It Works
Login using any name.
View 12 Chandigarh locations with color-coded safety zones.
Search for places.
Tap map markers to view and add comments.
Gemini AI classifies safety reports.
Safety scores update live across connected devices using Socket.IO.
Safety Scoring
Scores range from 0 to 100.
Negative reports decrease safety scores.
Positive reports increase safety scores.
Spam and low-confidence reports are ignored.
Older comments have reduced impact.

Color indicators:

Green: 65 or above
Yellow: 40–64
Red: Below 40
API Endpoints
Method	Endpoint	Description
GET	/health	Health check
POST	/auth/demo	Demo login
GET	/places	Get all places
GET	/places/search?q=	Search places
GET	/places/:id	Place details
POST	/places/:id/comments	Add safety report
Built With
React Native
Expo
Node.js
Express
Socket.IO
Google Gemini AI

Built with ❤️ for women's safety.
SafeWalk — Safer streets, stronger communities.