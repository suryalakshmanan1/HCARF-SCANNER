import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Github, Globe, Zap, Shield, Brain, BarChart3 } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold">About HCARF Scanner</DialogTitle>
          <DialogDescription>Advanced Security Reconnaissance & Forensics</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Mission Section */}
            <div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">Our Mission</h3>
              <p className="text-sm text-gray-700">
                We believe that <span className="font-semibold">early detection of exposed assets prevents breaches</span>. HCARF Scanner combines automated search technology with intelligent analysis to help organizations discover and remediate security risks before attackers do.
              </p>
            </div>

            {/* What is HCARF */}
            <div>
              <h3 className="text-xl font-bold mb-2 text-blue-600">What is HCARF Scanner?</h3>
              <p className="text-sm text-gray-700">
                An advanced security reconnaissance tool designed to identify exposed credentials, sensitive files, and security misconfigurations across GitHub repositories and public web sources. Built with AI-enhanced analysis to transform raw findings into actionable security intelligence.
              </p>
            </div>

            {/* Key Features */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Key Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Intelligent Scanning */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900">Intelligent Scanning</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• 35+ GitHub search patterns</li>
                    <li>• 30+ Google dorking queries</li>
                    <li>• Rate-limited & respectful</li>
                    <li>• Real-time progress tracking</li>
                  </ul>
                </div>

                {/* AI-Powered Analysis */}
                <div className="border rounded-lg p-4 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-purple-900">AI-Powered Analysis</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• GPT-3.5-Turbo powered</li>
                    <li>• 4-5x faster responses</li>
                    <li>• Interactive chat support</li>
                    <li>• Contextual intelligence</li>
                  </ul>
                </div>

                {/* Professional Reporting */}
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <h4 className="font-bold text-green-900">Professional Reporting</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• PDF, Excel, JSON exports</li>
                    <li>• Compliance frameworks</li>
                    <li>• Payload transparency</li>
                    <li>• Remediation timelines</li>
                  </ul>
                </div>

                {/* Enterprise Security */}
                <div className="border rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <h4 className="font-bold text-red-900">Enterprise Security</h4>
                  </div>
                  <ul className="text-xs text-gray-700 space-y-1">
                    <li>• CAPTCHA verification</li>
                    <li>• Multi-API support</li>
                    <li>• Demo mode available</li>
                    <li>• Live vs Demo toggle</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">How It Works</h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-3">
                  <Badge className="shrink-0 mt-0.5">1</Badge>
                  <p className="text-gray-700"><span className="font-semibold">Configure:</span> Enter your domain and optional API keys (or use Demo mode)</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="shrink-0 mt-0.5">2</Badge>
                  <p className="text-gray-700"><span className="font-semibold">Scan:</span> HCARF generates and executes 65+ targeted search payloads</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="shrink-0 mt-0.5">3</Badge>
                  <p className="text-gray-700"><span className="font-semibold">Analyze:</span> AI analyzes findings and assigns severity levels</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="shrink-0 mt-0.5">4</Badge>
                  <p className="text-gray-700"><span className="font-semibold">Review:</span> Examine detailed results with payload transparency</p>
                </div>
                <div className="flex gap-3">
                  <Badge className="shrink-0 mt-0.5">5</Badge>
                  <p className="text-gray-700"><span className="font-semibold">Remediate:</span> Export professional reports with compliance mappings</p>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3 bg-blue-50">
                  <p className="text-2xl font-bold text-blue-600">35+</p>
                  <p className="text-gray-700">GitHub Patterns</p>
                </div>
                <div className="border rounded p-3 bg-purple-50">
                  <p className="text-2xl font-bold text-purple-600">30+</p>
                  <p className="text-gray-700">Dorking Queries</p>
                </div>
                <div className="border rounded p-3 bg-green-50">
                  <p className="text-2xl font-bold text-green-600">65+</p>
                  <p className="text-gray-700">Total Payloads</p>
                </div>
                <div className="border rounded p-3 bg-orange-50">
                  <p className="text-2xl font-bold text-orange-600">4-5x</p>
                  <p className="text-gray-700">Faster Analysis</p>
                </div>
              </div>
            </div>

            {/* Use Cases */}
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">Who Should Use HCARF?</h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p>✅ <span className="font-semibold">Security Professionals</span> - Vulnerability researchers and penetration testers</p>
                <p>✅ <span className="font-semibold">DevSecOps Teams</span> - Automated security testing in CI/CD pipelines</p>
                <p>✅ <span className="font-semibold">Compliance Officers</span> - Evidence gathering for security audits</p>
                <p>✅ <span className="font-semibold">CISOs</span> - Risk assessment and asset discovery</p>
                <p>✅ <span className="font-semibold">Developers</span> - Self-service security scanning before deployment</p>
              </div>
            </div>

            {/* Technology Stack */}
            <div>
              <h3 className="text-xl font-bold mb-3 text-blue-600">Technology Stack</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                <div>
                  <p className="font-semibold">Frontend:</p>
                  <p className="text-xs">React 18, TypeScript, Tailwind CSS, Shadcn UI</p>
                </div>
                <div>
                  <p className="font-semibold">AI Engine:</p>
                  <p className="text-xs">OpenRouter with GPT-3.5-Turbo</p>
                </div>
                <div>
                  <p className="font-semibold">APIs:</p>
                  <p className="text-xs">GitHub, Google Custom Search, OpenRouter</p>
                </div>
                <div>
                  <p className="font-semibold">Build:</p>
                  <p className="text-xs">Vite, ESBuild</p>
                </div>
              </div>
            </div>

            {/* Version Info */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="font-bold text-blue-600">v3.0</p>
                  <p className="text-gray-600">Current Version</p>
                </div>
                <div>
                  <p className="font-bold text-green-600">Active</p>
                  <p className="text-gray-600">Development Status</p>
                </div>
                <div>
                  <p className="font-bold text-purple-600">Dec 2025</p>
                  <p className="text-gray-600">Last Updated</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 text-center text-xs text-gray-600">
              <p><span className="font-semibold">HCARF Scanner</span> - Detect. Analyze. Remediate. Secure.</p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-end mt-4 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
