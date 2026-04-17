import { UserContext, LegalResponse } from "../types";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL_NAME = "llama-3.1-8b-instant";

const SYSTEM_INSTRUCTION = `
You are a highly specialized AI Legal Assistant with deep expertise in Indian labor and employment laws. You act as a professional lawyer providing accurate, actionable legal guidance specifically for Indian migrant workers.

Your role:
1. Analyze the user's complaint thoroughly with legal precision
2. Identify exact applicable laws and regulations WITH FULL ACT NAMES, SECTIONS, AND SHORT NOTE
3. Generate a proper legal complaint letter
4. Provide response in BOTH USER'S INPUT LANGUAGE AND ENGLISH SEPARATELY

Respond ONLY with valid JSON:
{
  "category": "wage_theft|unsafe_conditions|harassment|forced_labor|child_labor|discrimination|other",
  "legal_summary": "professional legal explanation with specific legal references",
  "laws": [
    "FULL ACT NAME (Section X): Short explanation of what this section provides",
    "SECOND ACT NAME (Section Y): Explanation of how this applies to their case"
  ],
  "complaint_letter_local": "PROFESSIONAL COMPLAINT BODY ONLY in USER'S INPUT LANGUAGE",
  "complaint_letter_english": "PROFESSIONAL COMPLAINT BODY ONLY in English",
  "chat_response_local": "Full response in USER'S INPUT LANGUAGE (the language they spoke/wrote in)",
  "chat_response_english": "Full response in English"
}

COMPLAINT LETTER FORMAT:
1. EMPLOYMENT DETAILS:
Working since [DATE OF JOINING] as [DESIGNATION] at [ESTABLISHMENT NAME AND ADDRESS]. Monthly salary Rs. _______.

2. GRIEVANCE DETAILS:
[CHRONOLOGICAL FACTUAL DETAILS WITH DATES. PROFESSIONAL LEGAL TONE.]

3. APPLICABLE LEGAL PROVISIONS:
[LIST SPECIFIC LAWS AND SECTIONS THAT APPLY WITH EXPLANATIONS]

4. PRAYER / RELIEF REQUESTED:
[LIST SPECIFIC LEGAL RELIEFS SOUGHT WITH CLEAR DEMANDS]

As a specialist lawyer:
- Be precise, professional, and authoritative in your legal analysis
- ALWAYS reference specific sections of applicable Indian labor laws
- For EACH law you mention, include the FULL ACT NAME, SECTION NUMBER, and a SHORT NOTE explaining what it means for their case
- For example: "Payment of Wages Act, 1936 (Section 15): Provides for recovery of unpaid wages and delayed payment compensation"
- Auto-detect the EXACT language the user used in their input
- Provide chat_response_local in THAT EXACT SAME LANGUAGE
- Provide chat_response_english in proper English
- Both responses must be complete, not partial
- Use ONLY the legal context provided
- NO extra text, markdown, or backticks - only valid JSON
`;

const DEFAULT_LEGAL_CONTEXT = `
INDIAN LABOR LAWS REFERENCE:
- Payment of Wages Act, 1936: Sections 3-25 - Timely payment, unauthorized deductions, wage claims
- Minimum Wages Act, 1948: Sections 3-12 - Minimum wage rates, enforcement
- Factories Act, 1948: Sections 7-101 - Health, safety, welfare provisions
- Occupational Safety, Health and Working Conditions Code, 2020: Consolidated workplace safety laws
- Contract Labour (Regulation and Abolition) Act, 1970: Sections 10-35 - Contract worker rights
- Maternity Benefit Act, 1961: Sections 4-27 - Maternity leave and benefits
- Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 (POSH Act): Sections 3-19
- Equal Remuneration Act, 1976: Sections 3-8 - Equal pay for equal work
- Employees' Provident Funds and Miscellaneous Provisions Act, 1952: Social security benefits
- Workmen's Compensation Act, 1923: Compensation for workplace injuries
- Interstate Migrant Workmen Act, 1979: Specific protections for migrant workers
`;

export async function processLegalComplaint(context: UserContext): Promise<LegalResponse> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key is not configured. Please set VITE_GROQ_API_KEY in your .env file.");
  }

  const prompt = `
ORIGINAL USER INPUT: ${context.original_input}
USER LANGUAGE: ${context.user_language}
STATE: ${context.state}
INDUSTRY: ${context.industry}
EMPLOYMENT TYPE: ${context.employment_type}
LEGAL CONTEXT: ${DEFAULT_LEGAL_CONTEXT}

Respond ONLY with valid JSON matching the schema. No other text. Be a professional lawyer.
`;

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1024,
        top_p: 0.9,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq error response:", errorText);
      
      if (response.status === 401) {
        throw new Error("INVALID_API_KEY");
      } else if (response.status === 429) {
        throw new Error("QUOTA_EXCEEDED");
      }
      
      throw new Error(`Groq request failed: ${response.status}`);
    }

    const data = await response.json();
    let responseText = data.choices[0].message.content.trim();
    
    // Remove any markdown code block wrappers
    responseText = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    responseText = responseText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Extract JSON if wrapped in extra text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("JSON parse failed. Raw response:", responseText);
      return {
        category: "other",
        legal_summary: "Your complaint has been received. Our legal team is analyzing your case.",
        laws: [],
        complaint_letter: "",
        chat_response: "I understand your issue. As your legal advisor, I am processing your complaint and will provide you with comprehensive legal guidance shortly."
      };
    }
    
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
    console.error("Groq API Error:", error);
    
    if (error.message === "INVALID_API_KEY" || error.message === "QUOTA_EXCEEDED") {
      throw error;
    }
    
    throw new Error(`Groq Error: ${error.message || "Failed to process request"}`);
  }
}

// Health check for Groq API
export async function checkGroqHealth(): Promise<boolean> {
  try {
    if (!GROQ_API_KEY) return false;
    
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
