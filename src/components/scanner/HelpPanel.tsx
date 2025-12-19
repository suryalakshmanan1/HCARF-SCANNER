import React, { useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, Copy, Check, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type HelpSection = 'overview' | 'api-selection' | 'github' | 'google' | 'ai' | 'demo' | 'findings' | 'issues';

export const HelpPanel: React.FC<HelpPanelProps> = ({ isOpen, onClose }) => {
  const [currentSection, setCurrentSection] = useState<HelpSection>('overview');

  const renderOverview = () => (
    <div className="space-y-4 pb-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">HCARF Help Center</h2>
        <p className="text-sm text-gray-300">
          Step-by-step guides to configure API keys, understand scan results, and use HCARF effectively.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setCurrentSection('api-selection')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-blue-950 hover:border-blue-500 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔑</span>
            <div>
              <p className="font-semibold text-white">Generate API Keys</p>
              <p className="text-xs text-gray-400">GitHub, Google & AI setup</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentSection('demo')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-purple-950 hover:border-purple-500 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧪</span>
            <div>
              <p className="font-semibold text-white">What is Demo Mode?</p>
              <p className="text-xs text-gray-400">Demo vs Live scanning</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentSection('findings')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-green-950 hover:border-green-500 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-semibold text-white">Understanding Findings</p>
              <p className="text-xs text-gray-400">Severity levels explained</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentSection('issues')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-orange-950 hover:border-orange-500 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold text-white">Common Issues & Fixes</p>
              <p className="text-xs text-gray-400">Troubleshooting</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderApiSelection = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('overview')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">API Keys Setup</h2>
      </div>

      <p className="text-sm text-gray-300 mb-4">
        Select which API key you want to learn about:
      </p>

      <div className="space-y-3">
        <button
          onClick={() => setCurrentSection('github')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-gray-800 hover:border-gray-400 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐙</span>
            <div>
              <p className="font-semibold text-white">GitHub API Key</p>
              <p className="text-xs text-gray-400">Scan repositories for credentials</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentSection('google')}
          className="w-full text-left p-4 border border-orange-600 rounded-lg hover:bg-orange-950 hover:border-orange-400 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <p className="font-semibold text-white flex items-center gap-2">
                Google Search API
                <Badge variant="destructive" className="text-xs">Most Important</Badge>
              </p>
              <p className="text-xs text-gray-400">Google dorking for exposed files</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setCurrentSection('ai')}
          className="w-full text-left p-4 border border-gray-600 rounded-lg hover:bg-gray-800 hover:border-gray-400 transition-colors bg-gray-900"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🤖</span>
            <div>
              <p className="font-semibold text-white">AI API Key</p>
              <p className="text-xs text-gray-400">Optional - AI analysis & chat</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  const renderGithub = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('api-selection')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">🐙 GitHub API Key</h2>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">What is this used for?</h4>
        <p className="text-sm text-gray-300">
          Scans public GitHub repositories, commits, gists, and issues for exposed credentials and domain references.
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-3">How to generate:</h4>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">1.</span>
            <span>Go to GitHub → Settings</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">2.</span>
            <span>Open Developer Settings</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">3.</span>
            <span>Click Personal Access Tokens</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">4.</span>
            <span>Generate a new token</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">5.</span>
            <span>Select scope: <Badge className="ml-1 bg-blue-600">public_repo</Badge></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">6.</span>
            <span>Copy the token</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">7.</span>
            <span>Go back to HCARF and paste in Settings</span>
          </li>
        </ol>
      </div>

      <div className="bg-red-950/30 border border-red-600/50 rounded p-4">
        <h4 className="font-semibold text-red-300 mb-2">⚠️ Common Mistakes</h4>
        <ul className="space-y-1 text-xs text-red-200">
          <li>❌ Using expired tokens</li>
          <li>❌ Not selecting public_repo scope</li>
          <li>❌ Forgetting to save the token</li>
        </ul>
      </div>
    </div>
  );

  const renderGoogle = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('api-selection')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">🔍 Google Search API</h2>
      </div>

      <div className="bg-orange-950/40 border border-orange-600/50 rounded p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-orange-200">
            <p className="font-semibold">⚠️ Google requires 2-Step Verification (MFA)</p>
            <p className="mt-1">This is mandatory, not an error.</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Why this API is needed</h4>
        <p className="text-sm text-gray-300">
          Used for Google dorking to find publicly indexed sensitive files, backups, logs, configuration files, and exposed endpoints.
        </p>
      </div>

      <div className="border-l-4 border-blue-500 pl-4 py-2">
        <h4 className="font-semibold text-white mb-3">Step A: Get Google API Key</h4>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">1.</span>
            <span>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Google Cloud Console</a></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">2.</span>
            <span>Create a new project</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">3.</span>
            <span>Enable <strong>Custom Search API</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">4.</span>
            <span>Go to Credentials → Create API Key</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-blue-400 min-w-fit">5.</span>
            <span>Copy key starting with <code className="bg-gray-800 px-2 py-1 rounded text-xs text-green-400">AIzaSy...</code></span>
          </li>
        </ol>
      </div>

      <div className="bg-yellow-950/40 border border-yellow-600/50 rounded p-4">
        <p className="text-sm text-yellow-200 font-semibold mb-2">⚠️ IMPORTANT:</p>
        <p className="text-sm text-yellow-100 mb-2">Google shows HTML embed code by default.</p>
        <p className="text-sm text-yellow-100"><strong>You do NOT need the HTML code!</strong></p>
        <p className="text-sm text-yellow-100 mt-2">HCARF only needs the <strong>Search Engine ID (cx)</strong></p>
      </div>

      <div className="border-l-4 border-green-500 pl-4 py-2">
        <h4 className="font-semibold text-white mb-3">Step B: Get Search Engine ID (cx)</h4>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">1.</span>
            <span>Go to <a href="https://programmablesearchengine.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Programmable Search Engine</a></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">2.</span>
            <span>Create new search engine</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">3.</span>
            <span>Enable: <Badge className="ml-1 bg-green-600">Search the entire web ✅</Badge></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">4.</span>
            <span><strong className="text-yellow-300">IGNORE HTML code shown</strong></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">5.</span>
            <span>Go to Setup → Basics</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-green-400 min-w-fit">6.</span>
            <span>Copy <strong>Search engine ID (cx)</strong></span>
          </li>
        </ol>
        <div className="bg-gray-800 p-3 rounded mt-3 text-xs text-green-300 font-mono">
          Example: 012345678901234567890:abcDEFghiJK
        </div>
      </div>

      <div className="bg-red-950/30 border border-red-600/50 rounded p-4">
        <h4 className="font-semibold text-red-300 mb-2">❌ Common Problems</h4>
        <ul className="space-y-1 text-xs text-red-200">
          <li>• Using HTML code instead of cx value</li>
          <li>• "Search entire web" option is OFF</li>
          <li>• 2-Step Verification not enabled on Google account</li>
        </ul>
      </div>
    </div>
  );

  const renderAi = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('api-selection')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">🤖 AI API Key</h2>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Without AI API Key:</h4>
        <p className="text-sm text-gray-300">
          HCARF will still scan, but AI features are limited (no explanations, validation, or remediation suggestions).
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">With AI API Key:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>✅ AI validates findings and reduces false positives</li>
          <li>✅ Explains risks in plain English</li>
          <li>✅ Generates fixes & compliance mapping</li>
          <li>✅ Interactive chat support for findings</li>
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-3">How to generate:</h4>
        <ol className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400 min-w-fit">1.</span>
            <span>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenRouter.ai</a></span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400 min-w-fit">2.</span>
            <span>Sign up or log in</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400 min-w-fit">3.</span>
            <span>Go to API Keys section</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400 min-w-fit">4.</span>
            <span>Create new API key</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-purple-400 min-w-fit">5.</span>
            <span>Copy and paste in HCARF Settings</span>
          </li>
        </ol>
      </div>

      <div className="bg-blue-950/40 border border-blue-600/50 rounded p-4">
        <p className="text-sm text-blue-200">
          💡 <strong>Tip:</strong> OpenRouter offers free trial credits. Test HCARF before committing to a budget.
        </p>
      </div>
    </div>
  );

  const renderDemo = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('overview')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">Demo Mode Explained</h2>
      </div>

      <div className="bg-blue-950/50 border border-blue-600/50 rounded p-4">
        <div className="flex gap-2">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-200">
            <strong>Demo Mode</strong> activates when API keys are missing or invalid. Shows realistic results without real API calls.
          </p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white text-lg mb-3">✅ What Demo Mode does</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white">Shows realistic scan flow</strong></span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white">Displays findings</strong> - Realistic security findings</span>
          </li>
          <li className="flex gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span><strong className="text-white">Demonstrates capabilities</strong> - See all features</span>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-white text-lg mb-3">❌ What Demo Mode does NOT do</h3>
        <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2">
            <span className="text-red-400 font-bold">✕</span>
            <span><strong className="text-white">No real API calls</strong> - Results are pre-generated</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-bold">✕</span>
            <span><strong className="text-white">No real-time data</strong> - Uses example data</span>
          </li>
          <li className="flex gap-2">
            <span className="text-red-400 font-bold">✕</span>
            <span><strong className="text-white">Not domain-specific</strong> - Generic findings</span>
          </li>
        </ul>
      </div>

      <div className="bg-green-950/40 border border-green-600/50 rounded p-4">
        <h4 className="font-semibold text-green-300 mb-3">Switch to Live Mode:</h4>
        <ol className="space-y-2 text-sm text-green-200">
          <li>1. Click ⚙️ Settings button</li>
          <li>2. Add valid API keys (see "Generate API Keys")</li>
          <li>3. Click Validate for each key</li>
          <li>4. Run a new scan</li>
        </ol>
      </div>
    </div>
  );

  const renderFindings = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('overview')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">Understanding Findings</h2>
      </div>

      <div className="space-y-2">
        <div className="flex gap-3 p-3 bg-red-950/40 border border-red-600/50 rounded">
          <span className="text-2xl">🔴</span>
          <div className="flex-1">
            <p className="font-semibold text-red-300">Critical</p>
            <p className="text-xs text-red-200">Immediate risk - Fix within 24-48 hours</p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-orange-950/40 border border-orange-600/50 rounded">
          <span className="text-2xl">🟠</span>
          <div className="flex-1">
            <p className="font-semibold text-orange-300">High</p>
            <p className="text-xs text-orange-200">Sensitive exposure - Fix within 1-2 weeks</p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-yellow-950/40 border border-yellow-600/50 rounded">
          <span className="text-2xl">🟡</span>
          <div className="flex-1">
            <p className="font-semibold text-yellow-300">Medium</p>
            <p className="text-xs text-yellow-200">Partial risk - Fix within 1 month</p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-green-950/40 border border-green-600/50 rounded">
          <span className="text-2xl">🟢</span>
          <div className="flex-1">
            <p className="font-semibold text-green-300">Low</p>
            <p className="text-xs text-green-200">Minimal risk - Fix within 3 months</p>
          </div>
        </div>
        <div className="flex gap-3 p-3 bg-blue-950/40 border border-blue-600/50 rounded">
          <span className="text-2xl">🔵</span>
          <div className="flex-1">
            <p className="font-semibold text-blue-300">Informational</p>
            <p className="text-xs text-blue-200">No vulnerability - Visibility only</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-950/40 border border-purple-600/50 rounded p-4">
        <p className="text-sm text-purple-200">
          <strong>ℹ️ Normal:</strong> Even secure domains show informational findings. This is a good sign!
        </p>
      </div>
    </div>
  );

  const renderIssues = () => (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setCurrentSection('overview')}
          className="p-2 hover:bg-gray-800 rounded"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">Troubleshooting</h2>
      </div>

      <div className="space-y-3">
        {[
          {
            issue: "No results found",
            fix: "Normal for secure domains. Verify API keys are working."
          },
          {
            issue: "API Key Invalid",
            fix: "Regenerate the key. Check permissions/scopes."
          },
          {
            issue: "Scan stops midway",
            fix: "Rate limit reached. Wait 5-10 min and retry."
          },
          {
            issue: "HTML response error",
            fix: "Use Programmable Search Engine, not regular Google."
          },
          {
            issue: "Google 'Access blocked'",
            fix: "Enable 2-Step Verification on Google account."
          },
          {
            issue: "CAPTCHA not validating",
            fix: "Refresh page and solve new CAPTCHA."
          },
          {
            issue: "Scanning very slow",
            fix: "Rate limiting active (normal). Be patient."
          },
          {
            issue: "AI features not working",
            fix: "Check/regenerate AI API key."
          }
        ].map((item, idx) => (
          <div key={idx} className="border border-gray-700 rounded p-3 bg-gray-900">
            <p className="font-semibold text-white text-sm mb-1">❌ {item.issue}</p>
            <p className="text-xs text-gray-300">
              <strong className="text-green-300">✓ Fix:</strong> {item.fix}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentSection) {
      case 'api-selection':
        return renderApiSelection();
      case 'github':
        return renderGithub();
      case 'google':
        return renderGoogle();
      case 'ai':
        return renderAi();
      case 'demo':
        return renderDemo();
      case 'findings':
        return renderFindings();
      case 'issues':
        return renderIssues();
      default:
        return renderOverview();
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh] bg-gray-950 border-gray-800">
        <div className="w-full h-full flex flex-col">
          <ScrollArea className="flex-1 w-full">
            <div className="p-6 w-full max-w-2xl">
              {renderContent()}
            </div>
          </ScrollArea>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
