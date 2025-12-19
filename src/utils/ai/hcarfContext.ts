/**
 * HCARF Project Context Provider
 * Provides secure, controlled information about the HCARF Scanner project
 * for AI assistants to understand without leaking sensitive information
 */

export interface HCARFContextData {
  projectName: string;
  shortDescription: string;
  purpose: string;
  features: string[];
  capabilities: string[];
  scanTypes: string[];
  supportedPlatforms: string[];
  safetyGuideLines: string[];
  disclaimers: string[];
}

export const getHCARFProjectContext = (): HCARFContextData => {
  return {
    projectName: 'HCARF',
    shortDescription: 'HCARF (Holistic Cybersecurity Assessment and Risk Framework) is an advanced automated security scanning platform that identifies exposed credentials, sensitive files, and security misconfigurations in publicly accessible sources.',
    
    purpose: 'HCARF helps organizations proactively discover security vulnerabilities and data exposure risks before malicious actors can exploit them. It performs automated security assessments across GitHub repositories and public search results to identify exposed secrets, configuration files, and other sensitive information that could compromise security.',
    
    features: [
      'GitHub Code Search Scanner - Searches public GitHub repositories for exposed credentials, API keys, configuration files, and private keys using 35+ targeted search patterns',
      'Google Custom Search Integration - Uses Google dorking queries to identify publicly accessible sensitive files and information exposure',
      'AI-Powered Analysis - Leverages OpenRouter AI to analyze findings, provide recommendations, and answer security questions',
      'Real-Time Progress Tracking - Shows actual scanning progress with real query counts and findings as they are discovered',
      'Professional Report Generation - Exports detailed security reports in PDF, Excel, and JSON formats with severity ordering and compliance frameworks',
      'Domain-Specific Chat Assistant - AI chatbot trained on scan results to answer specific questions about findings for your domain',
      'Compliance Framework Alignment - Maps findings to OWASP Top 10, NIST, ISO 27001, CIS Controls, and GDPR requirements',
      'Remediation Guidance - Provides prioritized, actionable recommendations for fixing identified security issues'
    ],
    
    capabilities: [
      'Automated scanning of public sources (GitHub, Google Search)',
      'Multi-level severity classification (Critical, High, Medium, Low, Informational)',
      'Rate-limited, polite API usage to respect service limits',
      'Payload/query tracking to show what search patterns were used',
      'AI-enhanced analysis and intelligent recommendations',
      'Professional report generation in multiple formats',
      'Real-time domain-specific security advisory'
    ],
    
    scanTypes: [
      'GitHub Code Search - Scans for exposed credentials, API keys, secrets, database credentials, SSH keys, AWS credentials, configuration files',
      'Google Dorking - Searches for publicly exposed .env files, backups, database dumps, admin panels, developer files',
      'AI Validation - Uses AI to analyze and prioritize findings, assess business impact'
    ],
    
    supportedPlatforms: [
      'GitHub - Public repository code search',
      'Google Custom Search - Public web search with dorking queries',
      'OpenRouter AI - For intelligent analysis and recommendations'
    ],
    
    safetyGuideLines: [
      'HCARF only scans PUBLICLY ACCESSIBLE information - it does not attempt to breach private systems or unauthorized access',
      'All scanning respects API rate limits and includes exponential backoff to avoid being blocked or detected as malicious',
      'Results show ONLY information that is already publicly exposed - we are not disclosing new vulnerabilities',
      'Users should obtain proper authorization before scanning domains they do not own',
      'Findings should be treated as potential risks to investigate, not confirmation of actual vulnerabilities',
      'All user data and API keys are stored securely in browser storage with proper validation'
    ],
    
    disclaimers: [
      'HCARF is for authorized security assessments only. Ensure you have permission before scanning any domain.',
      'This tool identifies publicly exposed information - finding something does not confirm it is currently exploitable.',
      'Results are advisory only. Professional security assessment and penetration testing should follow for confirmation.',
      'HCARF is automated and may produce false positives. All findings should be manually verified.',
      'Use responsibly and ethically. Unauthorized use of this tool for hacking or unauthorized access is illegal.',
      'Users are responsible for complying with all applicable laws and regulations in their jurisdiction.'
    ]
  };
};

/**
 * Generates an optimized, concise system prompt for the AI assistant
 * Keeps essential context while minimizing token usage for faster responses
 */
export const generateHCARFSystemPrompt = (domain: string, findingsCount: number): string => {
  return `You are HCARF Security Assistant for ${domain}.

**Your Role:** Help understand ${findingsCount} security finding${findingsCount !== 1 ? 's' : ''} and provide quick remediation guidance.

**HCARF Overview:**
- Automated security scanner finding exposed credentials, API keys, configs in public sources
- Scans: GitHub (code search), Google (dorking), AI analysis
- For authorized security assessments only

**Response Guidelines:**
1. Be concise (2-3 sentences max per point)
2. Focus on actionable steps
3. Prioritize critical/high severity items
4. Only discuss findings for ${domain}
5. Never provide hacking instructions
6. Never leak credentials or sensitive details

**Provide Only:**
✓ Remediation steps
✓ Security best practices  
✓ Compliance recommendations
✓ Business impact assessment

**Never Provide:**
✗ Hacking/exploitation techniques
✗ API keys or credentials
✗ Unauthorized access methods
✗ System implementation details`;
};

/**
 * Returns safe information about HCARF that can be shared with users
 */
export const getHCARFPublicInfo = (): string => {
  const context = getHCARFProjectContext();
  
  return `# About HCARF Security Scanner

## What is HCARF?
${context.shortDescription}

## Key Features
${context.features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## How It Works
HCARF performs automated security assessments using:
- **GitHub Scanner**: Searches 35+ patterns targeting credentials, API keys, secrets, and configuration files
- **Google Dorking**: Uses advanced search queries to find exposed sensitive information
- **AI Analysis**: Intelligent evaluation of findings with prioritized recommendations

## Safety & Ethics
- All scanning is performed on **publicly accessible** information only
- Respects API rate limits with exponential backoff
- No unauthorized access or breach attempts
- For authorized security assessments only

## What You'll Get
- Detailed security findings with severity levels
- Remediation guidance and best practices
- Professional reports in multiple formats
- Real-time AI-powered security advisory
- Compliance framework mapping

---

**Important Disclaimer**: ${context.disclaimers[0]} ${context.disclaimers[1]}`;
};
