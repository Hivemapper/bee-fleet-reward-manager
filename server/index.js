import express from "express";
import cors from "cors";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const SETTINGS_FILE = join(DATA_DIR, "settings.json");
const BEE_API_BASE = "https://api.trybeekeeper.ai/v1";

const app = express();
app.use(cors());
app.use(express.json());

// --- Settings persistence ---

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSettings() {
  ensureDataDir();
  if (existsSync(SETTINGS_FILE)) {
    return JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
  }
  return {};
}

function saveSettings(settings) {
  ensureDataDir();
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

function getApiKey() {
  const settings = loadSettings();
  return settings.apiKey || process.env.BEE_API_KEY || "";
}

// --- Settings endpoints ---

app.get("/api/settings", (_req, res) => {
  const key = getApiKey();
  res.json({
    hasApiKey: Boolean(key),
    // Show last 4 chars so user can verify which key is active
    apiKeyHint: key ? `...${key.slice(-4)}` : "",
  });
});

app.post("/api/settings", (req, res) => {
  const { apiKey } = req.body;
  if (!apiKey || typeof apiKey !== "string") {
    return res.status(400).json({ error: "apiKey is required" });
  }
  const settings = loadSettings();
  settings.apiKey = apiKey.trim();
  saveSettings(settings);
  res.json({ ok: true });
});

// --- Proxy helpers ---

async function proxyGet(url, res) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return res
      .status(401)
      .json({ error: "API key not configured. Go to Settings to add it." });
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      console.error(`Non-JSON response from ${url}: ${response.status} ${contentType}`);
      return res.status(502).json({ error: "Bee Maps API returned an unexpected response" });
    }
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    res.json(data);
  } catch (err) {
    console.error(`Proxy error for ${url}:`, err.message);
    res.status(502).json({ error: "Failed to reach Bee Maps API" });
  }
}

// --- Reverse geocoding with cache ---

const geocodeCache = new Map();

async function reverseGeocode(lat, lon) {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
    const response = await fetch(url, {
      headers: { "User-Agent": "BeeFleetRewards/1.0" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const addr = data.address || {};
    const city =
      addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";
    const country = addr.country_code?.toUpperCase() || "";
    const result = { city, state, country };
    geocodeCache.set(key, result);
    return result;
  } catch {
    return null;
  }
}

// --- API proxy endpoints ---

app.get("/api/devices", (_req, res) => {
  proxyGet(`${BEE_API_BASE}/devices`, res);
});

app.get("/api/location", async (req, res) => {
  const { deviceId } = req.query;
  if (!deviceId) {
    return res.status(400).json({ error: "deviceId query param required" });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return res
      .status(401)
      .json({ error: "API key not configured. Go to Settings to add it." });
  }

  try {
    const response = await fetch(
      `${BEE_API_BASE}/location?deviceId=${deviceId}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Reverse geocode if we have coordinates
    if (data.lat != null && data.lon != null) {
      const geo = await reverseGeocode(data.lat, data.lon);
      if (geo) {
        data.city = geo.city;
        data.state = geo.state;
        data.country = geo.country;
      }
    }

    res.json(data);
  } catch (err) {
    console.error("Location proxy error:", err.message);
    res.status(502).json({ error: "Failed to reach Bee Maps API" });
  }
});

app.get("/api/rewards", (req, res) => {
  const { rewardPeriod } = req.query;
  if (!rewardPeriod) {
    return res.status(400).json({ error: "rewardPeriod query param required" });
  }
  proxyGet(
    `${BEE_API_BASE}/hivemapperRewards?rewardPeriod=${rewardPeriod}`,
    res
  );
});

// --- Start ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
  const key = getApiKey();
  if (!key) {
    console.log(
      "[server] No API key configured yet. Add one via the Settings page."
    );
  }
});
