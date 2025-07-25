import { genAI } from "../config/gemini";

export interface AIAssistanceRequest {
  type: "enhance" | "summarize" | "generateTags" | "generateContent";
  content?: string;
  prompt?: string;
  context?: string;
}

export interface AIAssistanceResponse {
  result: string;
  suggestions?: string[];
  appName?: string;
}

export async function getAIAssistance(
  request: AIAssistanceRequest
): Promise<AIAssistanceResponse> {
  try {
    let prompt = "";

    switch (request.type) {
      case "enhance":
        prompt = `Please enhance and improve the following text while maintaining its core meaning and intent. Make it more clear, concise, and well-structured:

"${request.content}"

Return only the enhanced version without any additional explanation.`;
        break;

      case "summarize":
        prompt = `Please create a concise summary of the following content in one or two sentences:

"${request.content}"

Return only the summary without any additional explanation.`;
        break;

      case "generateTags":
        prompt = `Based on the following content, suggest 3-5 relevant tags that would help categorize and search for this information. Tags should be lowercase, single words or short phrases:

"${request.content}"

Return only the tags separated by commas, without any additional explanation.`;
        break;

      case "generateContent":
        prompt = `Please generate useful content based on the following prompt or topic:

"${request.prompt}"

${request.context ? `Additional context: ${request.context}` : ""}

Return only the generated content without any additional explanation.`;
        break;

      default:
        throw new Error(`Unsupported AI assistance type: ${request.type}`);
    }

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    if (!text) {
      throw new Error("AI service returned empty response");
    }

    // For tag generation, parse the response into an array
    if (request.type === "generateTags") {
      const tags = text
        .split(",")
        .map((tag: string) => tag.trim().toLowerCase())
        .filter((tag: string) => tag.length > 0);
      return {
        result: text,
        suggestions: tags,
        appName: "Gemini",
      };
    }

    return {
      result: text.trim(),
      appName: "Gemini",
    };
  } catch (error) {
    console.error("Error in AI assistance:", error);
    throw new Error("Failed to get AI assistance");
  }
}

/**
 * Convert plain text content to well-formatted markdown
 */
export const convertToMarkdown = async (content: string): Promise<string> => {
  try {
    const prompt = `Please convert the following plain text content into well-formatted Markdown. 

IMPORTANT: 
- Preserve ALL original content - do not summarize or omit anything
- Add proper Markdown structure with headers (##, ###), lists (-), bold text (**), etc.
- Make the content more readable and organized
- Use appropriate Markdown formatting to highlight key information
- Return ONLY the markdown-formatted content, no explanations

Original content to convert:
${content}`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "text/plain",
      },
    });

    const markdownContent = response.text?.trim();

    if (!markdownContent) {
      throw new Error("Gemini returned empty response for markdown conversion");
    }

    return markdownContent;
  } catch (error) {
    console.error("Error converting content to markdown:", error);
    // Fallback: return original content with basic formatting
    return content.replace(/\n\n/g, "\n\n").trim();
  }
};
