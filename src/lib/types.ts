export type TaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface VideoTaskResponse {
  id: string;
  userPrompt: string;
  status: TaskStatus;
  progress: number;
  originalFileUrl: string;
  resultFileUrl: string | null;
  errorMessage?: string | null;
  statusMessage?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface GenerateResponse {
  success: boolean;
  task?: VideoTaskResponse;
  error?: string;
}

export interface PromptSpark {
  id: string;
  emoji: string;
  label: string;
  prompt: string;
}
