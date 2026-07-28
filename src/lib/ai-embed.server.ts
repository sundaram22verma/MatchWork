// Server-only helper: generate embedding vector using free Hugging Face models.
// Supports both Hugging Face Inference API and local @xenova/transformers execution.

const TARGET_DIMENSION = 1536;

function padToTargetDimension(vec: number[], targetDim = TARGET_DIMENSION): number[] {
  if (vec.length >= targetDim) return vec.slice(0, targetDim);
  // Pad with 0s to match pgvector vector(1536) while preserving exact cosine similarity math
  return [...vec, ...new Array(targetDim - vec.length).fill(0)];
}

export async function embedText(text: string): Promise<number[]> {
  const cleaned = text.trim().slice(0, 8000);
  if (!cleaned) return new Array(TARGET_DIMENSION).fill(0);

  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const modelName = process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";

  // Strategy 1: Hugging Face Inference API (if HF_TOKEN or HUGGINGFACE_API_KEY is provided)
  if (hfToken) {
    try {
      const res = await fetch(
        `https://api-inference.huggingface.co/pipeline/feature-extraction/${modelName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${hfToken}`,
          },
          body: JSON.stringify({ inputs: cleaned }),
        },
      );
      if (res.ok) {
        const json = await res.json();
        const vec = Array.isArray(json[0]) ? json[0] : json;
        if (Array.isArray(vec) && typeof vec[0] === "number") {
          return padToTargetDimension(vec);
        }
      }
    } catch (err) {
      console.warn("Hugging Face API call failed, falling back to local model:", err);
    }
  }

  // Strategy 2: Local Hugging Face model via @xenova/transformers (Free, 0 API key required)
  try {
    const { pipeline } = await import("@xenova/transformers");
    const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      quantized: true,
    });
    const output = await extractor(cleaned, { pooling: "mean", normalize: true });
    const vec = Array.from(output.data as Float32Array);
    return padToTargetDimension(vec);
  } catch (err) {
    console.error("Local Hugging Face embedding extraction failed:", err);
    throw new Error(`Failed to generate Hugging Face embedding: ${(err as Error).message}`);
  }
}
