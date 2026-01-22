import { GoogleGenAI, Type } from "@google/genai";
import { AnalyzedElement, AspectRatio } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize client (creating new instance per call recommended for key rotation/safety in some patterns, 
// but single instance is fine if env is static. Adhering to prompt instructions to use process.env.API_KEY)
const getAiClient = () => new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analyzes an image to identify distinct elements for the "Magic Wand" simulation.
 */
export const analyzeImageContents = async (base64Image: string): Promise<AnalyzedElement[]> => {
  const ai = getAiClient();
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: 'Analyze this image. Identify the distinct visual elements (main person, specific objects, background context, visible text) that could be separated. Return a JSON object with a list of elements.' }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            elements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Short descriptive name of the element" },
                  type: { type: Type.STRING, enum: ['object', 'text', 'background', 'person'] },
                  description: { type: Type.STRING, description: "Detailed visual description for reconstruction" }
                },
                required: ['label', 'type', 'description']
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{"elements": []}');
    
    // Map to our internal type with IDs
    return result.elements.map((el: any, index: number) => ({
      id: `el-${index}`,
      label: el.label,
      type: el.type,
      selected: el.type !== 'background' // Default to selecting foreground items
    }));

  } catch (error) {
    console.error("Analysis failed:", error);
    // Fallback if analysis fails
    return [
      { id: '1', label: 'Main Subject', type: 'person', selected: true },
      { id: '2', label: 'Background', type: 'background', selected: false },
    ];
  }
};

/**
 * Generates the recomposed image.
 */
export const generateRecomposedImage = async (
  originalImageBase64: string,
  selectedElements: AnalyzedElement[],
  aspectRatio: AspectRatio,
  templatePrompt: string,
  customPrompt?: string
): Promise<string> => {
  const ai = getAiClient();
  const cleanBase64 = originalImageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  // Construct a prompt that instructs the model to use the reference image but only keep selected parts
  const keptItems = selectedElements.filter(e => e.selected).map(e => e.label).join(", ");
  
  let userInstruction = "";
  if (customPrompt) {
    userInstruction = `Instruction: ${customPrompt}. `;
  } else {
    userInstruction = `Create a professional composition featuring: ${keptItems}. Place them ${templatePrompt}. `;
  }

  const prompt = `${userInstruction} 
  Use the provided image as a strict visual reference for the appearance of the ${keptItems}. 
  Ignore the original aspect ratio. 
  Output a high-quality, photorealistic image suitable for a TV display. 
  Ensure text is legible if preserved.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any, // Cast because SDK types might lag behind specific enum values
          imageSize: '1K' // 2K is ideal for 1080p+, but SDK allows 1K, 2K, 4K. Start with 1K for speed/stability or 2K if needed.
        }
      }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned in response.");

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
};

/**
 * Generates a completely new image from scratch (fallback tool).
 */
export const generateNewImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAiClient();
  
  try {
     // Use Imagen model for pure generation if preferred, or Gemini 3 Pro Image. 
     // Instructions say "MUST add image generation ... using model gemini-3-pro-image-preview"
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: '1K'
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("New image generation failed:", error);
    throw error;
  }
}
