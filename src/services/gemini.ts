import { GoogleGenAI, Type } from "@google/genai";
import { UserContext, LegalResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `
You are an AI Legal Assistant for Indian migrant workers.

Respond ONLY with valid JSON:
{
  "category": "wage_theft|unsafe_conditions|harassment|forced_labor|child_labor|discrimination|other",
  "legal_summary": "simple explanation",
  "laws": ["law1", "law2"],
  "complaint_letter": "GOVERNMENT FORMAT LETTER",
  "chat_response": "friendly response in user's language + English"
}

COMPLAINT LETTER MUST BE IN OFFICIAL INDIAN GOVERNMENT FORMAT:
[DATE]

To,
The Labour Commissioner / Factories Inspector,
[REGIONAL LABOUR OFFICE ADDRESS]
[DISTRICT], [STATE]

Subject: Complaint against [EMPLOYER NAME] regarding [SPECIFIC GRIEVANCE]

Respected Sir/Madam,

I, [WORKER FULL NAME], aged ____, residing at [RESIDENTIAL ADDRESS], Mobile No. ________ submit this complaint:

1. EMPLOYMENT DETAILS:
Working since [DATE OF JOINING] as [DESIGNATION] at [ESTABLISHMENT NAME AND ADDRESS]. Monthly salary Rs. _______.

2. GRIEVANCE DETAILS:
[CHRONOLOGICAL FACTUAL DETAILS WITH DATES. NO EMOTIONAL LANGUAGE.]

3. PRAYER / RELIEF REQUESTED:
[LIST SPECIFIC RELIEFS REQUESTED]

I declare all facts are true. Submitting with supporting documents.

Kindly register and take necessary legal action.

Thanking you,

Yours faithfully,
_________________
Signature of Complainant

Enclosures:
1. ID Card / Appointment letter
2. Salary slips / bank statements
3. Copy of complaint to employer

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
    return result as LegalResponse;
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
