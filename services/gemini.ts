import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { QuizConfig } from "../types";

// Initialize Gemini Client
// Note: API Key must be provided via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define available models
export const MODELS = {
  FLASH: 'gemini-2.5-flash',
  PRO: 'gemini-3-pro-preview' // For deeper reasoning
};

const cleanBase64 = (base64Image: string) => {
  return base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64Image: string) => {
  const match = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const getSlideExplanation = async (
  base64Image: string,
  prompt: string,
  modelId: string = MODELS.FLASH,
  contextHistory: { role: string; content: string }[] = []
): Promise<string> => {
  try {
    const parts: any[] = [
      {
        inlineData: {
          mimeType: getMimeType(base64Image),
          data: cleanBase64(base64Image),
        },
      },
      {
        text: prompt || "Analyze this slide. If it's a question, solve it. If it's a concept, explain it comprehensively.",
      },
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: parts,
      },
      config: {
        systemInstruction: `You are Lumina, a smart, trendy, and insightful student companion.
        
        GOAL: Explain the slide content so well that the user completely understands it without needing another source. Balance simplicity with depth.

        YOUR RULES:
        1. **Solve Problems Step-by-Step**: If the slide has a question (Math, Physics, Coding):
           - Give the **Final Answer** clearly.
           - Show the **Step-by-Step Working**. Don't just skip to the result; teach the *method* so the user learns.
        
        2. **Explain Concepts Fully**: 
           - Start simple, then add the necessary depth.
           - Use "Plain English". Avoid textbook jargon unless you define it immediately.
           - Provide enough context so the concept makes sense on its own.
           - Do not limit yourself to short blurbs if the topic needs 2-3 paragraphs to be understood properly.
        
        3. **Real-World Analogies**:
           - ALWAYS include a "Like a..." analogy. Connect the abstract concept to a concrete, everyday scenario (e.g., cars, cooking, sports).
           
        4. **Tone**: Helpful, encouraging, and smart. Use emojis occasionally (💡, 🚀).
        
        STRUCTURE YOUR RESPONSE:
        ## ⚡ Quick Answer
        (The direct solution, formula, or the main "Headline" definition)
        
        ## 🧠 Deep Dive
        (The detailed explanation. Use bullet points or short paragraphs. Cover the "Why" and "How". Be thorough.)
        
        ## 🌍 Real-World Analogy
        (Think of it like... [Analogy])
        `,
        temperature: 0.4, 
      }
    });

    return response.text || "Unable to generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getSlideTakeaways = async (
  base64Image: string,
  modelId: string = MODELS.FLASH
): Promise<string> => {
  try {
    const parts: any[] = [
      {
        inlineData: {
          mimeType: getMimeType(base64Image),
          data: cleanBase64(base64Image),
        },
      },
      {
        text: "Give me the 3-4 most important points from this slide.",
      },
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: `You are an expert exam revision tool.
        
        TASK: Extract exactly 3-4 "Golden Nuggets" from this slide.
        
        FORMAT:
        * 🎯 **[Keyword]**: [Concise explanation, 1-2 sentences max]
        * 🎯 **[Keyword]**: [Concise explanation, 1-2 sentences max]
        * 🎯 **[Keyword]**: [Concise explanation, 1-2 sentences max]
        
        CONSTRAINT:
        - Strictly 3 or 4 points.
        - Ensure the points capture the *core meaning*, not just labels.
        - Focus on formulas, definitions, or key facts that are exam-relevant.
        `,
        temperature: 0.2,
      }
    });

    return response.text || "Unable to extract takeaways.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const analyzeBatchSlides = async (
  slidesData: { base64: string, index: number }[],
  modelId: string = MODELS.FLASH
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    slidesData.forEach(slide => {
      parts.push({
        text: `[SLIDE ${slide.index + 1}]`
      });
      parts.push({
        inlineData: {
          mimeType: getMimeType(slide.base64),
          data: cleanBase64(slide.base64),
        }
      });
    });

    parts.push({
      text: `Create a "Cheat Sheet" summary for these slides. 
      For each slide, give me ONE single most important takeaway in a bullet point.
      
      Format:
      ## 📚 Revision Cheat Sheet
      
      * **Slide 1**: [Takeaway]
      * **Slide 2**: [Takeaway]
      ...
      
      Keep it high-yield and revision-focused.`
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: "You are a batch document summarizer. Create concise revision notes.",
        temperature: 0.3,
      }
    });

    return response.text || "";
  } catch (error) {
    console.error("Batch Analysis Error:", error);
    throw error;
  }
};

export const generateQuizFromSlides = async (
  slidesData: { base64: string, index: number }[],
  config: QuizConfig,
  modelId: string = MODELS.FLASH
): Promise<any> => {
  try {
    const parts: any[] = [];
    
    // We limit the number of images to prevent hitting payload limits if deck is huge
    const sampleSize = 10;
    const step = Math.ceil(slidesData.length / sampleSize);
    
    for (let i = 0; i < slidesData.length; i += step) {
      const slide = slidesData[i];
      parts.push({
        text: `[SLIDE ${slide.index + 1}]`
      });
      parts.push({
        inlineData: {
          mimeType: getMimeType(slide.base64),
          data: cleanBase64(slide.base64),
        }
      });
    }

    const difficultyText = config.difficulty.toUpperCase();
    const isMcq = config.type === 'mcq';
    
    const prompt = isMcq 
      ? `Create a 5-question MULTIPLE CHOICE quiz (${difficultyText} level) based on these slides. Focus on testing detailed understanding.`
      : `Create 5 SUBJECTIVE (Short Answer) questions (${difficultyText} level) based on these slides. Provide the Question and a detailed Model Answer.`;

    parts.push({ text: prompt });

    // Define schema properties based on type
    const properties: any = {
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            type: { type: Type.STRING, enum: [isMcq ? 'mcq' : 'subjective'] },
            question: { type: Type.STRING },
            explanation: { type: Type.STRING, description: "Detailed explanation or concept review" },
            // Conditionally add fields based on type
            ...(isMcq ? {
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctAnswer: { type: Type.INTEGER, description: "Index 0-3" }
            } : {
              modelAnswer: { type: Type.STRING, description: "The ideal answer expected from the student" }
            })
          },
          required: isMcq 
            ? ["id", "type", "question", "options", "correctAnswer", "explanation"]
            : ["id", "type", "question", "modelAnswer", "explanation"]
        }
      }
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: properties
        },
        systemInstruction: `You are a strict teacher creating a quiz. 
        Level: ${difficultyText}. 
        Type: ${isMcq ? 'Multiple Choice' : 'Subjective/Short Answer'}.
        Generate valid JSON only.`,
        temperature: 0.4,
      }
    });
    
    if (response.text) {
      const parsed = JSON.parse(response.text);
      // Inject config back into data for UI usage
      return { ...parsed, config }; 
    }
    return null;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    throw error;
  }
};

export const generateQuestionBank = async (
  slidesData: { base64: string, index: number }[],
  modelId: string = MODELS.FLASH
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    // Sample slides to get context without overloading
    const sampleSize = 10;
    const step = Math.ceil(slidesData.length / sampleSize);
    
    for (let i = 0; i < slidesData.length; i += step) {
      const slide = slidesData[i];
      parts.push({
        text: `[SLIDE ${slide.index + 1}]`
      });
      parts.push({
        inlineData: {
          mimeType: getMimeType(slide.base64),
          data: cleanBase64(slide.base64),
        }
      });
    }

    parts.push({
      text: `Based on these slides, generate a comprehensive "Question Bank" to help me study.
      
      Organize into these 3 sections:
      
      ## 1. 🌱 Concept Recall (Easy)
      (Focus on definitions, basic facts, and "What is X?" questions)
      
      ## 2. 🛠️ Application & Solving (Medium)
      (Focus on "How does X work?", solving problems, or explaining processes)
      
      ## 3. 🚀 Analysis & Synthesis (Hard)
      (Focus on "Why?", comparing concepts, or complex scenarios)

      REQUIREMENTS:
      - Generate 3-4 high-quality questions per section.
      - **CRITICAL**: Provide the ANSWER for every question immediately after it.
      - Use clear formatting.
      
      Format each entry exactly like this:
      
      **Q:** [The Question]
      > **A:** [The concise and clear answer]
      `
    });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: "You are an expert examiner creating a study question bank with answers.",
        temperature: 0.5,
      }
    });

    return response.text || "Could not generate question bank.";
  } catch (error) {
    console.error("Question Bank Error:", error);
    throw error;
  }
};