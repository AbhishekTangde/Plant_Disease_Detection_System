/**
 * plantDetection.js
 * ─────────────────────────────────────────────────────────────────
 * High-accuracy plant disease detection engine.
 *
 * Strategy (in order of priority):
 *  1. Kindwise Plant Health API  → real ML model, very high accuracy
 *  2. Google Cloud Vision Labels → general ML, good for broad ID
 *  3. Local feature engine       → always works offline
 *
 * Usage (from App.jsx):
 *   import { analyzePlantDisease } from "./plantDetection";
 *   const result = await analyzePlantDisease(imageDataURL, cropHint, localAnalyzeFn);
 *
 * `localAnalyzeFn` is the existing analyzeDisease function so we keep
 * all the rich localised multilingual disease data when falling back.
 * ─────────────────────────────────────────────────────────────────
 */

// ── API Keys (demo / free-tier keys — replace with your own) ──────────────────
// Kindwise Plant Health: https://plant.id  (free tier: 100 req/day)
const PLANT_ID_API_KEY = ""; // Set your Plant.id key here — leave empty to skip
// Google Vision: https://console.cloud.google.com/apis/library/vision.googleapis.com
const GOOGLE_VISION_KEY = ""; // Set your Google Vision key here — leave empty to skip
// Hugging Face Inference API (Open Source models)
const HUGGINGFACE_API_KEY = ""; // Optional: HuggingFace access token for higher rate limits
const HF_MODEL = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification";

// ── Constants ─────────────────────────────────────────────────────────────────
const RESIZE_TARGET   = 224;
const BRIGHTNESS_TGT  = 130;
const CONTRAST_FACTOR = 1.25;

// ── Keyword → local DB id map ──────────────────────────────────────────────────
// Maps strings that appear in Plant.id / Vision API responses to disease IDs.
const KEYWORD_MAP = [
  // Tomato
  { keys: ["early blight", "alternaria solani", "alternaria"],          plant: "Tomato",  id: "t_eb"       },
  { keys: ["late blight", "phytophthora infestans"],                    plant: "Tomato",  id: "t_lb"       },
  { keys: ["leaf mold", "fulvia fulva", "passalora fulva"],             plant: "Tomato",  id: "t_lm"       },
  { keys: ["bacterial spot", "xanthomonas"],                            plant: "Tomato",  id: "t_bs"       },
  { keys: ["mosaic virus", "tomato mosaic", "tobamovirus"],             plant: "Tomato",  id: "t_mv"       },
  { keys: ["yellow leaf curl", "tylcv", "begomovirus"],                 plant: "Tomato",  id: "t_ylcv"     },
  { keys: ["septoria", "septoria leaf spot"],                           plant: "Tomato",  id: "t_sl"       },
  { keys: ["spider mite", "tetranychus"],                               plant: "Tomato",  id: "t_sm"       },
  { keys: ["healthy tomato", "tomato healthy"],                         plant: "Tomato",  id: "t_healthy"  },
  // Potato
  { keys: ["potato early blight"],                                      plant: "Potato",  id: "p_eb"       },
  { keys: ["potato late blight", "potato phytophthora"],                plant: "Potato",  id: "p_lb"       },
  { keys: ["healthy potato", "potato healthy"],                         plant: "Potato",  id: "p_healthy"  },
  // Wheat
  { keys: ["leaf rust", "puccinia triticina", "wheat rust"],            plant: "Wheat",   id: "w_lr"       },
  { keys: ["yellow stripe rust", "stripe rust", "puccinia striiformis"],plant: "Wheat",   id: "w_yr"       },
  { keys: ["powdery mildew wheat", "blumeria graminis"],                plant: "Wheat",   id: "w_pm"       },
  { keys: ["loose smut", "ustilago tritici"],                           plant: "Wheat",   id: "w_ls"       },
  { keys: ["healthy wheat", "wheat healthy"],                           plant: "Wheat",   id: "w_healthy"  },
  // Rice
  { keys: ["rice blast", "magnaporthe oryzae", "pyricularia"],          plant: "Rice",    id: "r_rb"       },
  { keys: ["brown spot", "helminthosporium oryzae"],                    plant: "Rice",    id: "r_bs"       },
  { keys: ["bacterial leaf blight", "xanthomonas oryzae"],             plant: "Rice",    id: "r_blb"      },
  { keys: ["healthy rice", "rice healthy"],                             plant: "Rice",    id: "r_healthy"  },
  // Corn / Maize
  { keys: ["corn grey leaf spot", "gray leaf spot", "cercospora"],      plant: "Corn",    id: "c_gls"      },
  { keys: ["common rust", "corn rust", "puccinia sorghi"],              plant: "Corn",    id: "c_cr"       },
  { keys: ["northern corn leaf blight", "turcicum"],                   plant: "Corn",    id: "c_nclb"     },
  { keys: ["healthy corn", "corn healthy", "maize healthy"],            plant: "Corn",    id: "c_healthy"  },
];

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * High-accuracy plant disease analyzer.
 *
 * @param {string}   dataURL          - base64 image data URL
 * @param {string}   cropHint         - optional crop name (e.g. "Tomato")
 * @param {Function} localAnalyzeFn   - fallback: existing analyzeDisease(dataURL, cropHint)
 * @returns {Promise<Object>}         - disease result object compatible with App.jsx state
 */
export async function analyzePlantDisease(dataURL, cropHint, localAnalyzeFn) {
  // 1. Preprocess image for all engines
  const processedB64 = await preprocessToBase64(dataURL);

  // 2. Try Plant.id API first (most accurate commercial)
  if (PLANT_ID_API_KEY) {
    try {
      const r = await callPlantIdAPI(processedB64);
      if (r) return r;
    } catch (e) {
      console.warn("[PlantDetection] Plant.id API failed:", e.message);
    }
  }

  // 3. Try Hugging Face Open Source API
  try {
    const r = await callHuggingFaceAPI(processedB64, cropHint);
    if (r) return r;
  } catch (e) {
    console.warn("[PlantDetection] Hugging Face API failed:", e.message);
  }

  // 4. Try Google Vision API
  if (GOOGLE_VISION_KEY) {
    try {
      const r = await callGoogleVisionAPI(processedB64, cropHint, localAnalyzeFn);
      if (r) return r;
    } catch (e) {
      console.warn("[PlantDetection] Google Vision API failed:", e.message);
    }
  }

  // 5. Fallback — local feature engine (always works)
  return localAnalyzeFn(dataURL, cropHint);
}

// ─── Plant.id API ─────────────────────────────────────────────────────────────

async function callPlantIdAPI(base64) {
  // Remove data URL prefix
  const imageBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  const body = {
    images: [imageBase64],
    latitude: 20.5,
    longitude: 78.9,
    similar_images: false,
    health: "all",
  };

  const res = await fetch("https://api.plant.id/v3/health_assessment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Api-Key": PLANT_ID_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Plant.id API returned " + res.status);
  }

  const data = await res.json();

  // Extract top disease suggestion
  const healthAssessment = data.result?.disease;
  if (!healthAssessment) return null;

  const suggestions = healthAssessment.suggestions || [];
  const isHealthy = data.result?.is_healthy?.binary === true;

  if (isHealthy || suggestions.length === 0) {
    // Plant is healthy — try to map by plant name
    const plantName = (data.result?.classification?.suggestions?.[0]?.name || "").toLowerCase();
    return resolveByKeyword(`healthy ${plantName}`, 99);
  }

  // Sort by probability
  suggestions.sort((a, b) => (b.probability || 0) - (a.probability || 0));
  const top = suggestions[0];
  const probability = Math.round((top.probability || 0.9) * 100);

  // Try to map to local DB
  const diseaseStr = (top.name || "").toLowerCase();
  const resolved = resolveByKeyword(diseaseStr, probability);
  if (resolved) return resolved;

  // Could not map — return raw data enriched with local fallback
  return null;
}

// ─── Hugging Face Open Source API ─────────────────────────────────────────────

async function callHuggingFaceAPI(base64, cropHint) {
  const blob = await fetch(base64).then(r => r.blob());
  const headers = {};
  if (HUGGINGFACE_API_KEY) {
    headers["Authorization"] = `Bearer ${HUGGINGFACE_API_KEY}`;
  }

  const res = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
    method: "POST",
    headers,
    body: blob,
  });

  if (!res.ok) {
    throw new Error("Hugging Face API returned " + res.status);
  }

  const data = await res.json();
  
  // Wait if model is currently loading (Hugging Face API behavior)
  if (data.error && data.estimated_time) {
     throw new Error(`Model loading, estimated time: ${data.estimated_time}s`);
  }

  if (!Array.isArray(data) || data.length === 0) return null;

  // Filter and sort by score
  data.sort((a, b) => b.score - a.score);
  const top = data[0];
  const probability = Math.round((top.score || 0.9) * 100);

  // Map label to local DB keyword map
  // E.g., "Tomato___Early_blight" -> "tomato   early blight"
  const diseaseStr = (top.label || "").toLowerCase().replace(/_/g, " ");
  const resolved = resolveByKeyword(diseaseStr, probability);
  
  if (resolved) {
    if (!cropHint || resolved.plant.toLowerCase() === cropHint.toLowerCase()) {
      return resolved;
    }
  }

  return null;
}

// ─── Google Vision API ────────────────────────────────────────────────────────

async function callGoogleVisionAPI(base64, cropHint, localAnalyzeFn) {
  const imageBase64 = base64.replace(/^data:image\/\w+;base64,/, "");

  const body = {
    requests: [{
      image: { content: imageBase64 },
      features: [
        { type: "LABEL_DETECTION", maxResults: 15 },
        { type: "WEB_DETECTION",   maxResults: 10 },
      ],
    }],
  };

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_KEY}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );

  if (!res.ok) throw new Error("Vision API returned " + res.status);
  const data = await res.json();
  const response = data.responses?.[0];

  const labels = [
    ...(response?.labelAnnotations || []).map(l => l.description.toLowerCase()),
    ...(response?.webDetection?.webEntities || []).map(e => e.description?.toLowerCase() || ""),
  ];

  // Try each label against keyword map
  for (const label of labels) {
    const resolved = resolveByKeyword(label, 85);
    if (resolved) {
      // If crop hint supplied, verify plant matches
      if (!cropHint || resolved.plant.toLowerCase() === cropHint.toLowerCase()) {
        return resolved;
      }
    }
  }

  return null;
}

// ─── Keyword → DB resolution ──────────────────────────────────────────────────

/**
 * Match a string against KEYWORD_MAP and return a result object stub.
 * The actual full data will be merged from the existing local DB in App.jsx.
 */
function resolveByKeyword(str, confidence) {
  str = str.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    if (entry.keys.some(k => str.includes(k))) {
      return {
        _apiResolvedId: entry.id,
        _apiConfidence: confidence,
        _apiPlant: entry.plant,
      };
    }
  }
  return null;
}

// ─── Image Preprocessing ──────────────────────────────────────────────────────

async function preprocessToBase64(dataURL) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = RESIZE_TARGET;
        canvas.height = RESIZE_TARGET;
        const ctx = canvas.getContext("2d");

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, RESIZE_TARGET, RESIZE_TARGET);

        // Letterbox resize
        const scale = Math.min(RESIZE_TARGET / img.width, RESIZE_TARGET / img.height);
        const sw = img.width * scale;
        const sh = img.height * scale;
        ctx.drawImage(img, (RESIZE_TARGET - sw) / 2, (RESIZE_TARGET - sh) / 2, sw, sh);

        let id = ctx.getImageData(0, 0, RESIZE_TARGET, RESIZE_TARGET);
        id = normaliseBrightness(id);
        id = adjustContrast(id);
        id = sharpen(id);
        id = sharpen(id);
        ctx.putImageData(id, 0, 0);

        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = dataURL;
  });
}

function normaliseBrightness(imageData) {
  const d = imageData.data;
  let sum = 0;
  const px = d.length / 4;
  for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
  const delta = BRIGHTNESS_TGT - sum / px;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp(d[i] + delta);
    d[i + 1] = clamp(d[i + 1] + delta);
    d[i + 2] = clamp(d[i + 2] + delta);
  }
  return imageData;
}

function adjustContrast(imageData) {
  const d = imageData.data;
  const m = 128;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = clamp((d[i] - m) * CONTRAST_FACTOR + m);
    d[i + 1] = clamp((d[i + 1] - m) * CONTRAST_FACTOR + m);
    d[i + 2] = clamp((d[i + 2] - m) * CONTRAST_FACTOR + m);
  }
  return imageData;
}

function sharpen(imageData) {
  const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  const { data: src, width: w, height: h } = imageData;
  const out = new Uint8ClampedArray(src.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) for (let kx = -1; kx <= 1; kx++) {
        const idx = (Math.min(h - 1, Math.max(0, y + ky)) * w + Math.min(w - 1, Math.max(0, x + kx))) * 4;
        const ki = k[(ky + 1) * 3 + (kx + 1)];
        r += src[idx] * ki; g += src[idx + 1] * ki; b += src[idx + 2] * ki;
      }
      const i = (y * w + x) * 4;
      out[i] = clamp(r); out[i + 1] = clamp(g); out[i + 2] = clamp(b); out[i + 3] = src[i + 3];
    }
  }
  return new ImageData(out, w, h);
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
