import { GoogleGenAI, Type, ThinkingLevel, Modality, VideoGenerationReferenceType } from "@google/genai";
import { Flashcard, QuizQuestion } from '../types';

// Ensure the API key is available
const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const spyrisModel = "gemini-3-flash-preview";
export const proModel = "gemini-3.1-pro-preview";
export const liteModel = "gemini-3.1-flash-lite-preview";
export const veoModel = "veo-3.1-fast-generate-preview";
export const proImageModel = "gemini-3-pro-image-preview";
export const flashImageModel = "gemini-3.1-flash-image-preview";
export const liveModel = "gemini-3.1-flash-live-preview";

export const ttsModel = "gemini-2.5-flash-preview-tts";

export async function chatWithSpyris(message: string, history: { role: string; parts: { text: string }[] }[] = [], department: string = 'General') {
  try {
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. You specialize in various academic departments. Your goal is to help students with their lessons, explain complex topics simply, and help them create high-quality study notes (conspects). Use markdown for formatting. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic. IMPORTANT: Be concise and context-aware. If the user sends a simple greeting like 'hello' or 'привет', respond briefly and ask how you can help. Do not write long paragraphs unless the user asks a complex question.";

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
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user, or draft messages based on the user's topic, tone, and length preferences. Provide accurate and context-aware translations or well-written drafts.";
    } else if (department === 'SmartVideos') {
      systemInstruction += " You are currently in the 'Smart Videos' department. Your goal is to find and suggest the best educational YouTube videos for a specific class level and topic. Provide direct YouTube links and a brief explanation of why each video is helpful.";
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
        tools: [{ googleSearch: {} }, { urlContext: {} }]
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

export async function chatWithSpyrisStream(
  message: string, 
  history: any[] = [], 
  department: string = 'General', 
  attachedImages?: { data: string, mimeType: string }[], 
  sourceUrl?: string, 
  uploadedFile?: { name: string, data: string, type: string } | null,
  isThinking: boolean = false,
  isLite: boolean = false
) {
  try {
    const modelToUse = isThinking ? proModel : (isLite ? liteModel : spyrisModel);
    
    let systemInstruction = "Your name is Spyris. You are a brilliant, encouraging, and highly efficient AI study assistant for SpyrisLearn. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. You specialize in various academic departments. Your goal is to help students with their lessons, explain complex topics simply, and help them create high-quality study notes (conspects). Use markdown for formatting. When providing mathematical or physics formulas, ALWAYS use LaTeX syntax enclosed in double dollar signs for block math (e.g., $$E = mc^2$$) or single dollar signs for inline math (e.g., $a^2 + b^2 = c^2$). Ensure you use backslashes (\\) for LaTeX commands, NOT forward slashes (/). Your personality is tech-forward, helpful, and energetic. IMPORTANT: Be concise and context-aware. If the user sends a simple greeting like 'hello' or 'привет', respond briefly and ask how you can help. Do not write long paragraphs unless the user asks a complex question.";

    if (isThinking) {
      systemInstruction += " You are in 'Thinking Mode'. Provide deep, step-by-step reasoning for complex academic problems. Break down the logic clearly before giving the final answer.";
    }

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
      systemInstruction += " You are currently in the 'Translator' department. Your goal is to translate text between any languages requested by the user, or draft messages based on the user's topic, tone, and length preferences. Provide accurate and context-aware translations or well-written drafts.";
    } else if (department === 'SmartVideos') {
      systemInstruction += " You are currently in the 'Smart Videos' department. Your goal is to find and suggest the best educational YouTube videos for a specific class level and topic. Provide direct YouTube links and a brief explanation of why each video is helpful.";
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

    if (uploadedFile) {
      parts.push({
        inlineData: {
          data: uploadedFile.data,
          mimeType: uploadedFile.type || "application/pdf"
        }
      });
    }
    
    let finalMessage = message;
    if (sourceUrl) {
      finalMessage = `Please use the content from this URL to help with the request: ${sourceUrl}\n\nUser Request: ${message}`;
    }

    if (uploadedFile) {
      finalMessage = `Please use the content from the attached file "${uploadedFile.name}" to help with the request.\n\nUser Request: ${finalMessage}`;
    }

    if (finalMessage) {
      parts.push({ text: finalMessage });
    }

    const response = await ai.models.generateContentStream({
      model: modelToUse,
      contents: [
        ...history,
        { role: "user", parts }
      ],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }, { urlContext: {} }],
        thinkingConfig: isThinking ? { thinkingLevel: ThinkingLevel.HIGH } : undefined
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

export async function generateFlashcards(prompt: string, history: any[], sourceUrl?: string, uploadedFile?: { name: string, data: string, type: string } | null): Promise<Flashcard[]> {
  try {
    const historyText = history.map(h => `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}`).join('\n');
    let finalPrompt = `Conversation history:\n${historyText}\n\nGenerate flashcards based on this request: "${prompt}". If no specific number is given, generate 10.`;
    
    const parts: any[] = [];
    if (uploadedFile) {
      parts.push({
        inlineData: {
          data: uploadedFile.data,
          mimeType: uploadedFile.type || "application/pdf"
        }
      });
      finalPrompt = `Please use the content from the attached file "${uploadedFile.name}" to generate flashcards.\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 10.`;
    } else if (sourceUrl) {
      finalPrompt = `Please use the content from this URL to generate flashcards: ${sourceUrl}\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 10.`;
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: "You are an expert teacher creating flashcards. Provide concise, clear fronts and backs. If no specific number is given, generate 10.",
        tools: [{ urlContext: {} }],
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

export async function generateQuiz(prompt: string, history: any[], sourceUrl?: string, uploadedFile?: { name: string, data: string, type: string } | null): Promise<QuizQuestion[]> {
  try {
    const historyText = history.map(h => `${h.role}: ${h.parts.map((p: any) => p.text || '[Image]').join(' ')}`).join('\n');
    let finalPrompt = `Conversation history:\n${historyText}\n\nGenerate a multiple-choice quiz based on this request: "${prompt}". If no specific number is given, generate 5 questions.`;
    
    const parts: any[] = [];
    if (uploadedFile) {
      parts.push({
        inlineData: {
          data: uploadedFile.data,
          mimeType: uploadedFile.type || "application/pdf"
        }
      });
      finalPrompt = `Please use the content from the attached file "${uploadedFile.name}" to generate a quiz.\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 5 questions.`;
    } else if (sourceUrl) {
      finalPrompt = `Please use the content from this URL to generate a quiz: ${sourceUrl}\n\nUser Request: ${prompt}\n\nIf no specific number is given, generate 5 questions.`;
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: [
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: "You are an expert teacher creating a quiz. Provide clear questions, 4 options, the correct answer index (0-3), and a brief explanation. If no specific number is given, generate 5 questions.",
        tools: [{ urlContext: {} }],
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
export async function generateVideo(prompt: string, image?: { data: string, mimeType: string }, aspectRatio: '16:9' | '9:16' = '16:9') {
  try {
    const aiVeo = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
    let operation = await aiVeo.models.generateVideos({
      model: veoModel,
      prompt,
      image: image ? {
        imageBytes: image.data,
        mimeType: image.mimeType,
      } : undefined,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await aiVeo.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.API_KEY || apiKey,
      },
    });
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating video:", error);
    throw error;
  }
}

export async function generateImage(prompt: string, size: '1K' | '2K' | '4K' = '1K', aspectRatio: '1:1' | '16:9' | '9:16' = '1:1') {
  try {
    const aiImg = new GoogleGenAI({ apiKey: process.env.API_KEY || apiKey });
    const response = await aiImg.models.generateContent({
      model: proImageModel,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: size
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

export async function editImage(baseImage: { data: string, mimeType: string }, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: flashImageModel,
      contents: {
        parts: [
          { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Image edit failed");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
}

export async function analyzeVideo(videoData: string, mimeType: string, prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: proModel,
      contents: {
        parts: [
          { inlineData: { data: videoData, mimeType } },
          { text: prompt }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error analyzing video:", error);
    throw error;
  }
}

export async function transcribeAudio(audioData: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: spyrisModel,
      contents: {
        parts: [
          { inlineData: { data: audioData, mimeType } },
          { text: "Transcribe this audio accurately. Only provide the transcription text." }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw error;
  }
}

export async function textToSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  try {
    const response = await ai.models.generateContent({
      model: ttsModel,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    throw new Error("No audio generated");
  } catch (error) {
    console.error("Error in textToSpeech:", error);
    throw error;
  }
}

export function connectLive(callbacks: {
  onopen?: () => void;
  onmessage: (message: any) => void;
  onerror?: (error: any) => void;
  onclose?: () => void;
}, systemInstruction?: string) {
  return ai.live.connect({
    model: liveModel,
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
      },
      systemInstruction: systemInstruction || "You are Spyris, a helpful AI study assistant. You are having a real-time voice conversation.",
    },
  });
}
