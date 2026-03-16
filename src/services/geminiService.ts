import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, QuizQuestion } from '../types';

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const spyrisModel = "gemini-3-flash-preview";

export async function chatWithSpyris(message: string, history: { role: string; parts: { text: string }[] }[] = [], department: string = 'General') {
  try {
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. You specialize in various academic departments. Your goal is to help students with their lessons, explain complex topics simply, and help them create high-quality study notes (conspects). Use markdown for formatting. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic.";

    if (department === 'Marks') {
      systemInstruction += " You are currently in the 'Marks' department. When a student provides their marks for various subjects, analyze them. Identify subjects that need improvement (e.g., marks below 4 or 70%) and create a personalized study plan and specific tasks to help them improve those grades.";
    } else if (department === 'Flashcards') {
      systemInstruction += " You are currently in the 'Flashcards' department. You help students create and review flashcards.";
    } else if (department === 'Quizzes') {
      systemInstruction += " You are currently in the 'Quizzes' department. You help students test their knowledge with quizzes.";
    } else if (department === 'Plan') {
      systemInstruction += " You are currently in the 'Plan' department. Your goal is to create a comprehensive study plan for the student. Ask them what they are studying for, their timeline, and their goals, then generate a detailed schedule and study strategy.";
    } else if (department === 'Test') {
      systemInstruction += " You are currently in the 'Test' department. Your goal is to generate a multiple-choice test based on a specific subject, topic, and difficulty level (Easy, Medium, Hard). Provide 5 questions with 4 options each. After the student answers, provide feedback and the correct answers. Format the test clearly using markdown.";
    } else if (department === 'Translator') {
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user. Provide accurate and context-aware translations.";
    } else if (department === 'Voice') {
      systemInstruction += " You are currently in the 'Voice' department. You are having a real-time voice conversation with the student. Be helpful, concise, and engaging.";
    }

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        ...history,
        { role: "user", parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
      }
    });

    if (!response || !response.text) {
      throw new Error("No response from Spyris");
    }

    return response.text;
  } catch (error) {
    console.error("Error in chatWithSpyris:", error);
    return "Spyris is having a bit of a brain freeze. Please check your connection or try again in a moment!";
  }
}

export async function chatWithSpyrisStream(message: string, history: any[] = [], department: string = 'General', attachedImages?: { data: string, mimeType: string }[]) {
  try {
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. You specialize in various academic departments. Your goal is to help students with their lessons, explain complex topics simply, and help them create high-quality study notes (conspects). Use markdown for formatting. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic.";

    if (department === 'Marks') {
      systemInstruction += " You are currently in the 'Marks' department. When a student provides their marks for various subjects, analyze them. Identify subjects that need improvement (e.g., marks below 4 or 70%) and create a personalized study plan and specific tasks to help them improve those grades.";
    } else if (department === 'Flashcards') {
      systemInstruction += " You are currently in the 'Flashcards' department. You help students create and review flashcards.";
    } else if (department === 'Quizzes') {
      systemInstruction += " You are currently in the 'Quizzes' department. You help students test their knowledge with quizzes.";
    } else if (department === 'Plan') {
      systemInstruction += " You are currently in the 'Plan' department. Your goal is to create a comprehensive study plan for the student. Ask them what they are studying for, their timeline, and their goals, then generate a detailed schedule and study strategy.";
    } else if (department === 'Test') {
      systemInstruction += " You are currently in the 'Test' department. Your goal is to generate a multiple-choice test based on a specific subject, topic, and difficulty level (Easy, Medium, Hard). Provide 5 questions with 4 options each. After the student answers, provide feedback and the correct answers. Format the test clearly using markdown.";
    } else if (department === 'Translator') {
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user. Provide accurate and context-aware translations.";
    } else if (department === 'Voice') {
      systemInstruction += " You are currently in the 'Voice' department. You are having a real-time voice conversation with the student. Be helpful, concise, and engaging.";
    }

    const parts: any[] = [];
    if (attachedImages && attachedImages.length > 0) {
      attachedImages.forEach(img => {
        parts.push({
          inlineData: {
            data: img.data,
            mimeType: img.mimeType
          }
        });
      });
    }
    if (message) {
      parts.push({ text: message });
    }

    const response = await ai.models.generateContentStream({
      model: spyrisModel,
      contents: [
        ...history,
        { role: "user", parts }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }, { urlContext: {} }]
      }
    });

    return response;
  } catch (error) {
    console.error("Error in chatWithSpyrisStream:", error);
    throw error;
  }
}

export async function analyzeImageForConspect(images: { data: string, mimeType: string }[]) {
  try {
    const parts: any[] = images.map(img => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType,
      },
    }));
    
    parts.push({
      text: "Analyze these images of study material. Extract the main keywords and concepts, then write a well-structured 'conspect' (summary/notes) that a student can use to study. Use clear headings and bullet points. Format it beautifully with markdown.",
    });

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: {
        parts: parts,
      },
    });

    if (!response || !response.text) {
      throw new Error("No response from Spyris during image analysis");
    }

    return response.text;
  } catch (error) {
    console.error("Error in analyzeImageForConspect:", error);
    return "Spyris couldn't read that image. Make sure it's clear and try again!";
  }
}

export async function generateFlashcards(prompt: string, history: any[]): Promise<Flashcard[]> {
  try {
    const historyText = history.map(h => `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}`).join('\n');
    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        { role: 'user', parts: [{ text: `Conversation history:\n${historyText}\n\nGenerate flashcards based on this request: "${prompt}". If no specific number is given, generate 10.` }] }
      ],
      config: {
        systemInstruction: "You are an expert teacher creating flashcards. Provide concise, clear fronts and backs. If no specific number is given, generate 10.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              front: { type: Type.STRING, description: "The question or concept on the front of the flashcard." },
              back: { type: Type.STRING, description: "The answer or explanation on the back of the flashcard." }
            },
            required: ["front", "back"]
          }
        }
      }
    });
    
    if (response.text) {
      try {
        const match = response.text.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
        return JSON.parse(response.text);
      } catch (e) {
        console.error("Failed to parse flashcards JSON:", e, response.text);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return [];
  }
}

export async function generateQuiz(prompt: string, history: any[]): Promise<QuizQuestion[]> {
  try {
    const historyText = history.map(h => `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}`).join('\n');
    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        { role: 'user', parts: [{ text: `Conversation history:\n${historyText}\n\nGenerate a multiple-choice quiz based on this request: "${prompt}". If no specific number is given, generate 5 questions.` }] }
      ],
      config: {
        systemInstruction: "You are an expert teacher creating a quiz. Provide clear questions, 4 options, the correct answer index (0-3), and a brief explanation. If no specific number is given, generate 5 questions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The quiz question." },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Exactly 4 possible answers."
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "The index (0 to 3) of the correct option." },
              explanation: { type: Type.STRING, description: "A brief explanation of why the answer is correct." }
            },
            required: ["question", "options", "correctAnswerIndex", "explanation"]
          }
        }
      }
    });
    
    if (response.text) {
      try {
        const match = response.text.match(/\[[\s\S]*\]/);
        if (match) {
          return JSON.parse(match[0]);
        }
        return JSON.parse(response.text);
      } catch (e) {
        console.error("Failed to parse quiz JSON:", e, response.text);
        return [];
      }
    }
    return [];
  } catch (error) {
    console.error("Error generating quiz:", error);
    return [];
  }
}
