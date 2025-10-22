import { optimizedGithubScanner } from '@/utils/scanners/optimizedGithubScanner';
import { optimizedGoogleScanner } from '@/utils/scanners/optimizedGoogleScanner';
import { localScanner } from '@/utils/scanners/localScanner';
import { OpenRouterService } from '@/utils/ai/openRouterService';

interface ApiKeys {
  github: string;
  google: string;
  googleCx: string;
  aiApiKey: string;
}

interface ScanRequest {
  domain: string;
  apiKeys: ApiKeys;
}

interface EnhancedScanResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  findingName?: string;
  businessImpact?: string;
}

export const performEnhancedScan = async ({ domain, apiKeys }: ScanRequest) => {
  try {
    // Validate input
    if (!domain) {
      return { success: false, error: 'Domain is required' };
    }

    const validateApiKeys = async () => {
      if (apiKeys?.github) {
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: { 'Authorization': `token ${apiKeys.github}` }
          });
          if (!response.ok) throw new Error('Invalid GitHub API key');
        } catch (error) {
          throw new Error('GitHub API key validation failed');
        }
      }

      if (apiKeys?.google && apiKeys?.googleCx) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/customsearch/v1?key=${apiKeys.google}&cx=${apiKeys.googleCx}&q=test&num=1`
          );
          if (!response.ok) throw new Error('Invalid Google API key or Search Engine ID');
        } catch (error) {
          throw new Error('Google API key validation failed');
        }
      }

      if (apiKeys?.aiApiKey) {
        try {
          const aiService = new OpenRouterService(apiKeys.aiApiKey);
          const isValid = await aiService.validateApiKey();
          if (!isValid) throw new Error('Invalid AI API key');
        } catch (error) {
          throw new Error('AI API key validation failed');
        }
      }
    };

    const hasApiKeys = apiKeys?.github || apiKeys?.google;
    
    if (!hasApiKeys) {
      console.log('No API keys provided, using demo scanner');
      const demoResults = await localScanner(domain);
      
      const response = {
        results: demoResults.results,
        metadata: {
          domain: domain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
          timestamp: new Date().toISOString(),
          scanDuration: 2000,
          queries: demoResults.queries,
          success: demoResults.success,
          failed: demoResults.failed
        }
      };
      
      return { success: true, data: response };
    }

    try {
      await validateApiKeys();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key validation failed' 
      };
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const startTime = Date.now();

    let allResults: EnhancedScanResult[] = [];
    let totalQueries = 0;
    let successfulQueries = 0;
    let failedQueries = 0;

    // Initialize AI service for enhanced scanning
    let aiService: OpenRouterService | null = null;
    if (apiKeys?.aiApiKey) {
      aiService = new OpenRouterService(apiKeys.aiApiKey);
    }

    try {
      // Phase 1: Optimized GitHub scanning
      console.log('Starting optimized GitHub scan for:', cleanDomain);
      const githubResults = await optimizedGithubScanner(cleanDomain, apiKeys.github);
      allResults = [...allResults, ...githubResults.results];
      totalQueries += githubResults.queries;
      successfulQueries += githubResults.success;
      failedQueries += githubResults.failed;

      // Phase 2: AI-generated payload scanning (if AI service available)
      if (aiService && allResults.length > 0) {
        console.log('Generating AI payloads for enhanced scanning...');
        const existingPayloads = [
          `"${cleanDomain}" "password"`,
          `"${cleanDomain}" "api_key"`,
          `"${cleanDomain}" "secret"`,
          `"${cleanDomain}" "token"`,
          `"${cleanDomain}" "database"`,
          `"${cleanDomain}" "credentials"`
        ];

        const aiPayloads = await aiService.generatePayloads(cleanDomain, existingPayloads);
        
        // Scan with AI-generated payloads
        for (const payload of aiPayloads.slice(0, 3)) { // Limit to 3 additional payloads
          try {
            totalQueries++;
            const response = await fetch(
              `https://api.github.com/search/code?q=${encodeURIComponent(payload)}&per_page=5`,
              {
                headers: {
                  'Authorization': `token ${apiKeys.github}`,
                  'Accept': 'application/vnd.github.v3+json',
                  'User-Agent': 'HACRF-Scanner'
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              successfulQueries++;

              for (const item of data.items || []) {
                const snippet = item.text_matches?.[0]?.fragment || 'AI-generated payload match';
                allResults.push({
                  source: 'GitHub (AI Enhanced)',
                  url: item.html_url,
                  snippet,
                  severity: 'Medium', // Default, will be enhanced by AI
                  recommendation: 'Review this AI-detected finding for potential security implications.'
                });
              }
            } else {
              failedQueries++;
            }

            await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
          } catch (error) {
            console.error('AI payload scanning error:', error);
            failedQueries++;
          }
        }
      }
    } catch (error) {
      console.error('GitHub scan error:', error);
      failedQueries += 1;
    }

    try {
      // Phase 3: Optimized Google scanning
      console.log('Starting optimized Google scan for:', cleanDomain);
      const googleResults = await optimizedGoogleScanner(cleanDomain, apiKeys.google, apiKeys.googleCx);
      allResults = [...allResults, ...googleResults.results];
      totalQueries += googleResults.queries;
      successfulQueries += googleResults.success;
      failedQueries += googleResults.failed;
    } catch (error) {
      console.error('Google scan error:', error);
      failedQueries += 1;
    }

    // Phase 4: AI Validation and Enrichment
    if (aiService && allResults.length > 0) {
      try {
        console.log('Starting AI validation for', allResults.length, 'results');
        
        // Step 1: Validate findings (filter false positives)
        const validatedResults = await aiService.validateFindings(allResults, cleanDomain);
        console.log(`AI validation: ${validatedResults.length}/${allResults.length} findings confirmed as security issues`);
        
        // Step 2: Enrich validated findings
        const enrichedResults = await aiService.enrichFindings(validatedResults, cleanDomain);
        allResults = enrichedResults;
        
      } catch (error) {
        console.error('AI validation/enrichment error:', error);
        // Continue with original results if AI processing fails
      }
    }

    const scanDuration = Date.now() - startTime;

    const response = {
      results: allResults,
      metadata: {
        domain: cleanDomain,
        timestamp: new Date().toISOString(),
        scanDuration,
        queries: totalQueries,
        success: successfulQueries,
        failed: failedQueries,
        aiEnhanced: !!aiService,
        validatedFindings: allResults.length
      }
    };

    return { success: true, data: response };
  } catch (error) {
    console.error('Enhanced scan error:', error);
    return { 
      success: false, 
      error: 'Enhanced scan failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};