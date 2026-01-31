
import { GoogleGenAI, Type, GenerateContentResponse, Chat } from "@google/genai";
import { UserBrand, AnalysisResult, PostSuggestion, GroundingSource, StrategicBriefing, RegionalTrends, ActivitySummary } from "../types";

const getBase64Data = (base64String: string) => base64String.split(',')[1] || base64String;

export const analyzeBrandVoice = async (brand: UserBrand): Promise<AnalysisResult> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const socialLinksStr = brand.socialLinks 
      ? Object.entries(brand.socialLinks).filter(([_, url]) => url).map(([platform, url]) => `${platform}: ${url}`).join(', ')
      : 'None provided';

    const textPrompt = `Analyze the following brand information for an "Atma Nirbhar Bharat" creator. 
      Social Media Links: ${socialLinksStr}
      User Description: ${brand.description}
      Focus on brand voice, cultural relevance, and how it aligns with modern Digital India values. Return voiceDescription, commonThemes, and styleKeywords (including Indian aesthetic terms) in JSON.`;

    const parts: any[] = [{ text: textPrompt }];
    brand.profileImages.forEach((img) => parts.push({ inlineData: { mimeType: 'image/png', data: getBase64Data(img) } }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            voiceDescription: { type: Type.STRING },
            commonThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            styleKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["voiceDescription", "commonThemes", "styleKeywords"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error: any) { throw new Error(error.message); }
};

export const fetchDetailedTrends = async (brand: UserBrand): Promise<RegionalTrends> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const hasCoords = brand.location?.latitude !== undefined && brand.location?.longitude !== undefined;
    
    const locationStr = hasCoords 
      ? `coordinates: ${brand.location?.latitude}, ${brand.location?.longitude}`
      : `${brand.location?.city}, ${brand.location?.state}, ${brand.location?.country}`;

    const prompt = `Search for the latest hyper-local trending topics, news, and social media viral content specifically for ${locationStr} and India-wide. 
    ${hasCoords ? "Since precise GPS coordinates are provided, the creator is currently in mobility. Focus on hyper-local venue trends, landmark events, nearby buzzing attractions, and real-time activities happening within a 5km radius." : ""}
    Also find trends related to the creator's niche: "${brand.description}". 
    Categorize them into regional (city/state), national, and genres (tech, lifestyle, sports, politics, etc.). 
    Return a structured JSON.`;

    const config: any = {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          city: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
          state: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
          national: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING }, hashtags: { type: Type.ARRAY, items: { type: Type.STRING } } } } },
          genres: {
            type: Type.OBJECT,
            properties: {
              tech: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING } } } },
              lifestyle: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING } } } },
              entertainment: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, context: { type: Type.STRING } } } }
            }
          }
        }
      }
    };

    if (hasCoords) {
      config.tools.push({ googleMaps: {} });
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: brand.location?.latitude,
            longitude: brand.location?.longitude
          }
        }
      };
    }

    const response = await ai.models.generateContent({
      model: hasCoords ? 'gemini-2.5-flash' : 'gemini-3-pro-preview',
      contents: prompt,
      config: config
    });
    return JSON.parse(response.text || '{}');
  } catch (error: any) {
    console.error("Trend Fetch Error:", error);
    throw error;
  }
};

export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed.");
    
    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    console.error("Veo Video Gen Error:", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  } catch (error: any) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

export const summarizeSocialPulse = async (feedText: string): Promise<ActivitySummary> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize social activity with a focus on Indian trends and creator opportunities:
      "${feedText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recentInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
            topAccountsInfluencing: { type: Type.ARRAY, items: { type: Type.STRING } },
            overallVibe: { type: Type.STRING },
            summaryText: { type: Type.STRING }
          },
          required: ["recentInterests", "topAccountsInfluencing", "overallVibe", "summaryText"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error: any) { throw new Error("Activity summarization failed."); }
};

export const generateDailySuggestions = async (brand: UserBrand, analysis: AnalysisResult): Promise<{ suggestions: PostSuggestion[], sources: GroundingSource[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const localLang = brand.location?.state === 'Maharashtra' ? 'Marathi' : 
                     brand.location?.state === 'Karnataka' ? 'Kannada' : 
                     brand.location?.state === 'Tamil Nadu' ? 'Tamil' : 'Hindi';

    const textPrompt = `As a strategist for 'Make In India', suggest 3 social media posts for ${brand.location?.city}.
    Include Indian cultural elements, local festivals, and entrepreneurial pride. 
    One post MUST focus on "Atma Nirbhar" spirit (self-reliance/local growth).
    For each post, provide 4-5 TONE VARIANTS (Humorous, Sarcastic, Professional, Soft, Political).
    For each variant, provide the content in BOTH English and ${localLang}.
    - Create a 'videoPrompt' for Veo cinematic video (Indian cinematic lighting, rich textures).
    - If it's a festival, include 'festivalInfo' with name and greeting.
    - If the post involves a factual claim, trend comparison, or interesting statistics, include a 'dataGraphic' object with type ('bar', 'pie', 'line'), labels, values, a title, and a one-sentence descriptive 'description' of the insight.`;

    const parts: any[] = [{ text: textPrompt }];
    brand.profileImages.forEach((img) => parts.push({ inlineData: { mimeType: 'image/png', data: getBase64Data(img) } }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  platform: { type: Type.STRING },
                  content: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  suggestedHashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  tone: { type: Type.STRING },
                  toneVariants: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        tone: { type: Type.STRING },
                        contentEnglish: { type: Type.STRING },
                        contentIndic: { type: Type.STRING },
                        indicLanguage: { type: Type.STRING }
                      }
                    }
                  },
                  visualPrompt: { type: Type.STRING },
                  videoPrompt: { type: Type.STRING },
                  engagementLevel: { type: Type.STRING },
                  platformTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  festivalInfo: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      isGreeting: { type: Type.BOOLEAN },
                      overlayText: { type: Type.STRING }
                    }
                  },
                  dataGraphic: {
                    type: Type.OBJECT,
                    properties: {
                      type: { type: Type.STRING, description: "'bar', 'pie', or 'line'" },
                      labels: { type: Type.ARRAY, items: { type: Type.STRING } },
                      values: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING }
                    },
                    required: ["type", "labels", "values", "title"]
                  }
                }
              }
            }
          }
        }
      }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || 'Source',
        uri: chunk.web.uri,
      }));

    return { suggestions: JSON.parse(response.text || '{"suggestions":[]}').suggestions, sources };
  } catch (error: any) { throw new Error(error.message); }
};

export const createManagerChat = (brand: UserBrand, analysis: AnalysisResult): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: `You are Kalki, the Digital Engine of Atma Nirbhar Content. Your mission is to help Indian creators achieve global impact with local excellence. Speak with pride, wisdom, and strategic sharpness.`, tools: [{ googleSearch: {} }] }
  });
};

export const getStrategicBriefing = async (brand: UserBrand, analysis: AnalysisResult): Promise<StrategicBriefing> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a strategic creator briefing for ${brand.name} in the context of Digital India and global competitiveness.`,
      config: { 
        tools: [{ googleSearch: {} }], 
        responseMimeType: "application/json", 
        responseSchema: { 
            type: Type.OBJECT, 
            properties: { 
                overview: { type: Type.STRING }, 
                keyGoals: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                trendingContext: { type: Type.STRING } 
            }, 
            required: ["overview", "keyGoals", "trendingContext"] 
        } 
      }
    });
    return JSON.parse(response.text || '{}');
};

export const translatePostContent = async (content: string, targetLanguage: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate to ${targetLanguage} while keeping the cultural nuances and brand tone: "${content}"`,
    });
    return response.text || content;
};
