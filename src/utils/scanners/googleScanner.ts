interface GoogleResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  isValidated?: boolean;
  confidence?: number;
}

interface GoogleScanResult {
  results: GoogleResult[];
  queries: number;
  success: number;
  failed: number;
  queriesUsed?: string[];
  rateLimitInfo?: {
    dailyLimit: number;
    queriesRemaining: number;
  };
}

// Generate domain variations for better search coverage
const generateDomainVariations = (domain: string): string[] => {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const parts = cleanDomain.split('.');
  const baseName = parts[0];
  
  return [
    cleanDomain,
    baseName,
    cleanDomain.replace(/\./g, '-'),
    parts.slice(0, -1).join('.')
  ].filter((v, i, a) => a.indexOf(v) === i);
};

// Generate comprehensive dorking queries
const generateDorkingQueries = (domain: string): string[] => {
  const variations = generateDomainVariations(domain);
  const queries: string[] = [];
  
  for (const variation of variations) {
    // Credentials and secrets
    queries.push(`"${variation}" password`);
    queries.push(`"${variation}" api_key OR apikey`);
    queries.push(`"${variation}" secret OR SECRET`);
    queries.push(`"${variation}" token`);
    
    // Configuration files
    queries.push(`"${variation}" .env`);
    queries.push(`"${variation}" .env.local`);
    queries.push(`"${variation}" config.php OR config.js`);
    queries.push(`"${variation}" configuration`);
    
    // AWS and cloud
    queries.push(`"${variation}" AKIA aws_access_key`);
    queries.push(`"${variation}" s3 bucket`);
    
    // Database
    queries.push(`"${variation}" database OR db_password`);
    queries.push(`"${variation}" mongodb:// OR mysql:// OR postgres://`);
    
    // Files
    queries.push(`"${variation}" filetype:sql OR filetype:env`);
    queries.push(`"${variation}" backup OR dump`);
    
    // Developer tools exposed
    queries.push(`"${variation}" phpinfo OR phpMyAdmin`);
    
    // External references
    queries.push(`"${variation}" site:pastebin.com OR site:github.com`);
    queries.push(`"${variation}" site:stackoverflow.com`);
  }
  
  return queries;
};

export const googleScanner = async (domain: string, apiKey: string, cx: string): Promise<GoogleScanResult> => {
  const results: GoogleResult[] = [];
  const processedUrls = new Set<string>();
  const queriesUsed: string[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;
  let queriesRemaining = 100; // Google CSE gives 100 free queries per day

  const searchQueries = generateDorkingQueries(domain);

  // Rate limiter for Google Custom Search (to avoid quota exhaustion)
  const rateLimiter = {
    baseDelay: 1000, // 1 second between requests (Google allows 100/day, ~6 per minute)
    maxDelay: 10000,
    currentDelay: 1000,
    async wait() {
      await new Promise(resolve => setTimeout(resolve, this.currentDelay));
      this.currentDelay = Math.min(this.currentDelay * 1.05, this.maxDelay);
    },
    reset() {
      this.currentDelay = this.baseDelay;
    }
  };

  // Helper function to detect severity
  const detectSeverity = (content: string): { severity: 'Low' | 'Medium' | 'High' | 'Critical'; recommendation: string } => {
    const lower = content.toLowerCase();
    
    if (lower.includes('password') || lower.includes('private key') || lower.includes('secret key')) {
      return {
        severity: 'Critical',
        recommendation: '🚨 CRITICAL: Exposed credentials found in public search results. Immediate action required.'
      };
    }
    if (lower.includes('api key') || lower.includes('token') || lower.includes('aws_access') || lower.includes('akia')) {
      return {
        severity: 'High',
        recommendation: '⚠️ HIGH: API keys or tokens may be exposed publicly. Revoke immediately.'
      };
    }
    if (lower.includes('.env') || lower.includes('backup') || lower.includes('.sql') || 
        lower.includes('phpmyadmin') || lower.includes('phpinfo')) {
      return {
        severity: 'High',
        recommendation: '⚠️ HIGH: Sensitive files or admin panels may be publicly accessible.'
      };
    }
    if (lower.includes('database') || lower.includes('connection') || lower.includes('config')) {
      return {
        severity: 'Medium',
        recommendation: '⚠️ MEDIUM: Configuration or database information may be exposed.'
      };
    }
    return {
      severity: 'Low',
      recommendation: 'Review this result for potential security issues.'
    };
  };

  for (const query of searchQueries) {
    // Stop if we're running low on daily quota
    if (queriesRemaining <= 5) {
      console.warn(`Google API quota running low: ${queriesRemaining} queries remaining`);
      break;
    }

    queries++;
    queriesUsed.push(query);
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        success++;
        queriesRemaining--; // Decrement quota count

        if (data.items && data.items.length > 0) {
          console.log(`Google: Query "${query}" found ${data.items.length} results`);
          
          for (const item of data.items) {
            // Skip duplicates
            if (processedUrls.has(item.link)) {
              continue;
            }
            processedUrls.add(item.link);

            const content = (item.title + ' ' + item.snippet).toLowerCase();
            const { severity, recommendation } = detectSeverity(content);

            results.push({
              source: 'Google Search',
              url: item.link,
              snippet: item.snippet || item.title,
              severity,
              recommendation,
              isValidated: true,
              confidence: 0.75,
              sourcePayload: query
            });
          }
        }
      } else if (response.status === 429) {
        console.warn('Google API rate limit exceeded');
        failed++;
        // Wait longer if rate limited
        await new Promise(resolve => setTimeout(resolve, 30000));
        break;
      } else {
        console.error('Google search failed:', response.status);
        failed++;
      }

      // Polite rate limiting - respect Google's quota
      await rateLimiter.wait();

    } catch (error) {
      console.error('Google search error:', error);
      failed++;
    }
  }

  // Sort results by severity
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Informational': 4 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // If no findings detected, add informational intelligence
  if (results.length === 0) {
    results.push({
      source: 'Google Intelligence',
      url: `https://www.google.com/search?q="${domain}"`,
      snippet: `No critical information exposure detected for ${domain} in Google search results. Domain appears in standard indexed results without sensitive files or credentials exposure.`,
      severity: 'Informational',
      recommendation: 'Continue monitoring: regular Google dorking audits help identify unintended information leakage. Use Google Search Console to manage indexed content.',
      isValidated: true,
      confidence: 0.85
    });
  }

  return {
    results: results.slice(0, 50), // Limit to 50 results
    queries,
    success,
    failed,
    queriesUsed,
    rateLimitInfo: {
      dailyLimit: 100,
      queriesRemaining
    }
  };
};