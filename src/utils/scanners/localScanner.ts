// Fallback scanner for demo purposes when API keys are not provided
interface LocalResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
}

interface LocalScanResult {
  results: LocalResult[];
  queries: number;
  success: number;
  failed: number;
}

export const localScanner = async (domain: string): Promise<LocalScanResult> => {
  // Simulate scan delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  const demoResults: LocalResult[] = [
    {
      source: 'Demo - GitHub',
      url: `https://github.com/example/repo/blob/main/config.js`,
      snippet: `// Configuration for ${domain}\nconst config = {\n  apiKey: "demo_key_****",\n  dbPassword: "hidden_for_demo"\n};`,
      severity: 'High',
      recommendation: 'Demo finding: API keys should be stored in environment variables, not in source code.'
    },
    {
      source: 'Demo - Google Search',
      url: `https://example.com/admin/phpinfo.php`,
      snippet: `PHP Version information for ${domain} - Server configuration exposed`,
      severity: 'Medium',
      recommendation: 'Demo finding: Remove or restrict access to server information pages.'
    },
    {
      source: 'Demo - Security Check',
      url: `https://${domain}/backup/database.sql`,
      snippet: `Database backup file potentially accessible at ${domain}`,
      severity: 'Critical',
      recommendation: 'Demo finding: Database backups should never be publicly accessible.'
    },
    {
      source: 'Demo - Configuration',
      url: `https://${domain}/.env`,
      snippet: `Environment configuration file found for ${domain}`,
      severity: 'High',
      recommendation: 'Demo finding: Environment files containing secrets should not be web-accessible.'
    }
  ];

  return {
    results: demoResults,
    queries: 4,
    success: 4,
    failed: 0
  };
};