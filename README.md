# 🚶‍♀️ SafeWalk — Women Safety Map for Chandigarh

A hackathon demo app that shows color-coded safety zones across Chandigarh. Users can comment on places, an AI (Gemini) classifies the comment, scores update in real time, and every connected phone sees the change instantly.

---

## 🏗️ Architecture

```text
/backend   Node.js + Express + Socket.IO + Gemini AI (in-memory, zero database setup)
/mobile    React Native (Expo SDK 58, runs in Expo Go)
```

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **Expo Go** app installed on your Android/iOS phone
- Laptop and phone connected to the **same Wi-Fi network**
- *(Optional)* Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) (smart keyword fallback works automatically even without an API key!)

---

## 🚀 Quick Start (For Anyone Cloning the Repo)

### Step 1: Clone the repository
```bash
git clone https://github.com/JP43-glitch/safewalk.git
cd safewalk
```

### Step 2: Start the Backend
Open a terminal in the project root:
```bash
cd backend
npm install
node server.js
```
> *(Optional)*: Copy `.env.example` to `.env` and put your Gemini API key if you want live AI analysis. If skipped, the built-in smart multilingual fallback handles classification automatically!

### Step 3: Start the Mobile App
Open a **second terminal** in the project root:
```bash
cd mobile
npm install
npx expo start -c
```
1. Scan the QR code shown in the terminal using the **Expo Go** app on your phone.
2. The app will automatically connect to your computer's local backend!

---

## ✨ Features
- **Interactive Map**: 12 key locations across Chandigarh with dynamic safety badges.
- **Real-Time Live Updates**: Commenting on a place updates safety scores and colors live across all connected phones via WebSockets.
- **AI Safety Classification**: Classifies feedback (lighting, eve-teasing, harassment, safe, etc.) in English, Hindi, Hinglish, and Punjabi.
- **Smart Scoring**: Green (65+), Yellow (40–64), Red (<40).

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/auth/demo` | Demo login |
| `GET` | `/places` | Get all places & safety scores |
| `GET` | `/places/search?q=` | Search places |
| `GET` | `/places/:id` | Place details & comment history |
| `POST` | `/places/:id/comments` | Add safety comment (analyzed by AI) |

---

Built with ❤️ for women's safety in Chandigarh.
