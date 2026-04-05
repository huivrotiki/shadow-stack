type TaskType = 'fact' | 'code' | 'reasoning' | 'creative';

export function classifyTask(prompt: string): TaskType {
  if (/```|function|class|def |import |const /.test(prompt)) return 'code';
  if (/почему|объясни|проанализируй|why|explain|analyze/.test(prompt.toLowerCase())) return 'reasoning';
  if (/напиши|придумай|сочини|write|create|generate/.test(prompt.toLowerCase())) return 'creative';
  return 'fact';
}

export const PREFERRED: Record<TaskType, string> = {
  fact: 'gemini-flash',
  code: 'groq-llama-70b',
  reasoning: 'deepseek-free',
  creative: 'gemini-flash',
};
