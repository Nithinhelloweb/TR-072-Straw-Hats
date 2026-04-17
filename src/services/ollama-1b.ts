import { UserContext, LegalResponse } from "../types";

const OLLAMA_BASE_URL = import.meta.env.VITE_OLLAMA_API_URL || "http://localhost:11434/api";
const MODEL_NAME = "llama3.2:1b";

const SYSTEM_INSTRUCTION = `
You are an AI Legal Assistant for Indian migrant workers.

Respond ONLY with valid JSON:
{
  "category": "wage_theft|unsafe_conditions|harassment|forced_labor|child_labor|discrimination|other",
  "legal_summary": "simple explanation",
  "laws": ["law1", "law2"],
  "complaint_letter": "COMPLAINT BODY ONLY",
  "chat_response": "friendly response in user's language + English"
}

COMPLAINT LETTER: OUTPUT ONLY THESE SECTIONS, NO HEADER/FOOTER:

1. EMPLOYMENT DETAILS:
Working since [DATE OF JOINING] as [DESIGNATION] at [ESTABLISHMENT NAME AND ADDRESS]. Monthly salary Rs. _______.

2. GRIEVANCE DETAILS:
[CHRONOLOGICAL FACTUAL DETAILS WITH DATES. NO EMOTIONAL LANGUAGE.]

3. PRAYER / RELIEF REQUESTED:
[LIST SPECIFIC RELIEFS REQUESTED]

Rules:
- Auto-detect language, respond dual language (local + English)
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

Respond ONLY with valid JSON matching the required schema. No other text.
`;

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        system: SYSTEM_INSTRUCTION,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          top_p: 0.95,
          num_ctx: 1024,
          num_predict: 512,
          stop: ["<|endoftext|>", "```", "\n\n\n", "```json", "```"],
          cache_prompt: true,
          low_vram: true,
          mirostat: 2,
          mirostat_tau: 5.0
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama error response:", errorText);
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Clean response - Llama often adds markdown wrappers
    let responseText = data.response.trim();
    
    // Remove any markdown code block wrappers
    responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Extract JSON if wrapped in extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    // Try parsing with fallback
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse failed. Raw response:", responseText);
      // Fallback response if JSON is invalid
      return {
        category: "other",
        legal_summary: "Your complaint has been received. Our system is analyzing your case.",
        laws: [],
        complaint_letter: "",
        chat_response: "I understand your issue. I'm processing your complaint and will provide you with legal guidance shortly."
      };
    }
    
    // Clean all text fields of control characters
    const cleanText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        .replace(/\u200B/g, '')
        .replace(/\u00A0/g, ' ')
        .trim();
    };

    // Validate and set defaults
    return {
      category: result.category || "other",
      legal_summary: cleanText(result.legal_summary || ""),
      laws: Array.isArray(result.laws) ? result.laws.map(cleanText) : [],
      complaint_letter: cleanText(result.complaint_letter || ""),
      chat_response: cleanText(result.chat_response || "")
    } as LegalResponse;
    
  } catch (error: any) {
    console.error("Ollama API Error:", error);
    
    if (error.message?.includes('Failed to fetch')) {
      throw new Error("OLLAMA_NOT_RUNNING");
    }
    
    throw new Error(`Ollama Error: ${error.message || "Failed to process request"}`);
  }
}

// Health check for Ollama
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}
