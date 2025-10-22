import { ScanResult, ScanMetadata } from '@/pages/Index';
import { generateAiReport } from '@/utils/ai/aiReport';
import { OpenRouterService } from '@/utils/ai/openRouterService';
import jsPDF from 'jspdf';

interface EnhancedExportRequest {
  format: 'pdf' | 'excel' | 'json';
  results: ScanResult[];
  metadata: ScanMetadata;
  includeAiAnalysis?: boolean;
}

interface EnhancedExportResponse {
  success: boolean;
  data?: any;
  blob?: Blob;
  error?: string;
}

export const exportResultsEnhanced = async ({ 
  format, 
  results, 
  metadata, 
  includeAiAnalysis = true 
}: EnhancedExportRequest): Promise<EnhancedExportResponse> => {
  try {
    let aiReport = null;
    
    // Generate AI-enhanced report if enabled and AI service available
    if (includeAiAnalysis) {
      const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
      if (apiKeys.aiApiKey && results.length > 0) {
        try {
          const reportResult = await generateAiReport({ results, metadata, includeExecutiveSummary: true });
          if (reportResult.success && reportResult.report) {
            aiReport = reportResult.report;
            
            // Generate additional AI insights using OpenRouter
            const aiService = new OpenRouterService(apiKeys.aiApiKey);
            const additionalInsights = await generateAdditionalInsights(aiService, results, metadata);
            if (additionalInsights) {
              aiReport = { ...aiReport, ...additionalInsights };
            }
          }
        } catch (error) {
          console.error('AI report generation failed:', error);
        }
      }
    }

    switch (format) {
      case 'json':
        return exportAsEnhancedJson(results, metadata, aiReport);
      case 'pdf':
        return await exportAsEnhancedPdf(results, metadata, aiReport);
      case 'excel':
        return await exportAsEnhancedExcel(results, metadata, aiReport);
      default:
        return { success: false, error: 'Unsupported format' };
    }
  } catch (error) {
    console.error('Enhanced export error:', error);
    return { success: false, error: 'Enhanced export failed' };
  }
};

const exportAsEnhancedJson = (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): EnhancedExportResponse => {
  const exportData = {
    scanReport: {
      metadata: {
        ...metadata,
        exportedAt: new Date().toISOString(),
        reportVersion: "3.0-AI-Enhanced",
        generatedBy: "HCARF Security Scanner"
      },
      summary: {
        totalIssues: results.length,
        severityBreakdown: {
          critical: results.filter(r => r.severity === 'Critical').length,
          high: results.filter(r => r.severity === 'High').length,
          medium: results.filter(r => r.severity === 'Medium').length,
          low: results.filter(r => r.severity === 'Low').length,
        },
        aiEnhanced: !!aiReport,
        riskLevel: calculateOverallRiskLevel(results)
      },
      findings: results.map((result, index) => ({
        ...result,
        findingId: `HCARF-${Date.now()}-${(index + 1).toString().padStart(3, '0')}`,
        riskScore: calculateRiskScore(result),
        confidenceLevel: aiReport ? 'High' : 'Medium',
        businessImpact: getBusinessImpact(result.severity),
        remediationPriority: getRemediationPriority(result.severity)
      })),
      aiAnalysis: aiReport || null,
      compliance: {
        gdpr: analyzeGdprCompliance(results),
        iso27001: analyzeIso27001Compliance(results),
        nist: analyzeNistCompliance(results),
        sox: analyzeSoxCompliance(results)
      },
      actionItems: generateActionItems(results, aiReport),
      nextSteps: generateNextSteps(results, aiReport)
    }
  };

  return { success: true, data: exportData };
};

const exportAsEnhancedPdf = async (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): Promise<EnhancedExportResponse> => {
  try {
    const pdf = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Helper function to clean markdown text
    const cleanMarkdown = (text: string): string => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** markers
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* markers
        .replace(/#{1,6}\s*/g, '')       // Remove ## heading markers
        .replace(/`(.*?)`/g, '$1')       // Remove `code` markers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [links](url)
        .replace(/^[-*+]\s+/gm, '• ')    // Convert markdown bullets to proper bullets
        .replace(/^\d+\.\s+/gm, '')      // Remove numbered list markers (we'll add them back)
        .trim();
    };

    // Helper function to add text with line breaks
    const addTextWithLineBreaks = (text: string, x: number, y: number, maxWidth: number, lineHeight: number = 7): number => {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * lineHeight);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (currentY: number, requiredSpace: number = 30): number => {
      if (currentY + requiredSpace > pageHeight - margin) {
        pdf.addPage();
        return margin;
      }
      return currentY;
    };

    // Cover Page with professional layout
    pdf.setFillColor(240, 248, 255); // Light blue background
    pdf.rect(0, 0, pageWidth, 70, 'F');
    
    // Modern header
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 58, 138); // Dark blue
    pdf.text('HCARF Security Scanner', pageWidth / 2, 35, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105); // Slate gray
    pdf.text('Professional Cybersecurity Assessment Report', pageWidth / 2, 50, { align: 'center' });
    
    // Professional logo placeholder
    pdf.setFontSize(24);
    pdf.setTextColor(30, 58, 138);
    pdf.text('🛡️', pageWidth - 25, 25);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Professional information layout
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    yPosition = 90;
    pdf.text('Target Domain:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metadata.domain, margin + 40, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Assessment Date:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(new Date(metadata.timestamp).toLocaleDateString(), margin + 45, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Report Type:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(aiReport ? 'AI-Enhanced Professional Assessment' : 'Standard Security Assessment', margin + 35, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total Findings:', margin, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(results.length.toString(), margin + 40, yPosition);

    // Executive Summary
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('EXECUTIVE SUMMARY', margin, yPosition);
    yPosition += 15;
    
    const severityBreakdown = {
      critical: results.filter(r => r.severity === 'Critical').length,
      high: results.filter(r => r.severity === 'High').length,
      medium: results.filter(r => r.severity === 'Medium').length,
      low: results.filter(r => r.severity === 'Low').length,
    };
    
    const riskLevel = severityBreakdown.critical > 0 ? 'CRITICAL' : 
                    severityBreakdown.high > 2 ? 'HIGH' : 
                    severityBreakdown.high > 0 ? 'MEDIUM' : 'LOW';

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const executiveSummary = cleanMarkdown(aiReport?.executiveSummary || 
      `This automated security assessment of ${metadata.domain} identified ${results.length} potential security findings across publicly accessible sources. The assessment employed advanced scanning techniques including GitHub repository analysis, Google search intelligence, and AI-powered threat detection algorithms.`);
    
    yPosition = addTextWithLineBreaks(executiveSummary, margin, yPosition, pageWidth - 2 * margin);
    yPosition += 10;

    // Risk Assessment Table
    pdf.setFont('helvetica', 'bold');
    pdf.text('RISK ASSESSMENT', margin, yPosition);
    yPosition += 10;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Overall Risk Level: ${riskLevel}`, margin, yPosition);
    yPosition += 10;
    
    // Severity breakdown
    pdf.text('Security Findings Breakdown:', margin, yPosition);
    yPosition += 7;
    pdf.text(`• Critical Issues: ${severityBreakdown.critical}`, margin + 10, yPosition);
    yPosition += 5;
    pdf.text(`• High Risk Issues: ${severityBreakdown.high}`, margin + 10, yPosition);
    yPosition += 5;
    pdf.text(`• Medium Risk Items: ${severityBreakdown.medium}`, margin + 10, yPosition);
    yPosition += 5;
    pdf.text(`• Low Priority Items: ${severityBreakdown.low}`, margin + 10, yPosition);
    yPosition += 15;

    // Detailed Findings
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILED SECURITY FINDINGS', margin, yPosition);
    yPosition += 15;

    results.forEach((result, index) => {
      yPosition = checkNewPage(yPosition, 50);
      
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Finding #${(index + 1).toString().padStart(3, '0')}`, margin, yPosition);
      
      // Severity indicator with color coding
      const severityColor = getSeverityColor(result.severity);
      pdf.setFillColor(severityColor.r, severityColor.g, severityColor.b);
      pdf.roundedRect(pageWidth - 65, yPosition - 8, 50, 12, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255); // White text for contrast
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${result.severity.toUpperCase()}`, pageWidth - 40, yPosition - 2, { align: 'center' });
      pdf.setTextColor(0, 0, 0); // Reset to black
      
      yPosition += 10;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Finding Name:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      const findingName = (result as any).findingName || `Security Issue #${index + 1}`;
      yPosition = addTextWithLineBreaks(findingName, margin + 35, yPosition, pageWidth - margin - 35, 6);
      yPosition += 3;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Source:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(result.source, margin + 20, yPosition);
      yPosition += 7;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Affected URL:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addTextWithLineBreaks(result.url, margin + 35, yPosition, pageWidth - margin - 35, 6);
      yPosition += 3;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Technical Details:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addTextWithLineBreaks(result.snippet, margin + 45, yPosition, pageWidth - margin - 45, 6);
      yPosition += 3;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommendations:', margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      const cleanedRecommendation = cleanMarkdown(result.recommendation || 'Review and validate this finding');
      yPosition = addTextWithLineBreaks(cleanedRecommendation, margin + 45, yPosition, pageWidth - margin - 45, 6);
      yPosition += 10;
    });

    // AI Recommendations
    if (aiReport?.recommendations) {
      pdf.addPage();
      yPosition = margin;
      
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI-POWERED RECOMMENDATIONS', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      aiReport.recommendations.forEach((rec: string, index: number) => {
        yPosition = checkNewPage(yPosition, 15);
        const cleanRec = cleanMarkdown(rec);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}.`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition = addTextWithLineBreaks(cleanRec, margin + 10, yPosition, pageWidth - margin - 10, 6);
        yPosition += 5;
      });
    }

    // Footer on last page
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`HCARF Security Scanner - ${new Date().toLocaleDateString()}`, margin, pageHeight - 10);

    const blob = pdf.output('blob');
    return { success: true, blob };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: 'Failed to generate PDF report' };
  }
};

const exportAsEnhancedExcel = async (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): Promise<EnhancedExportResponse> => {
  const severityBreakdown = {
    critical: results.filter(r => r.severity === 'Critical').length,
    high: results.filter(r => r.severity === 'High').length,
    medium: results.filter(r => r.severity === 'Medium').length,
    low: results.filter(r => r.severity === 'Low').length,
  };

  let csvContent = 'HCARF Security Scanner - Professional Security Assessment Report\n';
  csvContent += `Domain,${metadata.domain}\n`;
  csvContent += `Assessment Date,${new Date(metadata.timestamp).toLocaleDateString()}\n`;
  csvContent += `Total Findings,${results.length}\n`;
  csvContent += `Report Type,${aiReport ? 'AI-Enhanced Professional Assessment' : 'Standard Security Assessment'}\n\n`;
  
  csvContent += 'SEVERITY BREAKDOWN\n';
  csvContent += `Critical Issues,${severityBreakdown.critical}\n`;
  csvContent += `High Risk Issues,${severityBreakdown.high}\n`;
  csvContent += `Medium Risk Items,${severityBreakdown.medium}\n`;
  csvContent += `Low Priority Items,${severityBreakdown.low}\n\n`;
  
  csvContent += 'DETAILED FINDINGS\n';
  csvContent += 'Finding ID,Finding Name,Severity,Source,Affected URL,Technical Details,Business Impact,Recommendations,Risk Score,Confidence Level\n';
  
  results.forEach((result, index) => {
    const findingId = `HCARF-${Date.now()}-${(index + 1).toString().padStart(3, '0')}`;
    const findingName = (result as any).findingName || `Security Issue #${index + 1}`;
    const businessImpact = getBusinessImpact(result.severity);
    const riskScore = calculateRiskScore(result);
    const confidenceLevel = aiReport ? 'High' : 'Medium';
    
    const csvRow = [
      findingId,
      `"${findingName.replace(/"/g, '""')}"`,
      result.severity,
      result.source,
      `"${result.url.replace(/"/g, '""')}"`,
      `"${result.snippet.replace(/"/g, '""')}"`,
      businessImpact,
      `"${(result.recommendation || 'Review and validate this finding').replace(/"/g, '""')}"`,
      riskScore,
      confidenceLevel
    ].join(',');
    
    csvContent += csvRow + '\n';
  });

  if (aiReport?.recommendations) {
    csvContent += '\nAI RECOMMENDATIONS\n';
    csvContent += 'Priority,Recommendation\n';
    aiReport.recommendations.forEach((rec: string, index: number) => {
      const cleanRec = rec
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold** markers
        .replace(/\*(.*?)\*/g, '$1')     // Remove *italic* markers
        .replace(/#{1,6}\s*/g, '')       // Remove ## heading markers
        .replace(/`(.*?)`/g, '$1')       // Remove `code` markers
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove [links](url)
        .trim()
        .replace(/"/g, '""');
      csvContent += `${index + 1},"${cleanRec}"\n`;
    });
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return { success: true, blob };
};

// Helper functions
const calculateRiskScore = (result: ScanResult): number => {
  const severityScores = { 'Critical': 10, 'High': 7, 'Medium': 5, 'Low': 2 };
  return severityScores[result.severity as keyof typeof severityScores] || 1;
};

const calculateOverallRiskLevel = (results: ScanResult[]): string => {
  const criticalCount = results.filter(r => r.severity === 'Critical').length;
  const highCount = results.filter(r => r.severity === 'High').length;
  
  if (criticalCount > 0) return 'CRITICAL';
  if (highCount > 2) return 'HIGH';
  if (highCount > 0) return 'MEDIUM';
  return 'LOW';
};

const getBusinessImpact = (severity: string): string => {
  const impacts = {
    'Critical': 'Severe - Immediate business disruption possible',
    'High': 'Significant - Major security incident risk',
    'Medium': 'Moderate - Potential security vulnerability',
    'Low': 'Minor - Limited impact on operations'
  };
  return impacts[severity as keyof typeof impacts] || 'Under review';
};

const getRemediationPriority = (severity: string): string => {
  const priorities = {
    'Critical': 'Immediate (0-24 hours)',
    'High': 'Urgent (24-48 hours)',
    'Medium': 'Standard (1-2 weeks)',
    'Low': 'Next maintenance cycle'
  };
  return priorities[severity as keyof typeof priorities] || 'To be determined';
};

const getSeverityColor = (severity: string) => {
  const colors = {
    'Critical': { r: 220, g: 38, b: 38 },
    'High': { r: 249, g: 115, b: 22 },
    'Medium': { r: 234, g: 179, b: 8 },
    'Low': { r: 34, g: 197, b: 94 }
  };
  return colors[severity as keyof typeof colors] || { r: 0, g: 0, b: 0 };
};

const analyzeGdprCompliance = (results: ScanResult[]): string => {
  const hasDataExposure = results.some(r => 
    r.snippet.toLowerCase().includes('email') || 
    r.snippet.toLowerCase().includes('personal') ||
    r.snippet.toLowerCase().includes('user')
  );
  return hasDataExposure ? 'NON-COMPLIANT - Data exposure risks identified' : 'COMPLIANT - No personal data exposure detected';
};

const analyzeIso27001Compliance = (results: ScanResult[]): string => {
  const criticalOrHigh = results.filter(r => r.severity === 'Critical' || r.severity === 'High').length;
  return criticalOrHigh > 0 ? 'GAPS IDENTIFIED - Security controls require attention' : 'ALIGNED - Good security posture maintained';
};

const analyzeNistCompliance = (results: ScanResult[]): string => {
  return results.length > 10 ? 'IMPROVEMENT NEEDED - Multiple security gaps identified' : 'SATISFACTORY - Reasonable security controls in place';
};

const analyzeSoxCompliance = (results: ScanResult[]): string => {
  const hasCritical = results.some(r => r.severity === 'Critical');
  return hasCritical ? 'AT RISK - Control effectiveness concerns' : 'MAINTAINED - Security controls operating effectively';
};

const generateActionItems = (results: ScanResult[], aiReport?: any): string[] => {
  const items = [];
  const criticalCount = results.filter(r => r.severity === 'Critical').length;
  const highCount = results.filter(r => r.severity === 'High').length;
  
  if (criticalCount > 0) {
    items.push(`Immediately address ${criticalCount} critical security finding(s)`);
    items.push('Rotate all exposed credentials within 24 hours');
    items.push('Notify security team and stakeholders');
  }
  
  if (highCount > 0) {
    items.push(`Review and remediate ${highCount} high-risk issue(s) within 48 hours`);
  }
  
  items.push('Implement automated security scanning in CI/CD pipeline');
  items.push('Establish regular security monitoring procedures');
  
  return items;
};

const generateNextSteps = (results: ScanResult[], aiReport?: any): string[] => {
  return [
    'Schedule follow-up security assessment in 30 days',
    'Implement recommended security controls',
    'Establish security metrics and KPI monitoring',
    'Conduct team security awareness training',
    'Review and update incident response procedures'
  ];
};

const generateAdditionalInsights = async (aiService: OpenRouterService, results: ScanResult[], metadata: ScanMetadata) => {
  try {
    const prompt = `Based on these security findings for ${metadata.domain}, provide additional strategic insights:
    
    Findings Summary:
    ${results.map(r => `- ${r.severity}: ${r.snippet.substring(0, 100)}...`).join('\n')}
    
    Please provide:
    1. Industry-specific compliance considerations
    2. Attack vector analysis
    3. Business continuity impact assessment
    4. Long-term security strategy recommendations
    
    Respond in JSON format with keys: complianceInsights, attackVectors, businessContinuity, strategicRecommendations`;
    
    const response = await aiService.generateConversationalResponse(prompt, results, metadata, []);
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to generate additional insights:', error);
    return null;
  }
};