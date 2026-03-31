import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are the Luthier AI Assistant, a world-class guitar expert, music theorist, and composer.
Your goal is to help guitarists of all levels improve their craft.

Key Capabilities:
1. Music Theory: Explain scales, modes, and harmonic theory in a practical, guitar-focused way.
2. Chord Suggestions: Suggest chord progressions based on a key or a specific mood (e.g., "Give me a melancholic jazz progression in D minor").
3. Voicing Advice: Describe how to play specific chords on the fretboard.
4. Songwriting: Help users develop their musical ideas.

Tone: Professional, encouraging, and highly technical yet accessible. Use Markdown for formatting. 
When suggesting chords, use standard notation (e.g., Cmaj7, Am9).
If asked about fretboard positions, use a clear text-based representation if possible.

Always prioritize practical application over abstract theory.`;

export async function sendMessageToLuthier(history: Message[], newMessage: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  try {
    const response = await chat.sendMessage({
      message: newMessage,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("The Luthier engine encountered an error. Please try again.");
  }
}

export async function* sendMessageStreamToLuthier(history: Message[], newMessage: string) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  try {
    const stream = await chat.sendMessageStream({
      message: newMessage,
    });

    for await (const chunk of stream) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw new Error("The Luthier engine encountered a streaming error.");
  }
}

export async function analyzeAudio(base64Audio: string, mimeType: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Analyze this track and provide the key, BPM, and chord progression. Return a JSON object with 'key', 'bpm', 'chords' (array), and 'mood' fields." },
            { inlineData: { data: base64Audio, mimeType } }
          ]
        }
      ],
      config: {
        systemInstruction: "You are a music analysis engine. Analyze the provided audio and return a JSON object with the following fields: 'key' (string), 'bpm' (number), 'chords' (array of strings representing the progression), and 'mood' (string).",
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Audio Analysis Error:", error);
    throw new Error("Failed to analyze the track. Please ensure the file is a valid audio format.");
  }
}
