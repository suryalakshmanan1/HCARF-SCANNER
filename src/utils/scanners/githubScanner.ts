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

export const githubScanner = async (domain: string, token: string): Promise<GitHubScanResult> => {
  const results: GitHubResult[] = [];
  let queries = 0;
  let success = 0;
  let failed = 0;

  // Common search patterns for security issues
  const searchQueries = [
    `"${domain}" "password"`,
    `"${domain}" "api_key"`,
    `"${domain}" "secret"`,
    `"${domain}" "token"`,
    `"${domain}" "database"`,
    `"${domain}" "credentials"`,
    `"${domain}" filename:.env`,
    `"${domain}" "aws_access_key"`,
    `"${domain}" "private_key"`,
    `"${domain}" "config" extension:json`
  ];

  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HCARF-Scanner'
  };

  for (const query of searchQueries) {
    queries++;
    
    try {
      // Search code
      const codeResponse = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=10`,
        { headers }
      );

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        success++;

        for (const item of codeData.items || []) {
          // Detect severity based on content patterns
          let severity: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
          let recommendation = 'Review this finding for potential security implications.';

          const snippet = item.text_matches?.[0]?.fragment || 'Content found in repository';
          const lowerSnippet = snippet.toLowerCase();

          if (lowerSnippet.includes('password') || lowerSnippet.includes('secret') || lowerSnippet.includes('private_key')) {
            severity = 'Critical';
            recommendation = 'URGENT: Remove exposed credentials immediately and rotate them.';
          } else if (lowerSnippet.includes('api_key') || lowerSnippet.includes('token')) {
            severity = 'High';
            recommendation = 'Remove API keys/tokens from code and use environment variables.';
          } else if (lowerSnippet.includes('database') || lowerSnippet.includes('connection')) {
            severity = 'Medium';
            recommendation = 'Ensure database connection strings are not exposed.';
          }

          results.push({
            source: 'GitHub',
            url: item.html_url,
            snippet,
            severity,
            recommendation
          });
        }
      } else if (codeResponse.status === 403) {
        // Rate limit or permission issue
        console.warn('GitHub API rate limit or permission denied');
        failed++;
        break;
      } else {
        failed++;
      }

      // Rate limiting - GitHub API allows 30 requests per minute for search
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('GitHub search error:', error);
      failed++;
    }
  }

  // Search issues and discussions for additional findings
  try {
    queries++;
    const issuesResponse = await fetch(
      `https://api.github.com/search/issues?q=${encodeURIComponent(`"${domain}" in:title,body`)}&per_page=5`,
      { headers }
    );

    if (issuesResponse.ok) {
      const issuesData = await issuesResponse.json();
      success++;

      for (const issue of issuesData.items || []) {
        if (issue.body && issue.body.toLowerCase().includes(domain.toLowerCase())) {
          results.push({
            source: 'GitHub Issues',
            url: issue.html_url,
            snippet: issue.title + ': ' + (issue.body.substring(0, 200) + '...'),
            severity: 'Low',
            recommendation: 'Review public issue for sensitive information disclosure.'
          });
        }
      }
    } else {
      failed++;
    }
  } catch (error) {
    console.error('GitHub issues search error:', error);
    failed++;
  }

  return {
    results,
    queries,
    success,
    failed
  };
};