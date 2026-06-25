import "dotenv/config";
import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseBuffer } from "music-metadata";
import { ai } from "./libs/googleGenAi.js";

// ESM __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Multer config — store file in memory buffer
const upload = multer({ storage: multer.memoryStorage() });

// Paths
const DATASET_DIR = path.join(__dirname, "dataset");
const CLIPS_DIR = path.join(DATASET_DIR, "clips");
const CSV_PATH = path.join(DATASET_DIR, "metadata.csv");

// CSV header
const CSV_HEADER =
  "clip_id,audio_path,source_language,target_language,source_prompt,audio_transcription,speaker_id,duration_seconds,submitted_at,gender,age,user_mother_tongue,tone,fluency,pronunciation,completeness,accuracy,overall_score";

// Ensure dataset directories exist
if (!fs.existsSync(DATASET_DIR)) fs.mkdirSync(DATASET_DIR, { recursive: true });
if (!fs.existsSync(CLIPS_DIR)) fs.mkdirSync(CLIPS_DIR, { recursive: true });

// Ensure CSV exists with header
if (!fs.existsSync(CSV_PATH)) {
  fs.writeFileSync(CSV_PATH, CSV_HEADER + "\n", "utf-8");
}

// Helper: escape a CSV field (wrap in quotes if it contains comma, quote, or newline)
function escapeCsvField(value) {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Helper: get file extension from mimetype
function getExtensionFromMime(mimetype) {
  const map = {
    "audio/webm": ".webm",
    "audio/mp3": ".mp3",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".mp4",
    "audio/x-m4a": ".m4a",
    "audio/flac": ".flac",
  };
  return map[mimetype] || ".webm";
}

// ──────────────────────────────────────────────
// POST /api/evaluate
// ──────────────────────────────────────────────
app.post("/api/evaluate", upload.single("audio"), async (req, res) => {
  try {
    // ── 1. Validate audio file ──
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    // ── 2. Validate required metadata fields ──
    const requiredFields = [
      "source_language",
      "target_language",
      "source_prompt",
      "speaker_id",
      "gender",
      "age",
      "user_mother_tongue",
      "tone",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    const {
      source_language,
      target_language,
      source_prompt,
      speaker_id,
      gender,
      age,
      user_mother_tongue,
      tone,
    } = req.body;

    // console.log("Audio received : " + JSON.stringify(req.file));
    // console.log("Body received : " + JSON.stringify(req.body));

    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    // ── 3. Generate clip_id and file extension ──
    const shortId = uuidv4().replace(/-/g, "").slice(0, 8);
    const clip_id = `clip_${shortId}`;
    const ext = getExtensionFromMime(mimeType);
    const audioFileName = `${clip_id}${ext}`;
    const audioFilePath = path.join(CLIPS_DIR, audioFileName);
    const audioRelPath = `clips/${audioFileName}`;

    // ── 4. Send audio to Gemini for evaluation ──
    const base64Audio = audioBuffer.toString("base64");

    const systemPrompt = `You are a strict speech and translation evaluator. The user was given a phrase in ${source_language} and asked to translate and speak it aloud in ${target_language}. The expected tone is: ${tone}. The original phrase was: '${source_prompt}'.

Listen to the audio and evaluate the speaker. Be STRICT with your scoring, especially for fluency, pronunciation, and completeness. If the speaker is NOT speaking in ${target_language} (e.g., they speak in ${source_language} or any other language instead of ${target_language}), you MUST give very low scores (below 20) for fluency, pronunciation, completeness, and accuracy — the language must match the target language.

Return ONLY a valid JSON object with no markdown, no explanation, and no extra text. The JSON must contain exactly these fields:
- transcription: string (what the speaker said)
- fluency: number from 0 to 100 (how smoothly and naturally the speaker delivers the phrase in ${target_language}; score near 0 if not in ${target_language})
- pronunciation: number from 0 to 100 (how correctly the speaker pronounces words in ${target_language}; score near 0 if not in ${target_language})
- completeness: number from 0 to 100 (how completely the speaker conveyed the full meaning of the original phrase; score near 0 if not in ${target_language})
- accuracy: number from 0 to 100 (how accurately the spoken content translates the original phrase into ${target_language}; score near 0 if wrong language)
- overall_score: number from 0 to 100 (weighted average of all scores)
- feedback: string (one sentence of constructive feedback for the speaker)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
          ],
        },
      ],
    });

    const rawText = response.text.trim();

    // ── 5. Parse Gemini response as JSON ──
    let evaluation;
    try {
      // Strip markdown code fences if present
      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      evaluation = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse Gemini response:", rawText);
      return res.status(500).json({ error: "Failed to parse Gemini response" });
    }

    // ── 6. Calculate audio duration ──
    let durationSeconds = 0;
    try {
      const metadata = await parseBuffer(audioBuffer, { mimeType });
      durationSeconds = metadata.format.duration
        ? parseFloat(metadata.format.duration.toFixed(2))
        : 0;
    } catch (err) {
      console.warn("Could not parse audio duration:", err.message);
    }

    // ── 7. Filter noisy data (accuracy < 50) ──
    const transcription = evaluation.transcription || "";
    const accuracy = evaluation.accuracy ?? 0;

    if (accuracy < 50) {
      console.log(`Skipping clip ${clip_id} — accuracy ${accuracy} is below threshold (50)`);
      return res.json({
        clip_id,
        skipped: true,
        reason: "Accuracy below 50 — not saved to dataset",
        transcription: evaluation.transcription,
        fluency: evaluation.fluency,
        pronunciation: evaluation.pronunciation,
        completeness: evaluation.completeness,
        accuracy: evaluation.accuracy,
        overall_score: evaluation.overall_score,
        feedback: evaluation.feedback,
      });
    }

    // ── 8. Save audio file to disk ──
    fs.writeFileSync(audioFilePath, audioBuffer);

    // ── 9. Append row to CSV ──
    const submittedAt = new Date().toISOString();

    const row = [
      clip_id,
      audioRelPath,
      source_language,
      target_language,
      source_prompt,
      transcription,
      speaker_id,
      durationSeconds,
      submittedAt,
      gender,
      age,
      user_mother_tongue,
      tone,
      evaluation.fluency,
      evaluation.pronunciation,
      evaluation.completeness,
      evaluation.accuracy,
      evaluation.overall_score,
    ]
      .map(escapeCsvField)
      .join(",");

    fs.appendFileSync(CSV_PATH, row + "\n", "utf-8");

    // ── 10. Return evaluation to client ──
    return res.json({
      clip_id,
      transcription: evaluation.transcription,
      fluency: evaluation.fluency,
      pronunciation: evaluation.pronunciation,
      completeness: evaluation.completeness,
      accuracy: evaluation.accuracy,
      overall_score: evaluation.overall_score,
      feedback: evaluation.feedback,
    });
  } catch (error) {
    console.error("Unexpected error in /api/evaluate:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`Sirene API running on http://localhost:${process.env.PORT}`);
});
