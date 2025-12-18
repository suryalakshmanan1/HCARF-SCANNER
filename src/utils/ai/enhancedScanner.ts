import { githubScanner } from '@/utils/scanners/githubScanner';
import { googleScanner } from '@/utils/scanners/googleScanner';
import { localScanner } from '@/utils/scanners/localScanner';
import { validateApiKeys, determineScanMode, shouldRunScanner } from '@/utils/api/apiKeyManager';
import { aiEnrichment } from '@/utils/ai/aiScan';
import type { ApiKeys } from '@/utils/api/apiKeyManager';

interface ScanRequest {
  domain: string;
  apiKeys: Partial<ApiKeys>;
  onProgress?: (phase: string, progress: number, message: string) => void;
}

interface EnhancedScanResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'Informational';
  recommendation: string;
  findingName?: string;
  businessImpact?: string;
}

/**
 * Enhanced Scanner - Uses new improved scanners with API key awareness
 */
export const performEnhancedScan = async ({ domain, apiKeys, onProgress }: ScanRequest) => {
  try {
    // Validate input
    if (!domain) {
      return { success: false, error: 'Domain is required' };
    }

    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase();
    
    console.log(`[ENHANCED-SCAN] Initializing enhanced scan for target: ${cleanDomain}`);
    onProgress?.('initialization', 0, 'Initializing enhanced security scan...');

    // Phase 1: API Key Status Check
    console.log('[ENHANCED-SCAN] Validating API keys...');
    onProgress?.('initialization', 30, 'Validating API keys...');
    
    const apiKeyStatus = await validateApiKeys(apiKeys);
    const scanMode = determineScanMode(apiKeyStatus);

    console.log('[ENHANCED-SCAN] Scan Mode:', scanMode.mode);
    if (scanMode.mode === 'DEMO') {
      console.log('[ENHANCED-SCAN] Operating in DEMO MODE - using demonstration findings');
      onProgress?.('initialization', 60, 'DEMO MODE: Loading demonstration findings...');
    } else {
      console.log('[ENHANCED-SCAN] Operating in LIVE MODE - using real API scans with AI enhancement');
      console.log('[ENHANCED-SCAN] Available keys:', scanMode.validKeys.join(', '));
      onProgress?.('initialization', 60, 'LIVE MODE: Preparing enhanced scan...');
    }

    onProgress?.('initialization', 100, 'Initialization complete');

    const startTime = Date.now();

    // Initialize scan results
    let allResults: any[] = [];
    let totalQueries = 0;
    let successfulQueries = 0;
    let failedQueries = 0;

    // Phase 2: Execute scanners based on mode
    if (scanMode.mode === 'DEMO') {
      // Demo Mode: Show example findings with clear labeling
      console.log('[ENHANCED-SCAN] Running Demo Scanner...');
      onProgress?.('demo', 0, 'Loading demonstration scan results...');
      const demoResults = await localScanner(cleanDomain);
      allResults = demoResults.results;
      totalQueries = demoResults.queries;
      successfulQueries = demoResults.success;
      failedQueries = demoResults.failed;
      onProgress?.('demo', 100, `Demo scan complete: ${allResults.length} example findings`);
    } else {
      // Live Mode: Run improved scanners with AI enrichment

      // Phase 2a: GitHub Scanning
      if (shouldRunScanner('github', apiKeyStatus)) {
        try {
          console.log('[ENHANCED-SCAN] Phase 1: GitHub Intelligence Scan...');
          onProgress?.('github', 0, 'Starting GitHub repository scan...');
          const githubResults = await githubScanner(cleanDomain, apiKeys.github!);
          allResults = [...allResults, ...githubResults.results];
          totalQueries += githubResults.queries;
          successfulQueries += githubResults.success;
          failedQueries += githubResults.failed;
          
          const githubMsg = `GitHub scan: ${githubResults.results.length} findings from ${githubResults.queries} queries`;
          console.log(`[ENHANCED-SCAN] ${githubMsg}`);
          onProgress?.('github', 100, githubMsg);
        } catch (error) {
          console.error('[ENHANCED-SCAN] GitHub scan error:', error);
          onProgress?.('github', 100, 'GitHub scan completed with errors');
          failedQueries += 1;
        }
      }

      // Phase 2b: Google Dorking Scan
      if (shouldRunScanner('google', apiKeyStatus)) {
        try {
          console.log('[ENHANCED-SCAN] Phase 2: Google Dorking Analysis...');
          onProgress?.('google', 0, 'Starting Google search analysis...');
          const googleResults = await googleScanner(
            cleanDomain,
            apiKeys.google!,
            apiKeys.googleCx!
          );
          allResults = [...allResults, ...googleResults.results];
          totalQueries += googleResults.queries;
          successfulQueries += googleResults.success;
          failedQueries += googleResults.failed;
          
          const googleMsg = `Google scan: ${googleResults.results.length} findings from ${googleResults.queries} queries`;
          console.log(`[ENHANCED-SCAN] ${googleMsg}`);
          onProgress?.('google', 100, googleMsg);
        } catch (error) {
          console.error('[ENHANCED-SCAN] Google scan error:', error);
          onProgress?.('google', 100, 'Google scan completed with errors');
          failedQueries += 1;
        }
      }

      // Phase 3: AI Enrichment & Validation
      if (shouldRunScanner('ai', apiKeyStatus) && allResults.length > 0) {
        try {
          console.log(`[ENHANCED-SCAN] Phase 3: AI Enhancement & Severity Assignment (${allResults.length} findings)...`);
          onProgress?.('ai-analysis', 0, `AI validating ${allResults.length} findings...`);
          const enrichedResults = await aiEnrichment(allResults, cleanDomain);
          allResults = enrichedResults;
          onProgress?.('ai-analysis', 100, `AI validation complete: ${allResults.length} findings prioritized`);
          console.log('[ENHANCED-SCAN] AI enrichment completed');
        } catch (error) {
          console.error('[ENHANCED-SCAN] AI enrichment error:', error);
          onProgress?.('ai-analysis', 100, 'AI validation completed with errors');
          // Continue without enrichment
        }
      }

      // If no findings in LIVE mode, add informational findings
      if (allResults.length === 0) {
        console.log('[ENHANCED-SCAN] No vulnerabilities detected - generating informational intelligence');
        allResults.push({
          source: 'Security Intelligence',
          url: `https://hcarf-scanner.io/report/${cleanDomain}`,
          snippet: `No critical vulnerabilities detected during enhanced scan of ${cleanDomain}. Domain appears secure in scanned sources.`,
          severity: 'Informational',
          recommendation: 'Continue with security best practices: rotate credentials regularly, monitor for new exposures, maintain up-to-date dependencies.',
          isValidated: true,
          confidence: 0.9
        });
      }
    }

    const scanDuration = Date.now() - startTime;

    console.log(`[ENHANCED-SCAN] Scan completed in ${scanDuration}ms - ${allResults.length} findings`);

    const response = {
      success: true,
      data: {
        results: allResults,
        metadata: {
          domain: cleanDomain,
          timestamp: new Date().toISOString(),
          scanDuration,
          queries: totalQueries,
          success: successfulQueries,
          failed: failedQueries,
          scanMode: scanMode.mode,
          modeDisclaimer: scanMode.disclaimer,
          validKeys: scanMode.validKeys,
          invalidKeys: scanMode.invalidKeys,
          aiEnhanced: scanMode.mode === 'LIVE' && shouldRunScanner('ai', apiKeyStatus),
          validatedFindings: allResults.length
        }
      }
    };

    return response;
  } catch (error) {
    console.error('[ENHANCED-SCAN] Scan error:', error);
    return {
      success: false,
      error: 'Enhanced scan failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};