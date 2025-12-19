import { ScanResult, ScanMetadata } from '@/pages/Index';
import { generateHCARFSystemPrompt } from '@/utils/ai/hcarfContext';

interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

class OpenRouterService {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
  // Use faster, more efficient model for better response time
  private model = 'openai/gpt-3.5-turbo'; // Much faster than Claude

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.makeRequest({
        model: this.model,
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        max_tokens: 5
      });
      const isValid = response.choices && response.choices.length > 0;
      console.log('[OpenRouter] API key validation result:', isValid);
      return isValid;
    } catch (error: any) {
      console.error('[OpenRouter] API key validation failed:', error?.message || error);
      // If 401/403, key is invalid. Other errors might be temporary
      if (error?.message?.includes('401') || error?.message?.includes('403')) {
        return false;
      }
      // Give benefit of doubt for other errors
      return true;
    }
  }

  async generatePayloads(domain: string, existingPayloads: string[]): Promise<string[]> {
    try {
      const prompt = `Generate 5 additional security-focused search payloads for domain "${domain}".
These should look for exposed credentials, API keys, secrets, database connections, etc.
Format each as a search query string. Do not repeat these existing payloads:
${existingPayloads.join('\n')}

Return only the 5 new payload queries, one per line, no explanations.`;

      const response = await this.makeRequest({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a cybersecurity expert generating search payloads for vulnerability scanning. Be precise and focused on real security risks.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const content = response.choices[0]?.message?.content || '';
      return content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .slice(0, 5);
    } catch (error) {
      console.error('AI payload generation failed:', error);
      return [];
    }
  }

  async validateFindings(results: ScanResult[], domain: string): Promise<ScanResult[]> {
    if (results.length === 0) return results;

    try {
      const prompt = `Analyze these security scan results for domain "${domain}". 
For each finding, determine if it's a real security issue or false positive.
Return only the findings that are actual security concerns.

Results to analyze:
${results.map((r, i) => `${i + 1}. ${r.source}: ${r.snippet}`).join('\n')}

For each valid finding, respond with just the number (1, 2, 3, etc.) on separate lines.
If no findings are valid, respond with "NONE".`;

      const response = await this.makeRequest({
        model: this.model,
        messages: [
          { 
            role: 'system', 
            content: 'You are a cybersecurity expert validating security scan results. Only approve findings that represent real security risks like exposed credentials, API keys, database connections, or sensitive configuration data.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0]?.message?.content || '';
      
      if (content.trim() === 'NONE') {
        return [];
      }

      const validIndices = content.split('\n')
        .map(line => parseInt(line.trim()))
        .filter(num => !isNaN(num) && num > 0 && num <= results.length);

      return validIndices.map(idx => results[idx - 1]);
    } catch (error) {
      console.error('AI findings validation failed:', error);
      // Return original results if AI validation fails
      return results;
    }
  }

  async enrichFindings(results: ScanResult[], domain: string): Promise<ScanResult[]> {
    if (results.length === 0) return results;

    try {
      const promises = results.map(async (result, index) => {
        const prompt = `Analyze this security finding for domain "${domain}":

Source: ${result.source}
Finding: ${result.snippet}
Current Severity: ${result.severity}

Provide:
1. A descriptive finding name (10-15 words)
2. Correct severity (Critical/High/Medium/Low)
3. Detailed remediation recommendation
4. Potential business impact

Format as JSON:
{
  "findingName": "...",
  "severity": "...",
  "recommendation": "...",
  "businessImpact": "..."
}`;

        const response = await this.makeRequest({
          model: this.model,
          messages: [
            { 
              role: 'system', 
              content: 'You are a cybersecurity expert analyzing security findings. Provide accurate severity assessments and actionable remediation advice.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 400
        });

        const content = response.choices[0]?.message?.content || '';
        
        try {
          const aiAnalysis = JSON.parse(content);
          return {
            ...result,
            findingName: aiAnalysis.findingName || `Security Finding #${index + 1}`,
            severity: aiAnalysis.severity || result.severity,
            recommendation: aiAnalysis.recommendation || result.recommendation,
            businessImpact: aiAnalysis.businessImpact || 'Potential security risk requiring review'
          };
        } catch (parseError) {
          // If JSON parsing fails, return original result with enhanced info
          return {
            ...result,
            findingName: `Security Finding #${index + 1}`,
            businessImpact: 'Potential security risk requiring review'
          };
        }
      });

      return await Promise.all(promises);
    } catch (error) {
      console.error('AI findings enrichment failed:', error);
      return results.map((result, index) => ({
        ...result,
        findingName: `Security Finding #${index + 1}`,
        businessImpact: 'Potential security risk requiring review'
      }));
    }
  }

  async generateConversationalResponse(
    message: string,
    scanResults: ScanResult[],
    scanMetadata: ScanMetadata | null,
    conversationHistory: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    try {
      const domain = scanMetadata?.domain || 'your domain';
      const resultCount = scanResults.length;
      
      // Generate concise HCARF context for faster processing
      const systemPrompt = generateHCARFSystemPrompt(domain, resultCount);

      // Only use last 3 messages for faster processing (not 6)
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-3).map(m => ({ 
          role: m.role as 'system' | 'user' | 'assistant', 
          content: m.content 
        })),
        { role: 'user' as const, content: message }
      ];

      const response = await this.makeRequest({
        model: this.model,
        messages,
        temperature: 0.6, // Reduced from 0.7 for more focused, faster responses
        max_tokens: 500   // Reduced from 800 to encourage concise responses
      });

      return response.choices[0]?.message?.content || 'I apologize, but I encountered an issue processing your request. Please try again.';
    } catch (error) {
      console.error('AI conversational response failed:', error);
      return 'I apologize, but I\'m having trouble processing your request right now. Please check your AI API key and try again.';
    }
  }

  private async makeRequest(payload: OpenRouterRequest): Promise<OpenRouterResponse> {
    try {
      // Create abort controller with 30-second timeout for faster failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'HCARF Security Scanner'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[OpenRouter] API error ${response.status}:`, errorText);
        const error = new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        (error as any).status = response.status;
        throw error;
      }

      const data = await response.json();
      return data as OpenRouterResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[OpenRouter] Request timeout (30s)');
        throw new Error('Response timeout - please try again');
      }
      console.error('[OpenRouter] Request failed:', error);
      throw error;
    }
  }
}

export { OpenRouterService };