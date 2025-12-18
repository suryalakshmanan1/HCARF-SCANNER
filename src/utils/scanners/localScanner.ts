/**
 * Demo/Fallback Scanner
 * 
 * Used when API keys are not available or invalid.
 * Provides realistic demonstration findings to help users understand
 * the types of security issues the scanner can detect.
 * 
 * IMPORTANT: These are simulated findings for demonstration only.
 * Results do NOT represent actual scan of the target domain.
 */

interface LocalResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  recommendation: string;
  isDemoMode?: boolean;
}

interface LocalScanResult {
  results: LocalResult[];
  queries: number;
  success: number;
  failed: number;
  isDemoMode: boolean;
}

export const localScanner = async (domain: string): Promise<LocalScanResult> => {
  // Simulate realistic scan delay
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Generate domain-aware demo findings
  const demoResults: LocalResult[] = [
    {
      source: 'Demo Intelligence - GitHub',
      url: `https://github.com/search?q=${domain}&type=code`,
      snippet: `Public GitHub repositories containing references to ${domain} domain. Example: API integration code, webhook configurations, deployment scripts.`,
      severity: 'Informational',
      recommendation: 'Review public repositories mentioning your domain for unintended information disclosure.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - Configuration Analysis',
      url: `https://example.com/.env.backup`,
      snippet: `Example pattern: Environment configuration files (.env, .env.local, .env.production) may be indexed or cached if not properly excluded from public access.`,
      severity: 'High',
      recommendation: 'Ensure configuration files are not web-accessible. Use proper web server directives (.htaccess, nginx config) to block access.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - Database Exposure',
      url: `https://example.com/admin/backup.sql`,
      snippet: `Example pattern: Unprotected database backups or SQL export files accessible via HTTP. This example shows realistic exposure patterns.`,
      severity: 'Critical',
      recommendation: 'CRITICAL: Never expose database backups via web. Use authentication, move to protected storage, or use database-specific backup mechanisms.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - Public Metadata',
      url: `https://search.google.com/search?q=site:${domain}`,
      snippet: `Domain metadata indexed by Google including cached pages, public documentation, and API references.`,
      severity: 'Informational',
      recommendation: 'Regularly audit what information about your domain is publicly available through search engines.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - API Endpoint Discovery',
      url: `https://example.com/api/v1/docs`,
      snippet: `Example pattern: Publicly exposed API documentation or Swagger/OpenAPI specifications revealing endpoint structure and authentication methods.`,
      severity: 'Medium',
      recommendation: 'Restrict API documentation to authenticated users only. Consider moving API docs behind authentication or VPN.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - Security Headers Analysis',
      url: `https://example.com`,
      snippet: `Passive analysis example: Security header configuration (CSP, X-Frame-Options, HSTS). Real scanning would validate actual header presence and values.`,
      severity: 'Informational',
      recommendation: 'Implement security headers: Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - Subdomain Intelligence',
      url: `https://crt.sh/?q=${domain}`,
      snippet: `Example: Certificate transparency logs show issued certificates for ${domain} and subdomains, revealing infrastructure details.`,
      severity: 'Low',
      recommendation: 'Monitor certificate transparency logs for unexpected subdomain registrations. Consider using wildcard certificates.',
      isDemoMode: true
    },
    {
      source: 'Demo Intelligence - No Exposed Secrets (Positive Finding)',
      url: `https://github.com/search?q=${domain} password api_key`,
      snippet: `Positive Finding: No exposed credentials detected in public search results for this demonstration scan.`,
      severity: 'Informational',
      recommendation: 'Continue security best practices: rotate credentials regularly, use environment variables, enable secret scanning in your SCM.',
      isDemoMode: true
    }
  ];

  // Simulate some intelligence gathering
  const queries = 8;
  const success = 8;
  const failed = 0;

  return {
    results: demoResults,
    queries,
    success,
    failed,
    isDemoMode: true
  };
};