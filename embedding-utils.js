import OpenAI from "openai";
import dotenv from "dotenv"

dotenv.config()
const openai = new OpenAI(
    {
        apiKey : process.env.OPENAI_API_KEY
    }
);

/* Get 1536-dim vector from the embeddings endpoint */
export async function embed(text) {
  const { data } = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  return data[0].embedding;
}

export function cosine(a, b) {
  let dot = 0,
    al2 = 0,
    bl2 = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    al2 += a[i] ** 2;
    bl2 += b[i] ** 2;
  }
  return dot / (Math.sqrt(al2) * Math.sqrt(bl2) + 1e-8);
}
