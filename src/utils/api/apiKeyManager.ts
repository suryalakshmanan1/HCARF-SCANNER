/**
 * API Key Manager
 * Handles validation and mode detection for HCARF Scanner
 * 
 * Modes:
 * - LIVE MODE: All required API keys present and valid
 * - DEMO MODE: Missing or invalid API keys (shows realistic demo findings)
 */

export interface ApiKeys {
  github: string;
  google: string;
  googleCx: string;
  aiApiKey: string;
}

export interface ApiKeyStatus {
  github: { valid: boolean; error?: string };
  google: { valid: boolean; error?: string };
  googleCx: { valid: boolean; error?: string };
  aiApiKey: { valid: boolean; error?: string };
}

export interface ScanMode {
  mode: 'LIVE' | 'DEMO';
  disclaimer?: string;
  validKeys: string[];
  invalidKeys: string[];
  requiredKeysPresent: boolean;
}

/**
 * Check if an API key string is valid (not empty, not whitespace)
 */
const isKeyValid = (key: string | undefined): boolean => {
  return key !== undefined && key !== null && key.trim().length > 0;
};

/**
 * Validate API keys format and presence - with SILENT mode for initial checks
 */
export const validateApiKeys = async (apiKeys: Partial<ApiKeys>, silent: boolean = false): Promise<ApiKeyStatus> => {
  const status: ApiKeyStatus = {
    github: { valid: false },
    google: { valid: false },
    googleCx: { valid: false },
    aiApiKey: { valid: false }
  };

  // Check GitHub API key
  if (isKeyValid(apiKeys.github)) {
    try {
      const response = await fetch('https://api.github.com/user', {
        headers: { 
          'Authorization': `token ${apiKeys.github}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (response.ok) {
        status.github.valid = true;
        if (!silent) console.log('[API-KEY] GitHub API: ✓ VALID');
      } else if (response.status === 401) {
        status.github.error = 'Unauthorized - Invalid GitHub API key';
        if (!silent) console.warn('[API-KEY] GitHub API: ✗ INVALID (401)');
      } else {
        status.github.error = `GitHub API error: ${response.status}`;
        if (!silent) console.warn('[API-KEY] GitHub API: ✗ ERROR (${response.status})');
      }
    } catch (error) {
      status.github.error = 'Network error validating GitHub API key';
      if (!silent) console.warn('[API-KEY] GitHub API: ✗ NETWORK ERROR');
    }
  } else {
    status.github.error = 'GitHub API key not provided';
    if (!silent) console.log('[API-KEY] GitHub API: NOT PROVIDED');
  }

  // Check Google Custom Search API key
  if (isKeyValid(apiKeys.google) && isKeyValid(apiKeys.googleCx)) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKeys.google}&cx=${apiKeys.googleCx}&q=test&num=1`,
        { headers: { 'Accept': 'application/json' } }
      );
      
      if (response.ok) {
        status.google.valid = true;
        status.googleCx.valid = true;
        if (!silent) console.log('[API-KEY] Google Custom Search: ✓ VALID');
      } else if (response.status === 403) {
        status.google.error = 'Forbidden - Invalid Google API key or quota exceeded';
        status.googleCx.error = 'Forbidden - Invalid Custom Search Engine ID';
        if (!silent) console.warn('[API-KEY] Google Custom Search: ✗ INVALID (403 Forbidden)');
      } else {
        status.google.error = `Google API error: ${response.status}`;
        status.googleCx.error = `Google API error: ${response.status}`;
        if (!silent) console.warn(`[API-KEY] Google Custom Search: ✗ ERROR (${response.status})`);
      }
    } catch (error) {
      status.google.error = 'Network error validating Google API';
      status.googleCx.error = 'Network error validating Google API';
      if (!silent) console.warn('[API-KEY] Google Custom Search: ✗ NETWORK ERROR');
    }
  } else {
    if (!isKeyValid(apiKeys.google)) {
      status.google.error = 'Google API key not provided';
      if (!silent) console.log('[API-KEY] Google API Key: NOT PROVIDED');
    }
    if (!isKeyValid(apiKeys.googleCx)) {
      status.googleCx.error = 'Custom Search Engine ID not provided';
      if (!silent) console.log('[API-KEY] Google Search Engine ID: NOT PROVIDED');
    }
  }

  // Check AI API key (optional, for enhanced features)
  if (isKeyValid(apiKeys.aiApiKey)) {
    status.aiApiKey.valid = true;
    if (!silent) console.log('[API-KEY] OpenRouter AI: ✓ VALID');
  } else {
    status.aiApiKey.error = 'AI API key not provided (optional)';
    if (!silent) console.log('[API-KEY] OpenRouter AI: NOT PROVIDED (optional)');
  }

  return status;
};

/**
 * Determine scan mode based on API key availability
 * 
 * LIVE MODE Requirements:
 * - At least GitHub OR Google API keys must be valid
 * 
 * DEMO MODE:
 * - Used when required keys are missing or invalid
 * - Shows realistic demo findings
 */
export const determineScanMode = (apiKeyStatus: ApiKeyStatus): ScanMode => {
  const validKeys: string[] = [];
  const invalidKeys: string[] = [];

  if (apiKeyStatus.github.valid) {
    validKeys.push('GitHub API');
  } else {
    invalidKeys.push('GitHub API');
  }

  if (apiKeyStatus.google.valid && apiKeyStatus.googleCx.valid) {
    validKeys.push('Google Custom Search');
  } else {
    invalidKeys.push('Google Custom Search');
  }

  if (apiKeyStatus.aiApiKey.valid) {
    validKeys.push('AI API (OpenRouter)');
  }

  // Determine if we have required keys for LIVE mode
  const hasGithub = apiKeyStatus.github.valid;
  const hasGoogle = apiKeyStatus.google.valid && apiKeyStatus.googleCx.valid;
  const requiredKeysPresent = hasGithub || hasGoogle;

  const mode: ScanMode = {
    mode: requiredKeysPresent ? 'LIVE' : 'DEMO',
    validKeys,
    invalidKeys,
    requiredKeysPresent
  };

  if (mode.mode === 'DEMO') {
    mode.disclaimer = `
⚠️ DEMO MODE ACTIVE ⚠️

This scan was performed in DEMO MODE due to missing or invalid API keys.
Results are simulated for demonstration purposes only.

Missing Keys:
${invalidKeys.map(k => `  • ${k}`).join('\n')}

To run LIVE scans with real findings:
1. Add your GitHub Personal Access Token
2. Add your Google Custom Search API key and Engine ID
3. Optionally add OpenRouter AI API key for enhanced analysis

Demo results show realistic examples of what findings look like,
but are NOT from actual scanning of your target domain.
    `.trim();
  }

  return mode;
};

/**
 * Get human-readable status message for API keys
 */
export const getApiKeyStatusMessage = (status: ApiKeyStatus): string => {
  const messages: string[] = [];

  if (status.github.valid) {
    messages.push('✅ GitHub API: Connected');
  } else {
    messages.push(`❌ GitHub API: ${status.github.error}`);
  }

  if (status.google.valid && status.googleCx.valid) {
    messages.push('✅ Google Custom Search: Connected');
  } else {
    messages.push(`❌ Google Custom Search: ${status.google.error || status.googleCx.error}`);
  }

  if (status.aiApiKey.valid) {
    messages.push('✅ AI API (OpenRouter): Connected');
  } else {
    messages.push('ℹ️ AI API: Not configured (optional)');
  }

  return messages.join('\n');
};

/**
 * Check if specific scanner should run in LIVE mode
 */
export const shouldRunScanner = (
  scannerType: 'github' | 'google' | 'ai',
  apiKeyStatus: ApiKeyStatus
): boolean => {
  switch (scannerType) {
    case 'github':
      return apiKeyStatus.github.valid;
    case 'google':
      return apiKeyStatus.google.valid && apiKeyStatus.googleCx.valid;
    case 'ai':
      return apiKeyStatus.aiApiKey.valid;
    default:
      return false;
  }
};
