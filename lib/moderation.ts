// Moderation stub — replace with a real provider in a fast-follow.
export async function moderatePrompt(prompt: string): Promise<{ blocked: boolean; reason?: string }> {
  void prompt;
  return { blocked: false };
}
