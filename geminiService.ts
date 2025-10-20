import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { VideoConfig, Scene } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateScript = async (config: VideoConfig): Promise<Scene[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `Based on the user prompt "${config.prompt}", create a script for a video approximately ${config.videoLength} long. The story should be broken down into distinct scenes. For each scene, provide a detailed, photorealistic visual description suitable for an AI image generator, and a short narration text in ${config.language}. The tone should be cinematic. Return the output as a JSON array of objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            scene_number: {
                                type: Type.INTEGER,
                                description: 'The sequence number of the scene.',
                            },
                            visual_description: {
                                type: Type.STRING,
                                description: 'A detailed prompt for an AI image generator to create a photorealistic, cinematic image for this scene.',
                            },
                            narration: {
                                type: Type.STRING,
                                description: `The narration script for this scene, in ${config.language}.`,
                            },
                        },
                        required: ["scene_number", "visual_description", "narration"],
                    },
                },
            },
        });

        const jsonString = response.text.trim();
        const script = JSON.parse(jsonString);
        return script;

    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("Failed to generate script. Please check your prompt and API key.");
    }
};

export const generateImage = async (visualDescription: string, aspectRatio: string): Promise<string> => {
    try {
        const fullPrompt = `Photorealistic, cinematic, high-detail, ${aspectRatio} aspect ratio. ${visualDescription}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: fullPrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                // Assuming jpeg, as it's a common format for this model.
                return `data:image/jpeg;base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image was generated. The prompt may have been blocked by safety policies.");

    } catch (error) {
        console.error("Error generating image:", error);
        let errorMessage = "Failed to generate image.";
        if (error instanceof Error) {
            errorMessage += ` Reason: ${error.message}`;
        }
        throw new Error(errorMessage);
    }
};


export const generateVoiceover = async (narration: string, voice: string): Promise<string> => {
    try {
        // Map app voice names to prebuilt voice names.
        let voiceName = 'Kore'; // default male
        if (voice.includes('Female (Mature)')) voiceName = 'Puck';
        if (voice.includes('Male (News-style)')) voiceName = 'Charon';
        if (voice.includes('Female (Calm)')) voiceName = 'Zephyr';

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: narration }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName as any },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Voiceover generation returned no audio data.");
        }
        return base64Audio;

    } catch (error) {
        console.error("Error generating voiceover:", error);
        throw new Error("Failed to generate voiceover.");
    }
};
