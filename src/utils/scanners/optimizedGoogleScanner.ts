interface GoogleResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
}

interface GoogleScanResult {
  results: GoogleResult[];
  queries: number;
  success: number;
  failed: number;
}

// Session cache for repeated domain scans
const scanCache = new Map<string, { data: GoogleScanResult; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Concurrency control
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 2; // More conservative for Google API

export const optimizedGoogleScanner = async (domain: string, apiKey: string, cx: string): Promise<GoogleScanResult> => {
  // Check cache first
  const cacheKey = `${domain}-${apiKey.slice(-8)}`;
  const cached = scanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached Google scan results');
    return cached.data;
  }

  const results: GoogleResult[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;

  // AI-prioritized security-focused search queries
  const prioritizedQueries = [
    // Critical exposure patterns
    `site:${domain} ("password" OR "secret" OR "private_key") -example -test`,
    `site:${domain} (filetype:env OR filetype:config OR filetype:yml)`,
    `"${domain}" site:pastebin.com OR site:github.com ("api_key" OR "token")`,
    
    // Database and connection strings
    `"${domain}" ("mongodb://" OR "mysql://" OR "postgres://") -documentation`,
    `site:${domain} ("database" OR "connection string") -example`,
    
    // AWS and cloud credentials
    `"${domain}" ("aws_access_key" OR "aws_secret" OR "azure") -documentation`,
    
    // Error messages and debug info
    `site:${domain} ("error" OR "debug" OR "stack trace" OR "exception")`,
    
    // Backup and dump files
    `"${domain}" ("backup" OR "dump") (filetype:sql OR filetype:zip)`,
    
    // Security misconfigurations
    `site:${domain} ("index of" OR "directory listing" OR "phpinfo")`,
    `site:${domain} ("server status" OR "server info" OR "admin panel")`
  ];

  // Human-like search patterns
  const getRandomDelay = () => Math.random() * 1500 + 1000; // 1-2.5 seconds
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
  ];

  for (const query of prioritizedQueries) {
    // Rate limiting - Google has stricter limits
    while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    activeRequests++;
    queries++;
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=8&safe=off`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        success++;

        if (data.items) {
          for (const item of data.items) {
            // Skip irrelevant results
            if (!item.snippet || item.snippet.length < 20) continue;
            
            const content = (item.title + ' ' + item.snippet).toLowerCase();
            const url = item.link.toLowerCase();
            
            // Skip obvious false positives
            if (content.includes('example') || content.includes('documentation') || 
                content.includes('tutorial') || url.includes('stackoverflow.com')) {
              continue;
            }
            
            let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
            let recommendation = 'Review this result for potential security issues.';

            // Enhanced severity analysis
            if (content.includes('password') && !content.includes('password reset')) {
              severity = 'Critical';
              recommendation = 'CRITICAL: Password information found in public search results. Investigate immediately.';
            } else if (content.includes('private key') || content.includes('secret key')) {
              severity = 'Critical';
              recommendation = 'CRITICAL: Private or secret key may be exposed publicly. Immediate investigation required.';
            } else if (content.includes('api key') || content.includes('access key')) {
              severity = 'High';
              recommendation = 'HIGH RISK: API or access keys may be publicly accessible. Verify and rotate keys.';
            } else if (content.includes('token') && !content.includes('csrf token')) {
              severity = 'High';
              recommendation = 'HIGH RISK: Authentication tokens may be exposed. Review and rotate if necessary.';
            } else if (content.includes('.env') || content.includes('config.') || url.includes('.env')) {
              severity = 'High';
              recommendation = 'HIGH RISK: Configuration files may be publicly accessible. Secure immediately.';
            } else if (content.includes('database') || content.includes('mongodb://') || content.includes('mysql://')) {
              severity = 'Medium';
              recommendation = 'MEDIUM RISK: Database information or connection strings may be exposed.';
            } else if (content.includes('backup') || content.includes('.sql') || content.includes('dump')) {
              severity = 'Medium';
              recommendation = 'MEDIUM RISK: Backup or database dump files may be accessible. Secure and review.';
            } else if (content.includes('error') || content.includes('exception') || content.includes('debug')) {
              severity = 'Low';
              recommendation = 'LOW RISK: Error messages or debug information exposed. Review for sensitive data.';
            }

            results.push({
              source: 'Google Search (Optimized)',
              url: item.link,
              snippet: item.snippet,
              severity,
              recommendation
            });
          }
        }
      } else if (response.status === 429) {
        console.warn('Google API rate limit exceeded');
        failed++;
        break; // Stop on rate limit
      } else {
        console.error('Google search failed:', response.status, response.statusText);
        failed++;
      }

      // Human-like delay between requests
      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

    } catch (error) {
      console.error('Optimized Google search error:', error);
      failed++;
    } finally {
      activeRequests--;
    }
  }

  const scanResult = {
    results,
    queries,
    success,
    failed
  };

  // Cache the results
  scanCache.set(cacheKey, { data: scanResult, timestamp: Date.now() });

  // Clean old cache entries
  for (const [key, value] of scanCache) {
    if (Date.now() - value.timestamp > CACHE_DURATION) {
      scanCache.delete(key);
    }
  }

  return scanResult;
};