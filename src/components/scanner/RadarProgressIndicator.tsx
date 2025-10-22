import React, { useEffect, useState } from 'react';
import { Shield, Github, Globe, Brain, CheckCircle, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ScanStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  details?: string;
}

interface RadarProgressIndicatorProps {
  isScanning: boolean;
  currentStep?: string;
  steps: ScanStep[];
  overallProgress: number;
  onRetryStep?: (stepId: string) => void;
}

export const RadarProgressIndicator: React.FC<RadarProgressIndicatorProps> = ({
  isScanning,
  currentStep,
  steps,
  overallProgress,
  onRetryStep,
}) => {
  const [radarAngle, setRadarAngle] = useState(0);

  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setRadarAngle(prev => (prev + 6) % 360);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'active':
        return <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <div className="h-4 w-4 border-2 border-muted-foreground/30 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'error':
        return 'text-red-400 border-red-500/30 bg-red-500/10';
      case 'active':
        return 'text-primary border-primary/30 bg-primary/10 animate-pulse';
      default:
        return 'text-muted-foreground border-muted-foreground/30';
    }
  };

  if (!isScanning && overallProgress === 0) {
    return null;
  }

  return (
    <Card className="scanner-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              {/* Radar Circle Animation */}
              <div className="h-10 w-10 rounded-full border-2 border-primary/20 flex items-center justify-center relative overflow-hidden">
                <Shield className="h-5 w-5 text-primary z-10" />
                {isScanning && (
                  <>
                    {/* Radar Sweep */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(from ${radarAngle}deg, transparent 0deg, hsl(var(--primary) / 0.3) 45deg, transparent 90deg)`,
                        transform: `rotate(${radarAngle}deg)`,
                      }}
                    />
                    {/* Radar Rings */}
                    <div className="absolute inset-1 rounded-full border border-primary/30 animate-ping" />
                    <div className="absolute inset-2 rounded-full border border-primary/20 animate-ping" style={{ animationDelay: '0.5s' }} />
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="text-lg font-semibold">Security Scan Progress</span>
              <div className="text-sm text-muted-foreground">
                {isScanning ? 'Active threat detection in progress...' : 'Scan completed'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-3 bg-gradient-to-r from-background to-muted"
          />
        </div>

        {/* Step Progress */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Scan Steps</h4>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "p-4 rounded-lg border transition-all duration-300",
                  getStatusColor(step.status),
                  step.status === 'active' && "shadow-lg shadow-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {step.icon}
                        <span className="font-medium text-sm">{step.name}</span>
                        {step.status === 'active' && (
                          <div className="flex space-x-1">
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" />
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                          </div>
                        )}
                      </div>
                      <p className="text-xs opacity-80 mt-1">{step.description}</p>
                      {step.details && (
                        <p className="text-xs opacity-60 mt-1 italic">{step.details}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {step.progress !== undefined && step.status === 'active' && (
                      <div className="text-xs font-mono">{step.progress}%</div>
                    )}
                    {step.status === 'error' && onRetryStep && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetryStep(step.id)}
                        className="h-6 w-6 p-0 hover:bg-red-500/20"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Individual step progress bar */}
                {step.progress !== undefined && step.status === 'active' && (
                  <div className="mt-2">
                    <Progress 
                      value={step.progress} 
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Live Activity Indicator */}
        {isScanning && (
          <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 h-3 w-3 bg-green-500 rounded-full animate-ping" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">System Status: Active Scanning</p>
                <p className="text-xs text-muted-foreground">
                  Real-time threat analysis in progress • Advanced AI processing enabled
                </p>
              </div>
              <div className="text-xs font-mono text-muted-foreground">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};