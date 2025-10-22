import React from 'react';
import { Search, Github, Globe, Brain, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface ScanStep {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  details?: string;
}

interface ScanProgressIndicatorProps {
  isScanning: boolean;
  currentStep?: string;
  steps: ScanStep[];
  overallProgress: number;
}

export const ScanProgressIndicator: React.FC<ScanProgressIndicatorProps> = ({
  isScanning,
  currentStep,
  steps,
  overallProgress,
}) => {
  if (!isScanning && steps.every(step => step.status === 'pending')) {
    return null;
  }

  const getStatusIcon = (step: ScanStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-primary animate-spin" />;
      case 'error':
        return <div className="h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
          <div className="h-2 w-2 bg-white rounded-full" />
        </div>;
      default:
        return <div className="h-5 w-5 bg-muted rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'active':
        return 'text-primary';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className="scanner-card bg-gradient-to-br from-background/80 to-background/60 border-primary/20 shadow-lg shadow-primary/5">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Shield className="h-6 w-6 text-primary" />
              {isScanning && (
                <div className="absolute inset-0 h-6 w-6 text-primary animate-pulse opacity-50" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Security Scan Progress</h3>
              <p className="text-sm text-muted-foreground">
                {isScanning ? 'Analyzing your domain security...' : 'Scan completed'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {Math.round(overallProgress)}%
          </Badge>
        </div>

        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="text-foreground font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress 
            value={overallProgress} 
            className="h-2 bg-muted/50"
          />
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-start space-x-4 p-4 rounded-lg transition-all duration-300 ${
                step.status === 'active' 
                  ? 'bg-primary/5 border border-primary/20 shadow-sm' 
                  : step.status === 'completed'
                  ? 'bg-green-500/5 border border-green-500/20'
                  : step.status === 'error'
                  ? 'bg-red-500/5 border border-red-500/20'
                  : 'bg-muted/20'
              }`}
            >
              {/* Step Icon */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {step.icon}
                  {step.status === 'active' && (
                    <div className="absolute inset-0 animate-pulse opacity-50">
                      {step.icon}
                    </div>
                  )}
                </div>
                {getStatusIcon(step)}
              </div>

              {/* Step Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${getStatusColor(step.status)}`}>
                    {step.name}
                  </h4>
                  {step.status === 'active' && step.progress !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {step.progress}%
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                
                {step.details && (
                  <p className="text-xs text-muted-foreground/80 italic">
                    {step.details}
                  </p>
                )}

                {/* Step Progress Bar */}
                {step.status === 'active' && step.progress !== undefined && (
                  <Progress 
                    value={step.progress} 
                    className="h-1 bg-muted/30"
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Activity Indicator */}
        {isScanning && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-sm text-foreground font-medium">
              Scanning in progress...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};