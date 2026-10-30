// SafeWalk Backend — Express + Socket.IO + Gemini AI classification
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const os = require("os");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─── Gemini setup ───────────────────────────────────────────────────────────
const rawApiKey = (process.env.GEMINI_API_KEY || "").trim();
const hasValidGeminiKey =
  rawApiKey.length > 10 &&
  rawApiKey !== "your_gemini_api_key_here" &&
  !rawApiKey.startsWith("your_");

const genAI = hasValidGeminiKey ? new GoogleGenerativeAI(rawApiKey) : null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const SYSTEM_INSTRUCTION = `You are a safety-comment classifier for a women's safety app in India.
You understand English, Hindi, Punjabi and Hinglish.
Return ONLY valid JSON with this exact shape:
{"category":"harassment|groping|stalking|eve_teasing|unsafe_environment|poor_lighting|theft|safe|spam","severity":1,"confidence":0.0,"summary":"max 12 words, English","mentionsPerson":false}
- category must be one of: harassment, groping, stalking, eve_teasing, unsafe_environment, poor_lighting, theft, safe, spam
- severity is an integer 1-5
- confidence is a float 0.0-1.0
- summary is at most 12 words in English
- mentionsPerson is true if the comment names a specific individual
Mark irrelevant or troll comments as spam. Never repeat names of individuals in the summary.`;

// ─── Seed data ──────────────────────────────────────────────────────────────
const SEED_PLACES = [
  { id: "p1",  name: "Sector 17 Plaza",            lat: 30.7398, lng: 76.7827, baseScore: 75 },
  { id: "p2",  name: "Elante Mall",                lat: 30.7056, lng: 76.8013, baseScore: 85 },
  { id: "p3",  name: "Sukhna Lake",                lat: 30.7421, lng: 76.8188, baseScore: 70 },
  { id: "p4",  name: "ISBT Sector 43",             lat: 30.7189, lng: 76.7466, baseScore: 55 },
  { id: "p5",  name: "Sector 22 Market",           lat: 30.7333, lng: 76.7686, baseScore: 65 },
  { id: "p6",  name: "PGI Hospital",               lat: 30.7650, lng: 76.7762, baseScore: 80 },
  { id: "p7",  name: "Rock Garden",                lat: 30.7525, lng: 76.8101, baseScore: 78 },
  { id: "p8",  name: "Sector 35 Market",           lat: 30.7253, lng: 76.7578, baseScore: 68 },
  { id: "p9",  name: "Panjab University Gate",     lat: 30.7595, lng: 76.7680, baseScore: 72 },
  { id: "p10", name: "Chandigarh Railway Station", lat: 30.6975, lng: 76.8034, baseScore: 50 },
  { id: "p11", name: "Sector 34 Market",           lat: 30.7210, lng: 76.7640, baseScore: 62 },
  { id: "p12", name: "Industrial Area Phase 1",    lat: 30.7060, lng: 76.8030, baseScore: 45 },
];

// Pre-classified seed comments (realistic, some Hinglish)
const SEED_COMMENTS = {
  p1: [
    { id: "c1a", text: "Bohot bheed hoti hai daytime mein, safe lagta hai", category: "safe", severity: 2, confidence: 0.9, summary: "Crowded in daytime, feels safe", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(2) },
    { id: "c1b", text: "Raat ko kuch ladke stare karte hain", category: "eve_teasing", severity: 3, confidence: 0.85, summary: "Boys stare at night", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(1) },
    { id: "c1c", text: "Police booth is right there, good for families", category: "safe", severity: 2, confidence: 0.92, summary: "Police booth nearby, family friendly", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(3) },
  ],
  p2: [
    { id: "c2a", text: "Mall ke andar bahut safe hai, CCTV everywhere", category: "safe", severity: 1, confidence: 0.95, summary: "Very safe inside mall, CCTV present", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(1) },
    { id: "c2b", text: "Parking area mein security guard hai", category: "safe", severity: 2, confidence: 0.88, summary: "Security guards in parking area", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(4) },
    { id: "c2c", text: "Late night closing ke baad thoda sketchy area", category: "unsafe_environment", severity: 2, confidence: 0.7, summary: "Sketchy area after late closing", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(2) },
  ],
  p3: [
    { id: "c3a", text: "Morning walk ke time bahut ache log hote hain", category: "safe", severity: 1, confidence: 0.9, summary: "Good crowd during morning walks", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(3) },
    { id: "c3b", text: "Shaam ko couples ke saath thik hai but alone nahi", category: "unsafe_environment", severity: 3, confidence: 0.75, summary: "Okay in evening with company, not alone", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(1) },
    { id: "c3c", text: "Ek banda follow kar raha tha mujhe last week", category: "stalking", severity: 4, confidence: 0.88, summary: "Someone followed me last week", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(5) },
  ],
  p4: [
    { id: "c4a", text: "Bus stand pe bahut gandagi aur shady log hain", category: "unsafe_environment", severity: 4, confidence: 0.9, summary: "Dirty and shady people at bus stand", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(1) },
    { id: "c4b", text: "Raat ko bilkul mat jana yahan", category: "unsafe_environment", severity: 5, confidence: 0.92, summary: "Do not go here at night", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(2) },
    { id: "c4c", text: "Auto wale bahut harass karte hain", category: "harassment", severity: 3, confidence: 0.85, summary: "Auto drivers harass passengers", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(4) },
  ],
  p5: [
    { id: "c5a", text: "Daytime mein theek hai, dukaan wale helpful hain", category: "safe", severity: 2, confidence: 0.85, summary: "Daytime fine, shopkeepers helpful", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(2) },
    { id: "c5b", text: "Street lights kharab hain ek side mein", category: "poor_lighting", severity: 3, confidence: 0.8, summary: "Street lights broken on one side", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(3) },
  ],
  p6: [
    { id: "c6a", text: "Hospital area safe hai, security guards hain", category: "safe", severity: 1, confidence: 0.93, summary: "Hospital area safe with security", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(1) },
    { id: "c6b", text: "Emergency ke bahar bhi thik hai raat ko", category: "safe", severity: 2, confidence: 0.8, summary: "Safe outside emergency at night too", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(3) },
    { id: "c6c", text: "Kabhi kabhi drunk log aate hain emergency mein", category: "unsafe_environment", severity: 2, confidence: 0.65, summary: "Sometimes drunk people at emergency", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(5) },
  ],
  p7: [
    { id: "c7a", text: "Tourist spot hai, bahut crowded aur safe", category: "safe", severity: 1, confidence: 0.92, summary: "Tourist spot, crowded and safe", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(2) },
    { id: "c7b", text: "Weekend pe families aati hain, no issues", category: "safe", severity: 1, confidence: 0.9, summary: "Families visit on weekends, no issues", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(4) },
  ],
  p8: [
    { id: "c8a", text: "Market mein chhota mota theft hota rehta hai", category: "theft", severity: 3, confidence: 0.82, summary: "Petty theft happens in market", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(1) },
    { id: "c8b", text: "Raat ko band hone ke baad avoid karo", category: "unsafe_environment", severity: 3, confidence: 0.78, summary: "Avoid after market closes at night", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(3) },
    { id: "c8c", text: "Chai wale uncle ke paas safe hai baitho", category: "safe", severity: 2, confidence: 0.75, summary: "Safe near the tea stall area", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(2) },
  ],
  p9: [
    { id: "c9a", text: "Campus ke andar toh bahut safe hai", category: "safe", severity: 1, confidence: 0.9, summary: "Very safe inside campus", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(2) },
    { id: "c9b", text: "Gate ke bahar raat ko eve teasing hoti hai", category: "eve_teasing", severity: 3, confidence: 0.85, summary: "Eve teasing outside gate at night", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(1) },
    { id: "c9c", text: "Street lights theek hain but corners dark hain", category: "poor_lighting", severity: 2, confidence: 0.72, summary: "Street lights okay but dark corners", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(4) },
  ],
  p10: [
    { id: "c10a", text: "Station pe bahut bheed aur pickpocketing hoti hai", category: "theft", severity: 4, confidence: 0.9, summary: "Crowded station with pickpocketing", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(1) },
    { id: "c10b", text: "Raat ki train se aana bahut risky hai alone", category: "unsafe_environment", severity: 5, confidence: 0.92, summary: "Risky arriving alone by night train", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(2) },
    { id: "c10c", text: "Platform 1 pe kuch log stare karte hain", category: "eve_teasing", severity: 3, confidence: 0.8, summary: "People stare on platform 1", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(3) },
  ],
  p11: [
    { id: "c11a", text: "Din mein theek hai lekin raat ko nahi", category: "unsafe_environment", severity: 3, confidence: 0.82, summary: "Fine by day, not at night", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(2) },
    { id: "c11b", text: "Kuch ladke bike pe chakkar lagaate hain", category: "stalking", severity: 3, confidence: 0.78, summary: "Boys circle around on bikes", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(3) },
  ],
  p12: [
    { id: "c12a", text: "Factories ke baad bahut veeran ho jaata hai", category: "unsafe_environment", severity: 4, confidence: 0.9, summary: "Very deserted after factory hours", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(1) },
    { id: "c12b", text: "Ladkiyon ko yahan akele nahi aana chahiye", category: "unsafe_environment", severity: 5, confidence: 0.88, summary: "Girls should not come here alone", mentionsPerson: false, timeOfDay: "night", createdAt: daysAgo(2) },
    { id: "c12c", text: "Din mein trucks hain lekin koi issue nahi", category: "safe", severity: 2, confidence: 0.7, summary: "Trucks during day but no issues", mentionsPerson: false, timeOfDay: "day", createdAt: daysAgo(3) },
  ],
};

function daysAgo(n) {
  return new Date(Date.now() - n * 86400000).toISOString();
}

// ─── Scoring ────────────────────────────────────────────────────────────────
const NEGATIVE_CATEGORIES = new Set([
  "harassment", "groping", "stalking", "eve_teasing",
  "unsafe_environment", "poor_lighting", "theft",
]);

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function scoreColor(score) {
  if (score >= 65) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

function commentImpact(c) {
  if (c.category === "spam" || c.confidence < 0.4) return 0;

  const ageMs = Date.now() - new Date(c.createdAt).getTime();
  const ageDays = ageMs / 86400000;
  const weight = ageDays > 7 ? 0.5 : 1;

  if (NEGATIVE_CATEGORIES.has(c.category)) {
    return -(c.severity * c.confidence * 4) * weight;
  }
  if (c.category === "safe") {
    return +(c.severity * c.confidence * 2) * weight;
  }
  return 0;
}

function rescorePlace(placeId) {
  const p = places[placeId];
  const pComments = comments[placeId] || [];
  const totalImpact = pComments.reduce((sum, c) => sum + commentImpact(c), 0);
  p.score = clamp(Math.round(p.baseScore + totalImpact), 0, 100);
  p.color = scoreColor(p.score);
}

function placePublic(p) {
  return {
    id: p.id, name: p.name, lat: p.lat, lng: p.lng,
    score: p.score, color: p.color,
    commentCount: (comments[p.id] || []).length,
  };
}

function commentPublic(c) {
  return {
    id: c.id, text: c.text, category: c.category,
    severity: c.severity, summary: c.summary,
    timeOfDay: c.timeOfDay || null, createdAt: c.createdAt,
  };
}

// ─── In-memory store ────────────────────────────────────────────────────────
const places = {};      // id -> place object
const comments = {};    // placeId -> [comment]
const users = {};       // userId -> {name}
const rateLimits = {};  // `${userId}:${placeId}` -> timestamp

// Initialize store from seed data
SEED_PLACES.forEach((p) => {
  places[p.id] = { ...p };
  comments[p.id] = [...(SEED_COMMENTS[p.id] || [])];
});

// Recompute all scores on startup
Object.keys(places).forEach((id) => rescorePlace(id));

// ─── AI classification ──────────────────────────────────────────────────────
async function classifyWithGemini(text) {
  if (!genAI) return null;
  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });
    const result = await model.generateContent(text);
    const raw = result.response.text();
    const parsed = JSON.parse(raw);
    if (!parsed.category || typeof parsed.severity !== "number" || typeof parsed.confidence !== "number") {
      throw new Error("Missing required fields in Gemini response");
    }
    const validCats = [
      "harassment", "groping", "stalking", "eve_teasing",
      "unsafe_environment", "poor_lighting", "theft", "safe", "spam"
    ];
    if (!validCats.includes(parsed.category)) {
      parsed.category = "unsafe_environment";
    }
    parsed.severity = clamp(Math.round(parsed.severity), 1, 5);
    parsed.confidence = clamp(parseFloat(parsed.confidence) || 0.8, 0.1, 1.0);
    return parsed;
  } catch (err) {
    console.error(`[Gemini] API error (${err.message}) -> using smart fallback`);
    return null;
  }
}

function classifyWithFallback(text) {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Genuine spam or gibberish check (only true junk)
  if (trimmed.length < 3) {
    return { category: "spam", severity: 1, confidence: 0.2, summary: "Too short", mentionsPerson: false };
  }
  if (/https?:\/\/|www\.|\.com|\.xyz|buy\s+now|free\s+money|crypto|casino|telegram|whatsapp\s+group/i.test(lower)) {
    return { category: "spam", severity: 1, confidence: 0.2, summary: "Promotional spam", mentionsPerson: false };
  }
  // Repeated character gibberish or keyboard smash (e.g. "aaaaa", "asdfghjk", "zxcvbn")
  if (/(.)\1{4,}/.test(lower) || /^[a-z]{1,2}$/i.test(trimmed) || /[b-df-hj-np-tv-z]{5,}/i.test(lower)) {
    return { category: "spam", severity: 1, confidence: 0.2, summary: "Gibberish text", mentionsPerson: false };
  }

  // 2. Negation checks (e.g. "not safe", "no lights", "never safe")
  if (/\b(no|not|never|un|isnt|isn't|aren't|barely)\s+(safe|secure|security|police|pcr|protection)\b/i.test(lower) ||
      /\b(safe\s+nahi|safe\s+nhi|safe\s+na\s+hai|surakshit\s+nahi)\b/i.test(lower)) {
    return {
      category: "unsafe_environment",
      severity: 4,
      confidence: 0.85,
      summary: "Reported not safe for women",
      mentionsPerson: false,
    };
  }

  if (/\b(no|not|poor|zero|broken|off)\s+(lights?|streetlights?|lighting|bulb|bulbs|lamp)\b/i.test(lower) ||
      /\b(light\s+nahi|light\s+nhi|andhera\s+hai|pitch\s+dark)\b/i.test(lower)) {
    return {
      category: "poor_lighting",
      severity: 3,
      confidence: 0.85,
      summary: "Poor or broken street lighting",
      mentionsPerson: false,
    };
  }

  // 3. Category dictionaries (English + Hindi + Hinglish + Punjabi)
  const categoryMatchers = [
    {
      cat: "groping",
      severity: 5,
      keywords: ["touch", "grope", "grab", "molest", "chhua", "chhuna", "haath lagana", "bad touch", "pakad", "dhakka", "physically"],
      summary: "Inappropriate physical touch or groping",
    },
    {
      cat: "stalking",
      severity: 4,
      keywords: ["follow", "stalk", "peecha", "peechhe", "chase", "chasing", "tracking", "scooter pe", "bike pe", "chakkar", "following me"],
      summary: "Suspicious following or stalking behavior",
    },
    {
      cat: "harassment",
      severity: 3,
      keywords: ["harass", "catcall", "stare", "ghoor", "taunt", "chhed", "chhedkhani", "comment pass", "passing comment", "pass comment", "creepy guys", "creepy men", "creepy boys", "roadside romeo", "gunde", "lafange", "abusive", "vulgar", "shouting at girls", "awkward"],
      summary: "Verbal harassment or staring",
    },
    {
      cat: "eve_teasing",
      severity: 3,
      keywords: ["tease", "seeti", "seethi", "whistle", "hoot", "wink", "eve teasing", "commenting on girls"],
      summary: "Eve teasing or catcalling reported",
    },
    {
      cat: "theft",
      severity: 4,
      keywords: ["theft", "steal", "snatch", "snatched", "chori", "chora", "loot", "pickpocket", "purse", "chain", "phone chheen", "rob", "robbery"],
      summary: "Theft or snatching incident reported",
    },
    {
      cat: "poor_lighting",
      severity: 3,
      keywords: ["dark", "andhera", "dim", "blackout", "pitch black", "bulb kharab", "streetlight", "lighting", "roshni"],
      summary: "Dark area with poor lighting",
    },
    {
      cat: "unsafe_environment",
      severity: 4,
      keywords: ["unsafe", "danger", "khatra", "risky", "sketchy", "shady", "drunk", "sharabi", "alcohol", "beer", "daaru", "drugs", "veeran", "deserted", "isolated", "empty", "sunsaan", "sunaan", "scary", "scared", "fear", "dar", "avoid", "don't go", "dont go", "mat jao", "worst", "horrible", "terrible", "uncomfortable", "suspicious", "threat"],
      summary: "Unsafe environment or suspicious crowd",
    },
    {
      cat: "safe",
      severity: 2,
      keywords: ["safe", "secure", "police", "pcr", "booth", "thana", "guard", "security", "cctv", "camera", "well lit", "well-lit", "crowd", "crowded", "bheed", "family", "families", "helpful", "good", "great", "nice", "fine", "peaceful", "clean", "open", "busy", "lively", "acha", "achha", "badiya", "badhiya", "shandar", "mast"],
      summary: "Safe environment with good presence",
    },
  ];

  for (const m of categoryMatchers) {
    if (m.keywords.some((kw) => lower.includes(kw))) {
      return {
        category: m.cat,
        severity: m.severity,
        confidence: 0.8,
        summary: m.summary,
        mentionsPerson: false,
      };
    }
  }

  // 4. General Sentiment Fallback (Never spam if it contains meaningful feedback)
  const negativeSentiment = ["bad", "dirty", "worst", "problem", "issue", "trouble", "hate", "run", "crying", "attack", "loud", "unfriendly", "poor"];
  if (negativeSentiment.some((w) => lower.includes(w))) {
    return {
      category: "unsafe_environment",
      severity: 3,
      confidence: 0.75,
      summary: "Negative safety concern reported",
      mentionsPerson: false,
    };
  }

  const positiveSentiment = ["ok", "okay", "decent", "better", "best", "love", "calm", "cool", "pleasant", "comfortable", "recommend", "normal"];
  if (positiveSentiment.some((w) => lower.includes(w))) {
    return {
      category: "safe",
      severity: 2,
      confidence: 0.75,
      summary: "Positive feedback on area safety",
      mentionsPerson: false,
    };
  }

  // 5. Default realistic user comment -> safe or mild caution
  return {
    category: "safe",
    severity: 1,
    confidence: 0.65,
    summary: "General area feedback",
    mentionsPerson: false,
  };
}

async function classifyComment(text) {
  const geminiResult = await classifyWithGemini(text);
  if (geminiResult) {
    console.log(`[classify] source: gemini | category: ${geminiResult.category} | severity: ${geminiResult.severity} | confidence: ${geminiResult.confidence} | summary: ${geminiResult.summary}`);
    return { ...geminiResult, source: "gemini" };
  }
  const fallbackResult = classifyWithFallback(text);
  console.log(`[classify] source: fallback | category: ${fallbackResult.category} | severity: ${fallbackResult.severity} | confidence: ${fallbackResult.confidence} | summary: ${fallbackResult.summary}`);
  return { ...fallbackResult, source: "fallback" };
}

// ─── REST API ───────────────────────────────────────────────────────────────

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

// Demo auth (no real auth)
app.post("/auth/demo", (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name is required" });
  const userId = "u_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  users[userId] = { name: name.trim() };
  res.json({ userId, name: name.trim() });
});

// List all places
app.get("/places", (_req, res) => {
  res.json(Object.values(places).map(placePublic));
});

// Search places
app.get("/places/search", (req, res) => {
  const q = (req.query.q || "").toLowerCase().trim();
  if (!q) return res.json(Object.values(places).map(placePublic));
  const results = Object.values(places).filter((p) => p.name.toLowerCase().includes(q));
  res.json(results.map(placePublic));
});

// Place detail
app.get("/places/:id", (req, res) => {
  const p = places[req.params.id];
  if (!p) return res.status(404).json({ error: "Place not found" });
  const pComments = (comments[p.id] || [])
    .map(commentPublic)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ ...placePublic(p), comments: pComments });
});

// Add comment
app.post("/places/:id/comments", async (req, res) => {
  const p = places[req.params.id];
  if (!p) return res.status(404).json({ error: "Place not found" });

  const { userId, text, timeOfDay } = req.body;
  if (!userId || !users[userId]) return res.status(400).json({ error: "Invalid userId" });
  if (!text || !text.trim()) return res.status(400).json({ error: "Comment text is required" });

  // Rate limit: 1 comment per user per place per 20 seconds
  const rlKey = `${userId}:${p.id}`;
  const lastPost = rateLimits[rlKey];
  if (lastPost && Date.now() - lastPost < 20000) {
    return res.status(429).json({ error: "Please wait a few seconds before posting again" });
  }

  // Classify
  const classification = await classifyComment(text.trim());
  const previousColor = p.color;

  // Store comment
  const comment = {
    id: "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
    text: text.trim(),
    category: classification.category,
    severity: classification.severity,
    confidence: classification.confidence,
    summary: classification.summary,
    mentionsPerson: classification.mentionsPerson,
    ignored: classification.category === "spam" || classification.confidence < 0.4,
    timeOfDay: timeOfDay || null,
    createdAt: new Date().toISOString(),
  };
  comments[p.id].push(comment);
  rateLimits[rlKey] = Date.now();

  // Rescore
  rescorePlace(p.id);

  console.log(`[score] ${p.name}: ${previousColor} -> ${p.color} (score ${p.score})`);

  // Socket.IO broadcast
  const socketPayload = {
    id: p.id, name: p.name, score: p.score, color: p.color, previousColor,
    latestComment: {
      text: comment.text, category: comment.category,
      severity: comment.severity, summary: comment.summary,
    },
  };
  io.emit("place:updated", socketPayload);

  res.json({ comment: commentPublic(comment), place: { id: p.id, score: p.score, color: p.color, previousColor } });
});

// ─── Socket.IO ──────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  console.log(`[socket] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`[socket] client disconnected: ${socket.id}`);
  });
});

// ─── Start server ───────────────────────────────────────────────────────────
function getLanIP() {
  const nets = os.networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const cfg of iface) {
      if (cfg.family === "IPv4" && !cfg.internal) return cfg.address;
    }
  }
  return "127.0.0.1";
}

server.listen(PORT, "0.0.0.0", () => {
  const lanIP = getLanIP();
  console.log(`\n🚶‍♀️ SafeWalk backend running`);
  console.log(`   Local:  http://localhost:${PORT}`);
  console.log(`   LAN:    http://${lanIP}:${PORT}`);
  console.log(`   Gemini: ${hasValidGeminiKey ? "enabled (" + GEMINI_MODEL + ")" : "smart fallback active (all comments classified)"}\n`);
});
