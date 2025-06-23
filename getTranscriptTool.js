import TranscriptClient from "youtube-transcript-api";
import { tool } from "@openai/agents";

const yt = new TranscriptClient();

/* turn nested {language, transcript:[{language, transcript:[…]}]}…
   into flat [{text,start,duration}] */
function flatten(raw) {
  const rows = [];
  if (raw && Array.isArray(raw.tracks)) {
    raw.tracks.forEach(track =>
      track?.transcript?.forEach(seg => {
        if (seg?.text && seg?.start != null && seg?.dur != null) {
          rows.push({ text: seg.text, start: +seg.start, duration: +seg.dur });
        }
      })
    );
  }
  rows.sort((a, b) => a.start - b.start);
//   console.log(rows)
  return rows;
}

export const getTranscriptTool = tool({
  name: "getTranscript",
  description: "Return a flat array of {text,start,duration} rows",
  parameters: {
    type: "object",
    additionalProperties: false, 
    properties: { videoId: { type: "string" } },
    required: ["videoId"]
  },
  execute: async ({ videoId }) => {
    await yt.ready;
    const raw = await yt.getTranscript(videoId);
    if (!raw) throw new Error("No transcript data.");
    return flatten(raw);
  }
});
