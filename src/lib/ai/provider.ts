// AI Provider Abstraction
// Supports multiple AI providers through a unified interface

export interface AIProvider {
  name: string;
  generateResponse(prompt: string, context?: AIContext): Promise<string>;
}

export interface AIContext {
  curriculum?: string;
  class?: string;
  subject?: string;
  topic?: string;
  language?: "en" | "ur";
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

// Mock AI Provider for development/testing
class MockAIProvider implements AIProvider {
  name = "mock";

  async generateResponse(prompt: string, context?: AIContext): Promise<string> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const responses = [
      "That's a great question! Let me explain this concept step by step.",
      "I understand what you're asking. Here's how to approach this problem:",
      "Excellent question! This is a fundamental concept in your curriculum.",
      "Let me break this down into simpler parts for better understanding.",
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    let contextualInfo = "";
    if (context?.subject) {
      contextualInfo = ` In the context of ${context.subject}`;
    }
    if (context?.topic) {
      contextualInfo += `, specifically the topic "${context.topic}"`;
    }

    return `${randomResponse}${contextualInfo}. This is a mock response - configure a real AI provider in your environment variables to get actual AI responses.`;
  }
}

// Factory function to get the appropriate AI provider
export function getAIProvider(): AIProvider {
  const providerType = process.env.AI_PROVIDER || "mock";

  switch (providerType) {
    case "mock":
      return new MockAIProvider();
    // Add other providers here (OpenAI, Anthropic, Google, etc.)
    default:
      console.warn(`Unknown AI provider: ${providerType}, falling back to mock`);
      return new MockAIProvider();
  }
}
