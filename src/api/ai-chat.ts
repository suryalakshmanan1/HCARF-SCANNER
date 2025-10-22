interface AiChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string; }>;
  apiKey: string;
}

interface AiChatResponse {
  success: boolean;
  reply?: string;
  error?: string;
}

export const handleAiChat = async (request: AiChatRequest): Promise<AiChatResponse> => {
  try {
    const { message, conversationHistory = [], apiKey } = request;

    if (!apiKey) {
      return {
        success: false,
        error: 'AI API key is required'
      };
    }

    // Prepare conversation context with enhanced system prompt
    const messages = [
      {
        role: 'system' as const,
        content: `You are the HCARF Security Assistant, an AI-powered cybersecurity expert integrated into the HCARF Scanner platform. Your role is to:

**Primary Functions:**
1. Help users understand security vulnerabilities found during scans
2. Provide clear, actionable remediation advice
3. Answer general cybersecurity questions and best practices
4. Explain security concepts in an accessible way
5. Assist with interpreting scan results and reports
6. Guide users through security improvements

**Conversation Style:**
- Be friendly, professional, and encouraging
- Use clear, jargon-free language when possible
- When technical terms are necessary, explain them briefly
- Provide step-by-step guidance for complex issues
- Build trust by being honest about limitations
- Celebrate security improvements and good practices

**Context Awareness:**
- When scan results are provided in the message, reference them directly
- Prioritize the most critical findings first
- Connect findings to real-world security implications
- Suggest practical next steps based on the scan data

**Ethical Guidelines:**
- Always emphasize ethical and legal use of security tools
- Promote responsible disclosure of vulnerabilities
- Encourage obtaining proper authorization before security testing
- Support defensive security practices

Remember: Your goal is to empower users to improve their security posture while building confidence in their cybersecurity journey.`
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Make request to OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'HCARF Scanner'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error?.message || `API request failed with status ${response.status}`
      };
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (!reply) {
      return {
        success: false,
        error: 'No response received from AI service'
      };
    }

    return {
      success: true,
      reply
    };

  } catch (error) {
    console.error('AI Chat API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
};