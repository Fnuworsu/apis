import { tool } from "@openai/agents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";      // chunk helper :contentReference[oaicite:2]{index=2}
import { embed, cosine } from "./embedding-utils.js";

/* Heuristic: break when similarity to previous chunk < 0.78 */
export const segmentTool = tool({
  name: "segmentTranscript",
  description: "Merge rows and split into topical chapters",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      rows: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
            start: { type: "number" },
            duration: { type: "number" }
          },
          required: ["text", "start", "duration"]
        }
      }
    },
    required: ["rows"]
  },
  execute: async ({ rows }) => {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 50
    });
    const docs = await splitter.createDocuments(rows.map(r => r.text));

    const chapters = [];
    let current = { start: rows[0].start, text: "" };
    let prevEmb = await embed(docs[0].pageContent);

    for (let i = 0; i < docs.length; i++) {
      const emb = i === 0 ? prevEmb : await embed(docs[i].pageContent);
      if (cosine(prevEmb, emb) < 0.78 && current.text) {
        chapters.push(current);
        current = { start: rows[i * 10]?.start ?? 0, text: "" };
      }
      current.text += " " + docs[i].pageContent;
      prevEmb = emb;
    }
    chapters.push(current);

    return chapters.map((c, i) => ({
      start: c.start,
      end:
        chapters[i + 1]?.start ??
        rows.at(-1).start + rows.at(-1).duration,
      text: c.text.trim()
    }));
  }
});
