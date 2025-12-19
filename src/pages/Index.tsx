import React, { useState, useEffect, useRef } from 'react';
import { Shield, Search, Settings, MessageSquare, FileDown, Github, Globe, Brain, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { CaptchaComponent, CaptchaHandle } from '@/components/scanner/CaptchaComponent';
import { ApiConfigModal } from '@/components/scanner/ApiConfigModal';
import { ScanResults } from '@/components/scanner/ScanResults';
import { ExportPanel } from '@/components/scanner/ExportPanel';
import { AiAssistant } from '@/components/scanner/AiAssistant';
import { FloatingAiButton } from '@/components/scanner/FloatingAiButton';
import { AiAssistantSidebar } from '@/components/scanner/AiAssistantSidebar';
import { SecurityGuidelinesModal } from '@/components/scanner/SecurityGuidelinesModal';
import { SecurityTipsCard } from '@/components/scanner/SecurityTipsCard';
import { UserAgreementModal } from '@/components/scanner/UserAgreementModal';
import { AboutModal } from '@/components/scanner/AboutModal';
import { HelpPanel } from '@/components/scanner/HelpPanel';
import { RadarProgressIndicator, ScanStep } from '@/components/scanner/RadarProgressIndicator';
import { performScan } from '@/utils/api/scanner';
import { performEnhancedScan } from '@/utils/ai/enhancedScanner';

export interface ScanResult {
  source: string;
  url: string;
  snippet: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical' | 'Informational';
  recommendation: string;
  sourcePayload?: string;
}

export interface ScanMetadata {
  domain: string;
  timestamp: string;
  scanDuration: number;
  queries: number;
  success: number;
  failed: number;
  aiEnhanced?: boolean;
  validatedFindings?: number;
  scanMode?: 'LIVE' | 'DEMO';
  modeDisclaimer?: string;
  validKeys?: string[];
  invalidKeys?: string[];
  payloadsUsed?: string[];
  payloadCount?: number;
  githubQueries?: number;
  googleQueries?: number;
}

const Index = () => {
  const [domain, setDomain] = useState('');
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [showAiAssistant, setShowAiAssistant] = useState(false);
  const [showSecurityGuidelines, setShowSecurityGuidelines] = useState(false);
  const [showUserAgreement, setShowUserAgreement] = useState(() => !localStorage.getItem('privacyAccepted'));
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [apiKeyWarning, setApiKeyWarning] = useState<string | null>(null);
  
  const captchaRef = useRef<CaptchaHandle>(null);
  
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanMetadata, setScanMetadata] = useState<ScanMetadata | null>(null);
  const [apiKeys, setApiKeys] = useState({
    github: '',
    google: '',
    googleCx: '',
    aiApiKey: ''
  });

  // Scan progress state
  const [scanSteps, setScanSteps] = useState<ScanStep[]>([
    {
      id: 'initialization',
      name: 'Initializing Scan',
      description: 'Preparing security analysis for your domain',
      icon: <Shield className="h-5 w-5 text-primary" />,
      status: 'pending'
    },
    {
      id: 'github',
      name: 'GitHub Code Search',
      description: 'Scanning GitHub repositories for exposed credentials and configs',
      icon: <Github className="h-5 w-5 text-primary" />,
      status: 'pending'
    },
    {
      id: 'google',
      name: 'Google Dorking',
      description: 'Searching Google for publicly exposed sensitive files',
      icon: <Globe className="h-5 w-5 text-primary" />,
      status: 'pending'
    },
    {
      id: 'ai-analysis',
      name: 'AI Validation',
      description: 'Using AI to validate and prioritize security findings',
      icon: <Brain className="h-5 w-5 text-primary" />,
      status: 'pending'
    }
  ]);
  const [overallProgress, setOverallProgress] = useState(0);

  // User Agreement handled via lazy init state above; no effect needed

  const handleAcceptAgreement = () => {
    localStorage.setItem('privacyAccepted', 'true');
    setShowUserAgreement(false);
  };

  const handleDeclineAgreement = () => {
    window.location.href = 'about:blank';
  };

  const validateDomain = (domain: string): boolean => {
    const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  };

  const updateScanStep = (stepId: string, updates: Partial<ScanStep>) => {
    setScanSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  const resetScanSteps = () => {
    setScanSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));
    setOverallProgress(0);
  };

  const handleScan = async () => {
    if (!captchaSolved) {
      toast({
        title: "CAPTCHA Required",
        description: "Please solve the CAPTCHA before scanning.",
        variant: "destructive"
      });
      return;
    }

    if (!validateDomain(domain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain (e.g., example.com or https://example.com)",
        variant: "destructive"
      });
      return;
    }

    setIsScanning(true);
    setScanResults([]);
    setScanMetadata(null);
    resetScanSteps();
    
    try {
      const storedApiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      
      // Check if GitHub key is available - this is REQUIRED for real scanning
      if (!storedApiKeys.github || !storedApiKeys.github.trim()) {
        setApiKeyWarning('⚠️ GitHub API key not configured. Scan will use DEMO mode with example findings. To get real findings, add your GitHub API key in Settings.');
        console.warn('[SCAN] GitHub API key missing - falling back to DEMO mode');
      } else {
        setApiKeyWarning(null);
      }
      
      // Progress callback for REAL scanner updates
      const handleScanProgress = (phase: string, progress: number, message: string) => {
        console.log(`[UI] Progress: ${phase} - ${progress}% - ${message}`);
        
        // Map scanner phases to UI steps
        const phaseMap: { [key: string]: string } = {
          'initialization': 'initialization',
          'github': 'github',
          'google': 'google',
          'ai-analysis': 'ai-analysis',
          'demo': 'demo'
        };
        
        const uiPhase = phaseMap[phase] || phase;
        
        updateScanStep(uiPhase, { 
          status: progress === 100 ? 'completed' : 'active',
          progress: progress,
          details: message
        });
        
        // Calculate overall progress based on phase
        const phaseWeights: { [key: string]: [number, number] } = {
          'initialization': [0, 15],
          'github': [15, 40],
          'google': [40, 70],
          'ai-analysis': [70, 95],
          'demo': [15, 95]
        };
        
        const [minProgress, maxProgress] = phaseWeights[phase] || [progress, progress];
        const phaseOverallProgress = minProgress + ((maxProgress - minProgress) * progress) / 100;
        setOverallProgress(phaseOverallProgress);
      };
      
      // Use enhanced scanner if AI API key is available, otherwise fallback to standard scanner
      const scanFunction = storedApiKeys.aiApiKey ? performEnhancedScan : performScan;
      const result = await scanFunction({ 
        domain, 
        apiKeys: storedApiKeys,
        onProgress: handleScanProgress 
      });
      
      setOverallProgress(100);
      
      if (result.success && result.data) {
        setScanResults(result.data.results);
        setScanMetadata(result.data.metadata);
        
        const metadata = result.data.metadata as ScanMetadata;
        const enhancementMsg = metadata.aiEnhanced 
          ? ` (AI-enhanced with ${metadata.validatedFindings || 0} validated findings)`
          : '';
          
        toast({
          title: "Scan Complete",
          description: `Found ${result.data.results.length} potential security issues${enhancementMsg}`,
        });
      } else {
        toast({
          title: "Scan Failed", 
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
        
        // Mark failed steps
        setScanSteps(prev => prev.map(step => 
          step.status === 'active' ? { ...step, status: 'error' } : step
        ));
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan Failed",
        description: "An unexpected error occurred during scanning", 
        variant: "destructive"
      });
      
      // Mark failed steps
      setScanSteps(prev => prev.map(step => 
        step.status === 'active' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsScanning(false);
      
      // Refresh CAPTCHA after scan completes (success or failure)
      // This ensures the same CAPTCHA token cannot be reused for another scan
      if (captchaRef.current) {
        setTimeout(() => {
          captchaRef.current?.resetCaptcha();
        }, 500);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative">
      {/* User Agreement Modal */}
      <UserAgreementModal
        open={showUserAgreement}
        onAccept={handleAcceptAgreement}
        onDecline={handleDeclineAgreement}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8 transition-all duration-300">
        {/* Modern Header */}
        <div className="text-center space-y-4 md:space-y-6 py-4 md:py-8">
          <div className="flex items-center justify-center space-x-2 md:space-x-4">
            <div className="relative">
              <Shield className="h-8 w-8 md:h-12 md:w-12 text-primary drop-shadow-lg" />
              <div className="absolute inset-0 h-8 w-8 md:h-12 md:w-12 text-primary animate-pulse opacity-50" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                HCARF Scanner
              </h1>
              <div className="h-1 w-20 md:w-24 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full mx-auto mt-1 md:mt-2" />
            </div>
          </div>
          <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-2">
            Advanced AI-powered domain security scanner with real-time threat analysis
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-xs md:text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span>AI Enhanced</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
              <span>Real-time Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse" />
              <span>Professional Reports</span>
            </div>
          </div>
        </div>

        {/* Modern Scanner Card */}
        <Card className="scanner-card backdrop-blur-sm bg-gradient-to-br from-background/80 to-background/60 border-primary/20 shadow-2xl shadow-primary/10">
          <CardHeader className="pb-4 md:pb-6">
            <CardTitle className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Search className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <span className="text-lg md:text-xl">Domain Security Analysis</span>
                  <div className="text-xs md:text-sm text-muted-foreground font-normal">
                    Powered by advanced AI threat detection
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 whitespace-nowrap">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">System Online</span>
              </div>
            </CardTitle>
            <CardDescription className="text-sm md:text-base mt-2">
              Enter a domain to perform comprehensive security scanning across GitHub, Google, and other public sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row gap-2 md:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Input
                    placeholder="Enter domain (e.g., example.com)"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="text-sm md:text-lg h-10 md:h-12 pl-4 pr-12 bg-background/80 border-primary/30 focus:border-primary/50 focus:ring-primary/20 shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    🔍
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiConfig(true)}
                  title="Configure API Keys"
                  className="h-10 w-10 md:h-12 md:w-12 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors flex-shrink-0"
                >
                  <Settings className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHelp(true)}
                  title="Help & Tutorials"
                  className="h-10 w-10 md:h-12 md:w-12 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors flex-shrink-0"
                >
                  <HelpCircle className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAbout(true)}
                  title="About HCARF Scanner"
                  className="h-10 w-10 md:h-12 md:w-12 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors flex-shrink-0"
                >
                  <Globe className="h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-background/50 to-muted/30 rounded-lg p-4 border border-primary/10">
              <CaptchaComponent ref={captchaRef} onSolved={setCaptchaSolved} />
            </div>

            {apiKeyWarning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">{apiKeyWarning}</p>
                    <button 
                      onClick={() => setShowApiConfig(true)}
                      className="text-xs text-amber-600 hover:text-amber-700 underline mt-2"
                    >
                      Configure API Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleScan}
              disabled={!captchaSolved || isScanning || !domain}
              className="w-full scanner-button py-3 md:py-4 text-base md:text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white mr-2 md:mr-3" />
                  <span>Scanning...</span>
                  <div className="ml-2 md:ml-3 flex space-x-1">
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 md:h-5 md:w-5 mr-2 md:mr-3" />
                  <span>Start Security Scan</span>
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Tips - Show when no scan results */}
        {scanResults.length === 0 && !isScanning && (
          <SecurityTipsCard />
        )}

        {/* Scan Progress */}
        <RadarProgressIndicator
          isScanning={isScanning}
          steps={scanSteps}
          overallProgress={overallProgress}
          onRetryStep={(stepId) => {
            console.log('Retry step:', stepId);
            // TODO: Implement retry logic for failed steps
          }}
        />

        {/* Results Section - Directly below scanner */}
        {(scanResults.length > 0 || scanMetadata) && (
          <div className="space-y-6">
            {/* Scan Summary */}
            {scanMetadata && (
              <Card className="border border-primary/20 bg-gradient-to-r from-background via-background to-primary/5">
                <CardContent className="p-4 md:p-6">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 text-center">
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-primary">{scanResults.length}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">Issues Found</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-destructive">
                        {scanResults.filter(r => r.severity === 'Critical').length}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">Critical</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-orange-500">
                        {scanResults.filter(r => r.severity === 'High').length}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">High Risk</div>
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-bold text-green-500">
                        {scanMetadata.scanDuration}ms
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground">Scan Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ScanResults 
                  results={scanResults} 
                  metadata={scanMetadata}
                  onAskAi={(finding) => {
                    // Open AI sidebar with finding question
                    const prompt = `Explain this security finding in detail:\n\nSeverity: ${finding.severity}\nSource: ${finding.source}\nSnippet: ${finding.snippet}\n\nProvide:\n1. What this finding means\n2. Potential security risks\n3. Step-by-step remediation\n4. Business impact`;
                    // Store the prompt for the chat to pick up
                    sessionStorage.setItem('pendingAiQuestion', prompt);
                    window.dispatchEvent(new CustomEvent('askAiAboutFinding'));
                  }}
                />
              </div>
              <div className="space-y-4">
                <ExportPanel results={scanResults} metadata={scanMetadata} />
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <ApiConfigModal
          open={showApiConfig}
          onOpenChange={setShowApiConfig}
          apiKeys={apiKeys}
          onSave={setApiKeys}
        />

        <AiAssistant
          open={showAiAssistant}
          onOpenChange={setShowAiAssistant}
          scanResults={scanResults}
          scanMetadata={scanMetadata}
        />

        <SecurityGuidelinesModal
          open={showSecurityGuidelines}
          onOpenChange={setShowSecurityGuidelines}
        />

        <AboutModal
          isOpen={showAbout}
          onClose={() => setShowAbout(false)}
        />

        <HelpPanel
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
        />
      </div>

      {/* AI Assistant Sidebar */}
      <AiAssistantSidebar
        scanResults={scanResults}
        scanMetadata={scanMetadata}
      />
    </div>
  );
};

export default Index;