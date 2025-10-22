import React, { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ScanResult, ScanMetadata } from '@/pages/Index';
import { exportResultsEnhanced } from '@/utils/ai/enhancedExport';

interface ExportPanelProps {
  results: ScanResult[];
  metadata: ScanMetadata | null;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ results, metadata }) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'pdf' | 'excel' | 'json') => {
    if (!results.length || !metadata) return;

    setIsExporting(format);
    
    try {
      const result = await exportResultsEnhanced({
        format,
        results,
        metadata,
        includeAiAnalysis: true
      });

      if (result.success) {
        let filename = `HCARF-Security-Report-${metadata.domain}-${new Date().toLocaleDateString().replace(/\//g, '-')}`;
        
        if (result.blob) {
          const extension = format === 'excel' ? 'csv' : format;
          downloadFile(result.blob, `${filename}.${extension}`);
        } else if (result.data) {
          const jsonBlob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
          downloadFile(jsonBlob, `${filename}.json`);
        }

        toast({
          title: "Export Successful",
          description: `Professional ${format.toUpperCase()} report generated successfully`,
        });
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export the report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(null);
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportOptions = [
    {
      format: 'pdf' as const,
      title: 'Professional PDF Report',
      description: 'Executive summary, findings, and AI recommendations',
      icon: FileText,
      color: 'text-red-500'
    },
    {
      format: 'excel' as const,
      title: 'Excel Analysis Sheet',
      description: 'Structured data with compliance metrics',
      icon: FileSpreadsheet,
      color: 'text-green-500'
    },
    {
      format: 'json' as const,
      title: 'JSON Security Data',
      description: 'Complete dataset for system integration',
      icon: FileJson,
      color: 'text-blue-500'
    }
  ];

  return (
    <Card className="scanner-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileDown className="h-5 w-5 text-primary" />
          <span>Export Results</span>
        </CardTitle>
        <CardDescription>
          Download scan results in various formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isLoading = isExporting === option.format;
          
          return (
            <Button
              key={option.format}
              variant="outline"
              onClick={() => handleExport(option.format)}
              disabled={!metadata || results.length === 0 || isLoading}
              className="w-full justify-start h-auto p-4"
            >
              <div className="flex items-center space-x-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                ) : (
                  <Icon className={`h-5 w-5 ${option.color}`} />
                )}
                <div className="text-left">
                  <div className="font-medium">{option.title}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </div>
              </div>
            </Button>
          );
        })}

        {metadata && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Export Details</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>Domain: {metadata.domain}</div>
              <div>Issues Found: {results.length}</div>
              <div>Scan Date: {new Date(metadata.timestamp).toLocaleDateString()}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};