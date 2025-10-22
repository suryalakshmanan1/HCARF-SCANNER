import { githubScanner } from '@/utils/scanners/githubScanner';
import { googleScanner } from '@/utils/scanners/googleScanner';
import { localScanner } from '@/utils/scanners/localScanner';
import { aiEnrichment } from '@/utils/ai/aiScan';

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

export const performScan = async ({ domain, apiKeys }: ScanRequest) => {
  try {
    // Validate input
    if (!domain) {
      return { success: false, error: 'Domain is required' };
    }

    // Validate API keys if provided
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
    };

    // Check if API keys are provided - if not, use local fallback
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

    // Validate provided API keys
    try {
      await validateApiKeys();
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'API key validation failed' 
      };
    }

    // Clean domain
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    const startTime = Date.now();

    // Initialize scan results
    let allResults: any[] = [];
    let totalQueries = 0;
    let successfulQueries = 0;
    let failedQueries = 0;

    try {
      // GitHub scanning
      console.log('Starting GitHub scan for:', cleanDomain);
      const githubResults = await githubScanner(cleanDomain, apiKeys.github);
      allResults = [...allResults, ...githubResults.results];
      totalQueries += githubResults.queries;
      successfulQueries += githubResults.success;
      failedQueries += githubResults.failed;
    } catch (error) {
      console.error('GitHub scan error:', error);
      failedQueries += 1;
    }

    try {
      // Google scanning
      console.log('Starting Google scan for:', cleanDomain);
      const googleResults = await googleScanner(cleanDomain, apiKeys.google, apiKeys.googleCx);
      allResults = [...allResults, ...googleResults.results];
      totalQueries += googleResults.queries;
      successfulQueries += googleResults.success;
      failedQueries += googleResults.failed;
    } catch (error) {
      console.error('Google scan error:', error);
      failedQueries += 1;
    }

    // AI Enrichment
    try {
      console.log('Starting AI enrichment for', allResults.length, 'results');
      const enrichedResults = await aiEnrichment(allResults, cleanDomain);
      allResults = enrichedResults;
    } catch (error) {
      console.error('AI enrichment error:', error);
      // Continue without enrichment
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
        failed: failedQueries
      }
    };

    return { success: true, data: response };
  } catch (error) {
    console.error('Scan error:', error);
    return { 
      success: false, 
      error: 'Scan failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};