// import { Agent, run } from "@openai/agents";
// import { getTranscriptTool } from "./getTranscriptTool.js";
// import { segmentTool } from "./segmentTool.js";
// import { summariseTool } from "./summariseTool.js";
// import { assembleTool } from "./assembleTool.js";

// const chapterAgent = new Agent({
//   name: "YouTube Chapter Agent",
//   instructions:
//     "Convert a YouTube transcript into timestamped chapter titles and summaries.",
//   tools: [getTranscriptTool, segmentTool, summariseTool, assembleTool],
//   rateLimiter: {
//     maxTokensPerMinute: 25000   // 25 k leaves ~5 k headroom for retries
//   }
// });

// const { finalOutput } = await run(chapterAgent, "2TL3DgIMY1g")

// console.log("=== Markdown ===\n" + finalOutput.markdown);

//// filepath: /Users/fnuworsu/codespace/Projects/MetaU Capstone/YT-AI-AGENT/index.js
import { getTranscriptTool } from "./getTranscriptTool.js";
import { segmentTool } from "./segmentTool.js";
import { summariseTool } from "./summariseTool.js";
import { assembleTool } from "./assembleTool.js";

async function processVideoWithBatching(videoId) {
  try {
    // Directly get transcript (no run(...) wrapper)
    console.log("Getting transcript...");
    const transcriptResult = await getTranscriptTool.execute({ videoId });
    console.log("Transcript result:", transcriptResult);

    // If it's an array, keep it as an array
    const transcript = Array.isArray(transcriptResult)
      ? transcriptResult
      : transcriptResult.rows;
    console.log(`Got transcript with ${transcript.length} entries`);
    
    // Directly segment transcript
    console.log("Segmenting transcript...");
    const segmentResult = await segmentTool.execute({ rows: transcript });
    console.log("Segment result:", segmentResult);
    
    const chapters = Array.isArray(segmentResult)
      ? segmentResult
      : segmentResult.chapters;
    console.log(`Created ${chapters.length} chapters`);

    // Process chapters in batches
    const batchSize = 3;
    const processedChapters = [];
    
    for (let i = 0; i < chapters.length; i += batchSize) {
      const batch = chapters.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chapters.length / batchSize)}`);
      
      for (let j = 0; j < batch.length; j++) {
        try {
          // Summarize each chapter directly
          const { title, summary } = await summariseTool.execute({ chapter: batch[j] });
          processedChapters.push({ ...batch[j], title, summary });
        } catch (error) {
          console.error("SummarizeTool error:", error);
          processedChapters.push({
            ...batch[j],
            title: "Untitled Section",
            summary: "No summary available."
          });
        }
      }
      
      if (i + batchSize < chapters.length) {
        console.log("Waiting 30 seconds before processing next batch...");
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    // Assemble final output
    console.log("Assembling final output...");
    const finalOutput = await assembleTool.execute({ chapters: processedChapters });
    return finalOutput;
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
}

// Run
const videoId = "2TL3DgIMY1g";
processVideoWithBatching(videoId)
  .then(({ markdown }) => {
    console.log("=== Markdown ===");
    console.log(markdown);
  })
  .catch(error => {
    console.error("Failed to process video:", error);
  });