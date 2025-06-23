import { tool } from "@openai/agents";
import OpenAI from "openai"; 
import dotenv from "dotenv"                   // SDK v4+

dotenv.config()
const openai = new OpenAI({
    apiKey : process.env.OPENAI_API_KEY
});

export const summariseTool = tool({
  name: "summariseChapter",
  description: "Return {title,summary} for a chapter",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      chapter: {
        type: "object",
        additionalProperties: false,
        properties: {
          start: { type: "number" },
          end: { type: "number" },
          text: { type: "string" }
        },
        required: ["start", "end", "text"]
      }
    },
    required: ["chapter"]
  },
  execute: async ({ chapter }) => {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens : 1500,
      json_mode: true,
      messages: [
        { role: "system", content: "Write a ≤8-word title and 2-sentence summary." },
        { role: "user", content: chapter.text }
      ],
      functions: [
        {
          name: "setChapter",
          description: "Return title & summary",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" }
            },
            required: ["title", "summary"]
          }
        }
      ],
      function_call: { name: "setChapter" }
    });
    return JSON.parse(resp.choices[0].message.function_call.arguments);
  }
});
