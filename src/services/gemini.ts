import { GoogleGenAI, Type } from "@google/genai";
import { UserContext, LegalResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are an AI Legal Assistant for Indian migrant workers.

Respond ONLY with valid JSON:
{
  "category": "wage_theft|unsafe_conditions|harassment|forced_labor|child_labor|discrimination|other",
  "legal_summary": "professional legal explanation with specific legal references",
  "laws": ["law1", "law2"],
  "complaint_letter_local": "PROFESSIONAL COMPLAINT BODY ONLY in USER'S INPUT LANGUAGE",
  "complaint_letter_english": "PROFESSIONAL COMPLAINT BODY ONLY in English",
  "chat_response_local": "Full response in USER'S INPUT LANGUAGE",
  "chat_response_english": "Full response in English"
}

COMPLAINT LETTER: OUTPUT ONLY THESE SECTIONS, NO HEADER/FOOTER:

1. EMPLOYMENT DETAILS:
Working since [DATE OF JOINING] as [DESIGNATION] at [ESTABLISHMENT NAME AND ADDRESS]. Monthly salary Rs. _______.

2. GRIEVANCE DETAILS:
[CHRONOLOGICAL FACTUAL DETAILS WITH DATES. NO EMOTIONAL LANGUAGE.]

3. PRAYER / RELIEF REQUESTED:
[LIST SPECIFIC RELIEFS REQUESTED]

Rules:
- Auto-detect the EXACT language the user used in their input
- Provide chat_response_local in THAT EXACT SAME LANGUAGE
- Provide chat_response_english in proper English
- Both responses must be complete, not partial
- Use ONLY provided legal context
- No extra text, markdown, or backticks
- Keep responses concise
`;

const DEFAULT_LEGAL_CONTEXT = `
- Payment of Wages Act, 1936: Ensures timely payment of wages and prohibits unauthorized deductions.
- Minimum Wages Act, 1948: Sets minimum wage rates for different occupations.
- Factories Act, 1948: Governs health, safety, and welfare of workers in factories.
- Occupational Safety, Health and Working Conditions Code, 2020: Consolidates laws relative to workplace safety.
- Contract Labour (Regulation and Abolition) Act, 1970: Regulates the employment of contract labor.
- Maternity Benefit Act, 1961: Provides for maternity leave and benefits.
- Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act).
`;

export async function processLegalComplaint(context: UserContext): Promise<LegalResponse> {
  const prompt = `
ORIGINAL USER INPUT (VOICE/TEXT): ${context.original_input}
USER LANGUAGE: ${context.user_language}
STATE: ${context.state}
INDUSTRY: ${context.industry}
EMPLOYMENT TYPE: ${context.employment_type}
RETRIEVED LEGAL CONTEXT: ${DEFAULT_LEGAL_CONTEXT}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    const cleanText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\u200B/g, '')
        .replace(/\u00A0/g, ' ')
        .trim();
    };

    return {
      category: result.category || "other",
      legal_summary: cleanText(result.legal_summary || ""),
      laws: Array.isArray(result.laws) ? result.laws.map(cleanText) : [],
      complaint_letter: cleanText(result.complaint_letter || result.complaint_letter_english || ""),
      complaint_letter_local: cleanText(result.complaint_letter_local || ""),
      complaint_letter_english: cleanText(result.complaint_letter_english || ""),
      chat_response: cleanText(result.chat_response || result.chat_response_english || ""),
      chat_response_local: cleanText(result.chat_response_local || ""),
      chat_response_english: cleanText(result.chat_response_english || "")
    } as LegalResponse;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for quota exceeded error
    if (error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("QUOTA_EXCEEDED");
    }

    if (error?.message?.includes('API key not valid')) {
      throw new Error("INVALID_API_KEY");
    }

    const message = error?.message || "Check your internet connection and API key.";
    throw new Error(`Gemini Error: ${message}`);
  }
}
