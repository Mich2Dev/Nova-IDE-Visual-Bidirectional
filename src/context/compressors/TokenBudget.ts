export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function truncateToBudget(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + '\n... (truncado por presupuesto de tokens)';
}

export function getTokenBudgetForProvider(): number {
  const provider = import.meta.env.VITE_AI_PROVIDER || 'auto';
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const useGemini = provider === 'gemini' || (provider === 'auto' && !!geminiKey);
  return useGemini ? 28000 : 8000;
}
