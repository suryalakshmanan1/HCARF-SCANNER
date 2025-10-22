import React from 'react';
import { Clock, Globe, CheckCircle, XCircle, AlertTriangle, Shield, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ScanResult, ScanMetadata } from '@/pages/Index';

interface ScanResultsProps {
  results: ScanResult[];
  metadata: ScanMetadata | null;
  onAskAi?: (finding: ScanResult) => void;
}

export const ScanResults: React.FC<ScanResultsProps> = ({ results, metadata, onAskAi }) => {
  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'severity-critical';
      case 'high':
        return 'severity-high';
      case 'medium':
        return 'severity-medium';
      default:
        return 'severity-low';
    }
  };

  const severityCounts = results.reduce((acc, result) => {
    acc[result.severity.toLowerCase()] = (acc[result.severity.toLowerCase()] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Scan Summary */}
      {metadata && (
        <Card className="scanner-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary" />
              <span>Scan Summary</span>
            </CardTitle>
            <CardDescription>
              Scanned {metadata.domain} on {new Date(metadata.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{results.length}</div>
                <div className="text-sm text-muted-foreground">Total Issues</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{metadata.scanDuration}ms</div>
                <div className="text-sm text-muted-foreground">Scan Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{metadata.success}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">{metadata.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Severity Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { level: 'Critical', count: severityCounts.critical || 0, color: 'severity-critical' },
                  { level: 'High', count: severityCounts.high || 0, color: 'severity-high' },
                  { level: 'Medium', count: severityCounts.medium || 0, color: 'severity-medium' },
                  { level: 'Low', count: severityCounts.low || 0, color: 'severity-low' },
                ].map((item) => (
                  <div key={item.level} className="flex items-center justify-between">
                    <span className="text-sm">{item.level}</span>
                    <Badge className={item.color}>{item.count}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results List */}
      <Card className="scanner-card">
        <CardHeader>
          <CardTitle>Security Issues</CardTitle>
          <CardDescription>
            {results.length > 0 
              ? `Found ${results.length} potential security issue${results.length === 1 ? '' : 's'}`
              : 'No security issues found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => {
                // AI validation indicators
                const isValidated = (result as any).validated !== undefined;
                const isLikelyFalsePositive = (result as any).validated === false;
                const validationExplanation = (result as any).validationExplanation;
                
                return (
                  <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(result.severity)}
                        <Badge className={getSeverityClass(result.severity)}>
                          {result.severity}
                        </Badge>
                        {isValidated && (
                          <Badge 
                            className={`text-xs ${
                              isLikelyFalsePositive 
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' 
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                            }`}
                          >
                            {isLikelyFalsePositive ? '⚠️ Likely False Positive' : '✅ True Positive'}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {result.source}
                        </span>
                      </div>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        View Source
                      </a>
                    </div>
                    
                    {/* AI Validation Explanation */}
                    {validationExplanation && (
                      <div className="bg-gradient-to-r from-purple-500/5 to-cyan-500/5 border border-purple-500/20 rounded p-3">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-purple-400 mb-1">AI Analysis:</p>
                            <p className="text-xs text-muted-foreground">{validationExplanation}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-muted rounded p-3">
                      <code className="text-sm font-mono">{result.snippet}</code>
                    </div>
                    
                    <div className="text-sm">
                      <strong className="text-foreground">Recommendation:</strong>{' '}
                      <span className="text-muted-foreground">{result.recommendation}</span>
                    </div>

                    {/* Business Impact (if available) */}
                    {(result as any).businessImpact && (
                      <div className="text-sm">
                        <strong className="text-foreground">Business Impact:</strong>{' '}
                        <span className="text-muted-foreground">{(result as any).businessImpact}</span>
                      </div>
                    )}

                    {/* Ask AI Assistant Button */}
                    {onAskAi && (
                      <div className="pt-2 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onAskAi(result)}
                          className="w-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 hover:from-purple-500/20 hover:to-cyan-500/20 border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask AI Assistant About This Finding
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : metadata && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Issues Found</h3>
              <p className="text-muted-foreground">
                Your domain appears to be secure from public exposure
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};