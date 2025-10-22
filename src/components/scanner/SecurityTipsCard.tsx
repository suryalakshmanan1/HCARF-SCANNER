import React from 'react';
import { Shield, Lock, Eye, Key, Database, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SecurityTip {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const securityTips: SecurityTip[] = [
  {
    icon: <Key className="h-5 w-5" />,
    title: "Never Hardcode Secrets",
    description: "Always use environment variables or secret management services for API keys, passwords, and tokens.",
    priority: 'critical'
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Enable HTTPS Everywhere",
    description: "Ensure all communications are encrypted with SSL/TLS certificates. Use HSTS headers.",
    priority: 'critical'
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: "Sanitize User Input",
    description: "Always validate and sanitize user input to prevent SQL injection and XSS attacks.",
    priority: 'high'
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: "Implement Rate Limiting",
    description: "Protect your APIs from abuse and DDoS attacks with proper rate limiting.",
    priority: 'high'
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Keep Dependencies Updated",
    description: "Regularly update your dependencies to patch known security vulnerabilities.",
    priority: 'medium'
  },
  {
    icon: <Globe className="h-5 w-5" />,
    title: "Use Security Headers",
    description: "Implement CSP, X-Frame-Options, and other security headers to prevent attacks.",
    priority: 'medium'
  }
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export const SecurityTipsCard: React.FC = () => {
  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Security Best Practices
            </CardTitle>
            <CardDescription>Essential tips to keep your applications secure</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {securityTips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 border border-primary/10 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex-shrink-0 mt-0.5">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${getPriorityColor(tip.priority)}`}>
                {tip.icon}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{tip.title}</h4>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(tip.priority)}`}>
                  {tip.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-primary/10">
          <div className="flex items-start space-x-2 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <AlertTriangle className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Pro Tip:</span> Use our AI Assistant to get personalized security advice for your specific use case. Click the floating AI button to start a conversation!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
