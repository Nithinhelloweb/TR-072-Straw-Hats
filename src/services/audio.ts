/**
 * Client-side audio recognition using Transformers.js (Whisper)
 * No backend required, runs entirely in browser
 * 
 * Usage:
 * 1. Initialize once with loadWhisperModel()
 * 2. Use transcribeAudio() with AudioBlob from MediaRecorder
 */

export interface TranscriptionResult {
  text: string;
  language: string;
  confidence: number;
}

// Model config - optimized for Indian languages
const WHISPER_MODEL = "Xenova/whisper-small";
const TARGET_LANGUAGES = ["en", "hi", "bn", "te", "mr", "ta", "ur", "kn", "ml", "or", "pa", "as"];

let pipeline: any = null;
let isLoading = false;

export async function loadWhisperModel(progressCallback?: (progress: number) => void): Promise<boolean> {
  if (pipeline) return true;
  if (isLoading) return false;
  
  isLoading = true;
  
  try {
    // Dynamically import Transformers.js
    const { pipeline: createPipeline, env } = await import('@xenova/transformers');
    
    // Configure for browser
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    pipeline = await createPipeline("automatic-speech-recognition", WHISPER_MODEL, {
      progress_callback: (progress: any) => {
        if (progressCallback && progress.status === 'download') {
          progressCallback(progress.progress || 0);
        }
      }
    });
    
    isLoading = false;
    return true;
  } catch (error) {
    console.error("Failed to load Whisper model:", error);
    isLoading = false;
    return false;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<TranscriptionResult> {
  if (!pipeline) {
    throw new Error("Whisper model not loaded. Call loadWhisperModel() first.");
  }
  
  try {
    const result = await pipeline(audioBlob, {
      language: null, // Auto-detect
      task: "transcribe",
      return_timestamps: false,
    });
    
    return {
      text: result.text.trim(),
      language: result.language || "en",
      confidence: result.confidence || 0.8
    };
  } catch (error) {
    console.error("Transcription error:", error);
    throw new Error("Failed to transcribe audio");
  }
}

export async function translateAudio(audioBlob: Blob, targetLanguage: string = "en"): Promise<TranscriptionResult> {
  if (!pipeline) {
    throw new Error("Whisper model not loaded. Call loadWhisperModel() first.");
  }
  
  try {
    const result = await pipeline(audioBlob, {
      task: "translate",
      language: null,
      target_language: targetLanguage,
      return_timestamps: false,
    });
    
    return {
      text: result.text.trim(),
      language: targetLanguage,
      confidence: result.confidence || 0.7
    };
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate audio");
  }
}

export function isWhisperLoaded(): boolean {
  return pipeline !== null;
}

export function unloadWhisperModel(): void {
  pipeline = null;
  isLoading = false;
}
