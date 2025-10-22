interface GitHubResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
}

interface GitHubScanResult {
  results: GitHubResult[];
  queries: number;
  success: number;
  failed: number;
}

// Session cache for repeated domain scans
const scanCache = new Map<string, { data: GitHubScanResult; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Concurrency control
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;

export const optimizedGithubScanner = async (domain: string, token: string): Promise<GitHubScanResult> => {
  // Check cache first
  const cacheKey = `${domain}-${token.slice(-8)}`;
  const cached = scanCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('Using cached GitHub scan results');
    return cached.data;
  }

  const results: GitHubResult[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;

  // AI-prioritized search patterns - high-value files first
  const prioritizedQueries = [
    // Critical files first
    `"${domain}" filename:.env`,
    `"${domain}" filename:config.json`,
    `"${domain}" filename:database.yml`,
    `"${domain}" "private_key" OR "secret_key"`,
    `"${domain}" "aws_access_key" OR "aws_secret"`,
    
    // High-value credentials
    `"${domain}" "password" -test -example`,
    `"${domain}" "api_key" -test -example`,
    `"${domain}" "token" -test -example`,
    
    // Configuration files
    `"${domain}" filename:secrets.json`,
    `"${domain}" filename:.config extension:yaml`,
    `"${domain}" "mongodb://" OR "mysql://" OR "postgres://"`
  ];

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': `HACRF-Scanner-${Math.random().toString(36).substring(7)}`
  };

  // Randomized delays to mimic human behavior
  const getRandomDelay = () => Math.random() * 2000 + 1500; // 1.5-3.5 seconds

  // Process queries with concurrency control
  for (const query of prioritizedQueries) {
    // Wait if too many concurrent requests
    while (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    activeRequests++;
    queries++;
    
    try {
      const codeResponse = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=8&sort=indexed`,
        { headers }
      );

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        success++;

        for (const item of codeData.items || []) {
          // Skip empty or irrelevant results
          const snippet = item.text_matches?.[0]?.fragment || 'Content found in repository';
          if (snippet.length < 10 || snippet.includes('example') || snippet.includes('test')) {
            continue;
          }

          let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
          let recommendation = 'Review this finding for potential security implications.';

          const lowerSnippet = snippet.toLowerCase();
          const fileName = item.name?.toLowerCase() || '';

          // Enhanced severity detection
          if (fileName.includes('.env') || fileName.includes('secret') || 
              lowerSnippet.includes('private_key') || lowerSnippet.includes('secret_key')) {
            severity = 'Critical';
            recommendation = 'URGENT: Environment file or private key exposed publicly. Rotate credentials immediately and remove from repository.';
          } else if (lowerSnippet.includes('password') && !lowerSnippet.includes('password_hash')) {
            severity = 'Critical';
            recommendation = 'CRITICAL: Plain text password detected. Remove immediately and implement secure credential management.';
          } else if (lowerSnippet.includes('api_key') || lowerSnippet.includes('access_key')) {
            severity = 'High';
            recommendation = 'High priority: API keys exposed in public repository. Rotate keys and use environment variables.';
          } else if (lowerSnippet.includes('token') && !lowerSnippet.includes('{{')) {
            severity = 'High';
            recommendation = 'High priority: Authentication token may be exposed. Verify and rotate if necessary.';
          } else if (lowerSnippet.includes('database') || lowerSnippet.includes('connection')) {
            severity = 'Medium';
            recommendation = 'Medium priority: Database configuration exposed. Ensure connection strings don\'t contain credentials.';
          }

          results.push({
            source: 'GitHub (Optimized)',
            url: item.html_url,
            snippet,
            severity,
            recommendation
          });
        }
      } else if (codeResponse.status === 403) {
        console.warn('GitHub API rate limit reached');
        failed++;
        break;
      } else if (codeResponse.status === 422) {
        // Invalid query - continue with next
        failed++;
        continue;
      } else {
        failed++;
      }

      // Human-like randomized delay
      await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

    } catch (error) {
      console.error('Optimized GitHub search error:', error);
      failed++;
    } finally {
      activeRequests--;
    }
  }

  // Additional issue search with lower priority
  if (success > 0 && queries < 10) {
    try {
      activeRequests++;
      queries++;
      
      const issuesResponse = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(`"${domain}" in:title,body type:issue`)}&per_page=3`,
        { headers }
      );

      if (issuesResponse.ok) {
        const issuesData = await issuesResponse.json();
        success++;

        for (const issue of issuesData.items || []) {
          if (issue.body && issue.body.toLowerCase().includes(domain.toLowerCase()) && 
              issue.body.length > 50) {
            results.push({
              source: 'GitHub Issues',
              url: issue.html_url,
              snippet: issue.title + ': ' + (issue.body.substring(0, 200) + '...'),
              severity: 'Low',
              recommendation: 'Review public issue for sensitive information disclosure or security discussion.'
            });
          }
        }
      } else {
        failed++;
      }
    } catch (error) {
      console.error('GitHub issues search error:', error);
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