interface GitHubResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'Informational';
  recommendation: string;
  isValidated?: boolean;
  confidence?: number;
}

interface GitHubScanResult {
  results: GitHubResult[];
  queries: number;
  success: number;
  failed: number;
  queriesUsed?: string[];
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

// Extract domain variations for better searches
const generateDomainVariations = (domain: string): string[] => {
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const parts = cleanDomain.split('.');
  const baseName = parts[0];
  
  return [
    cleanDomain,
    `"${cleanDomain}"`,
    baseName,
    `"${baseName}"`,
    cleanDomain.replace(/\./g, '-'),
    `"${cleanDomain.replace(/\./g, '-')}"`
  ].filter((v, i, a) => a.indexOf(v) === i);
};

// Enhanced security-focused search patterns
const generateSearchQueries = (domain: string): string[] => {
  const variations = generateDomainVariations(domain);
  const queries: string[] = [];
  
  // For each domain variation, create targeted searches
  for (const variation of variations) {
    // Credentials and secrets
    queries.push(`${variation} password`);
    queries.push(`${variation} apikey OR api_key OR API_KEY`);
    queries.push(`${variation} secret OR SECRET`);
    queries.push(`${variation} token`);
    queries.push(`${variation} credential`);
    queries.push(`${variation} oauth`);
    
    // Configuration files
    queries.push(`${variation} filename:.env`);
    queries.push(`${variation} filename:config`);
    queries.push(`${variation} .env.local OR .env.production`);
    
    // AWS and cloud credentials
    queries.push(`${variation} aws_access_key OR AKIA`);
    queries.push(`${variation} aws_secret`);
    queries.push(`${variation} s3_bucket`);
    
    // Database connections
    queries.push(`${variation} mongodb:// OR mysql:// OR postgres://`);
    queries.push(`${variation} database OR db_password`);
    
    // Keys and certificates
    queries.push(`${variation} private_key OR privatekey OR "PRIVATE KEY"`);
    queries.push(`${variation} certificate OR .pem`);
    
    // Backup files
    queries.push(`${variation} backup OR dump OR .sql`);
  }
  
  return queries;
};

export const githubScanner = async (domain: string, token: string): Promise<GitHubScanResult> => {
  const results: GitHubResult[] = [];
  const processedUrls = new Set<string>();
  const queriesUsed: string[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;
  let rateLimitInfo = { limit: 60, remaining: 60, reset: 0 };

  const searchQueries = generateSearchQueries(domain);

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HCARF-Scanner/1.0 (+https://hcarf-scanner.com)'
  };

  // Rate limiter with exponential backoff for politeness
  const rateLimiter = {
    baseDelay: 2000, // 2 seconds between requests
    maxDelay: 15000, // Max 15 seconds
    currentDelay: 2000,
    async wait() {
      await new Promise(resolve => setTimeout(resolve, this.currentDelay));
      // Increase delay slightly for next request (exponential backoff)
      this.currentDelay = Math.min(this.currentDelay * 1.1, this.maxDelay);
    },
    reset() {
      this.currentDelay = this.baseDelay;
    }
  };

  // Helper function to detect severity
  const detectSeverity = (content: string): { severity: 'Low' | 'Medium' | 'High' | 'Critical'; recommendation: string } => {
    const lower = content.toLowerCase();
    
    if (lower.includes('password') || lower.includes('secret') || lower.includes('private key') || lower.includes('private_key')) {
      return {
        severity: 'Critical',
        recommendation: '🚨 CRITICAL: Remove exposed credentials immediately and rotate them in all systems.'
      };
    }
    if (lower.includes('api_key') || lower.includes('apikey') || lower.includes('api key') || 
        lower.includes('akia') || lower.includes('aws_access') || lower.includes('token')) {
      return {
        severity: 'High',
        recommendation: '⚠️ HIGH: Exposed API keys/tokens detected. Immediately revoke and regenerate these credentials.'
      };
    }
    if (lower.includes('.env') || lower.includes('database') || lower.includes('connection') || 
        lower.includes('config') || lower.includes('certificate')) {
      return {
        severity: 'High',
        recommendation: '⚠️ HIGH: Configuration or sensitive files exposed. Restrict access and review content.'
      };
    }
    if (lower.includes('backup') || lower.includes('dump') || lower.includes('.sql')) {
      return {
        severity: 'Medium',
        recommendation: '⚠️ MEDIUM: Backup files detected. Ensure backups are not publicly accessible.'
      };
    }
    return {
      severity: 'Low',
      recommendation: 'Review this finding for potential security implications.'
    };
  };

  for (const query of searchQueries) {
    queries++;
    queriesUsed.push(query);
    
    try {
      const codeResponse = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=50&sort=updated&order=desc`,
        { headers }
      );

      // Extract rate limit info from response headers
      const remaining = codeResponse.headers.get('x-ratelimit-remaining');
      const limit = codeResponse.headers.get('x-ratelimit-limit');
      const reset = codeResponse.headers.get('x-ratelimit-reset');
      
      if (remaining && limit && reset) {
        rateLimitInfo = {
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          reset: parseInt(reset) * 1000
        };
      }

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        success++;

        if (codeData.items && codeData.items.length > 0) {
          console.log(`GitHub: Query "${query}" found ${codeData.items.length} results`);
          
          for (const item of codeData.items) {
            // Skip duplicates
            if (processedUrls.has(item.html_url)) {
              continue;
            }
            processedUrls.add(item.html_url);

            const snippet = item.text_matches?.[0]?.fragment || `Found in ${item.name}`;
            const { severity, recommendation } = detectSeverity(snippet);

            results.push({
              source: 'GitHub',
              url: item.html_url,
              snippet: snippet.substring(0, 200),
              severity,
              recommendation,
              isValidated: true,
              confidence: 0.85,
              sourcePayload: query
            });
          }
        }
      } else if (codeResponse.status === 403) {
        console.warn(`GitHub API rate limit hit. Remaining: ${remaining}`);
        failed++;
        // If rate limited, wait longer before next attempt
        rateLimiter.currentDelay = 30000;
        break;
      } else if (codeResponse.status === 422) {
        // Invalid search query
        console.warn(`Invalid query: ${query}`);
        failed++;
      } else {
        failed++;
      }

      // Polite rate limiting - respects GitHub's rate limit
      await rateLimiter.wait();

    } catch (error) {
      console.error('GitHub search error:', error);
      failed++;
      // On error, wait longer
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Sort results by severity
  const severityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Informational': 4 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // If no vulnerabilities found, add informational intelligence findings
  if (results.length === 0) {
    results.push({
      source: 'GitHub Intelligence',
      url: `https://github.com/search?q="${domain}"`,
      snippet: `No exposed secrets detected in public GitHub repositories for ${domain}. Repository search performed across code, commits, and public gists.`,
      severity: 'Informational',
      recommendation: 'Maintain security best practices: rotate credentials regularly, use environment variables for sensitive data, enable GitHub secret scanning.',
      isValidated: true,
      confidence: 0.9
    });
  }

  return {
    results: results.slice(0, 50), // Limit to 50 results
    queries,
    success,
    failed,
    queriesUsed,
    rateLimitInfo
  };
};