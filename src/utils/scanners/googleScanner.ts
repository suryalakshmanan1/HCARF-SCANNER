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

export const googleScanner = async (domain: string, apiKey: string, cx: string): Promise<GoogleScanResult> => {
  const results: GoogleResult[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;

  // Security-focused search queries
  const searchQueries = [
    `site:${domain} "password" OR "api key" OR "secret"`,
    `site:${domain} filetype:env OR filetype:config`,
    `site:${domain} "database" OR "connection string"`,
    `site:${domain} "private key" OR "certificate"`,
    `"${domain}" site:pastebin.com OR site:github.com OR site:gitlab.com`,
    `"${domain}" "aws_access_key" OR "aws_secret"`,
    `"${domain}" "mongodb://" OR "mysql://" OR "postgres://"`,
    `"${domain}" "token" OR "credentials" -site:${domain}`,
    `"${domain}" "backup" OR "dump" filetype:sql`,
    `"${domain}" "error" OR "debug" OR "stack trace"`
  ];

  for (const query of searchQueries) {
    queries++;
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        success++;

        if (data.items) {
          for (const item of data.items) {
            // Analyze content for security implications
            let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
            let recommendation = 'Review this result for potential security issues.';

            const content = (item.title + ' ' + item.snippet).toLowerCase();
            
            // Critical findings
            if (content.includes('password') || content.includes('private key') || content.includes('secret key')) {
              severity = 'Critical';
              recommendation = 'CRITICAL: Exposed credentials found in public search results. Immediate action required.';
            }
            // High severity
            else if (content.includes('api key') || content.includes('token') || content.includes('aws_access')) {
              severity = 'High';
              recommendation = 'High risk: API keys or tokens may be exposed publicly.';
            }
            // Medium severity
            else if (content.includes('database') || content.includes('connection') || content.includes('config')) {
              severity = 'Medium';
              recommendation = 'Medium risk: Configuration or database information may be exposed.';
            }
            // Files that could contain sensitive data
            else if (content.includes('.env') || content.includes('backup') || content.includes('.sql')) {
              severity = 'High';
              recommendation = 'High risk: Sensitive files may be publicly accessible.';
            }

            results.push({
              source: 'Google Search',
              url: item.link,
              snippet: item.snippet || item.title,
              severity,
              recommendation
            });
          }
        }
      } else if (response.status === 429) {
        // Rate limit exceeded
        console.warn('Google API rate limit exceeded');
        failed++;
        break;
      } else {
        console.error('Google search failed:', response.status, response.statusText);
        failed++;
      }

      // Rate limiting - Google Custom Search API allows 100 queries per day
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Google search error:', error);
      failed++;
    }
  }

  // Additional searches for common security misconfigurations
  const misconfigQueries = [
    `"${domain}" "index of /" OR "directory listing"`,
    `"${domain}" "server status" OR "server info"`,
    `site:${domain} intitle:"phpinfo()"`,
    `site:${domain} "sql error" OR "mysql error"`,
    `site:${domain} "Warning:" OR "Fatal error:"`,
  ];

  for (const query of misconfigQueries) {
    if (queries >= 15) break; // Limit total queries to avoid rate limits
    
    queries++;
    
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        success++;

        if (data.items) {
          for (const item of data.items) {
            results.push({
              source: 'Google Security Check',
              url: item.link,
              snippet: item.snippet || item.title,
              severity: 'Medium',
              recommendation: 'Potential security misconfiguration detected. Review server configuration.'
            });
          }
        }
      } else {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error('Google misconfiguration search error:', error);
      failed++;
    }
  }

  return {
    results,
    queries,
    success,
    failed
  };
};