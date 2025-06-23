import { tool } from "@openai/agents";

function hhmmss(sec) {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
}

export const assembleTool = tool({
  name: "assembleChapters",
  isFinal : true,
  description: "Return Markdown + JSON for YouTube chapters",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      chapters: {
        type: "array",
        additionalProperties: false,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            start: { type: "number" },
            end: { type: "number" },
            title: { type: "string" },
            summary: { type: "string" }
          },
          required: ["start", "end", "title", "summary"]
        }
      }
    },
    required: ["chapters"]
  },
  execute: ({ chapters }) => {
    const md = chapters
      .map(ch => `${hhmmss(ch.start)} ${ch.title}`)
      .join("\n");
    return { markdown: md, json: chapters };
  }
});
