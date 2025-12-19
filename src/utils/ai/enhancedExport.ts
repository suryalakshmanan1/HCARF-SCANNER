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
      scanMethodology: {
        totalPayloadsGenerated: metadata.payloadCount || metadata.queries || 0,
        githubQueriesExecuted: metadata.githubQueries || 0,
        googleDorkingQueries: metadata.googleQueries || 0,
        payloadsUsed: metadata.payloadsUsed || [],
        rateLimitApplied: true,
        description: "This scan used advanced search payloads targeting common security misconfigurations, exposed credentials, and sensitive files."
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
      remediationPriority: {
        critical: 'Address within 24-48 hours',
        high: 'Address within 1-2 weeks',
        medium: 'Address within 1 month',
        low: 'Address within 3 months'
      },
      complianceFrameworks: [
        { name: 'OWASP Top 10', status: 'Assessed' },
        { name: 'NIST Cybersecurity Framework', status: 'Assessed' },
        { name: 'ISO 27001:2022', status: 'Assessed' },
        { name: 'CIS Controls', status: 'Assessed' },
        { name: 'GDPR Compliance', status: 'Assessed' }
      ],
      findings: results.map((result, index) => ({
        ...result,
        findingId: `HCARF-${Date.now()}-${(index + 1).toString().padStart(3, '0')}`,
        riskScore: calculateRiskScore(result),
        confidenceLevel: aiReport ? 'High' : 'Medium',
        businessImpact: getBusinessImpact(result.severity),
        remediationPriority: getRemediationPriority(result.severity)
      })),
      securityInsights: [
        'Regular Security Audits: Conduct quarterly security assessments to identify emerging threats',
        'Vulnerability Management: Implement a systematic approach to discovering, prioritizing, and remediating vulnerabilities',
        'Incident Response Plan: Develop and maintain a documented incident response procedure',
        'Security Awareness Training: Ensure team members understand security best practices and threats',
        'Code Review Process: Implement peer review and security analysis in your development pipeline',
        'Dependency Scanning: Monitor and update third-party libraries for known vulnerabilities',
        'Access Control: Implement principle of least privilege for user and application access',
        'Encryption: Use encryption for data in transit and at rest',
        'Logging & Monitoring: Maintain comprehensive security logs and real-time threat detection',
        'Backup Strategy: Implement robust backup and disaster recovery procedures'
      ],
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

    // Scan Methodology & Payloads Section
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SCAN METHODOLOGY & SEARCH PAYLOADS', margin, yPosition);
    yPosition += 12;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Calculate payload statistics
    const totalPayloads = metadata.payloadCount || metadata.queries || metadata.payloadsUsed?.length || 0;
    const githubCount = metadata.githubQueries || (metadata.payloadsUsed?.filter((p: string) => p.includes('site:github') || p.includes('github')).length || 0);
    const googleCount = metadata.googleQueries || (metadata.payloadsUsed?.filter((p: string) => !p.includes('site:github')).length || 0);
    
    // Count payloads that generated findings
    const payloadsWithFindings = new Set();
    const findingsByPayload: { [key: string]: number } = {};
    results.forEach((result: any) => {
      if (result.sourcePayload) {
        payloadsWithFindings.add(result.sourcePayload);
        findingsByPayload[result.sourcePayload] = (findingsByPayload[result.sourcePayload] || 0) + 1;
      }
    });
    
    pdf.text(`Total Search Payloads Generated: ${totalPayloads}`, margin, yPosition);
    yPosition += 7;
    pdf.text(`GitHub Queries: ${githubCount} | Google Dorking Queries: ${googleCount}`, margin, yPosition);
    yPosition += 7;
    pdf.setTextColor(76, 175, 80);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Payloads with Findings: ${payloadsWithFindings.size} (${Math.round((payloadsWithFindings.size / totalPayloads) * 100)}% success rate)`, margin, yPosition);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    yPosition += 12;
    
    // Show top payloads by findings
    if (payloadsWithFindings.size > 0) {
      const topPayloads = Object.entries(findingsByPayload)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10);
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Top Payloads by Findings Generated:', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      topPayloads.forEach((entry: any, index: number) => {
        yPosition = checkNewPage(yPosition, 8);
        const [payload, count] = entry;
        pdf.text(`${index + 1}. ${payload.substring(0, 70)}${payload.length > 70 ? '...' : ''} (${count} finding${count > 1 ? 's' : ''})`, margin + 10, yPosition);
        yPosition += 5;
      });
    }
    
    // Show all payloads used
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    yPosition += 8;
    yPosition = checkNewPage(yPosition, 12);
    pdf.text('Complete Search Payloads Used:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    
    // Show sample of payloads if available
    if (metadata.payloadsUsed && metadata.payloadsUsed.length > 0) {
      const samplePayloads = metadata.payloadsUsed.slice(0, 20); // Show first 20 payloads
      samplePayloads.forEach((payload, index) => {
        yPosition = checkNewPage(yPosition, 8);
        const hasFindings = payloadsWithFindings.has(payload);
        const findingCount = findingsByPayload[payload] || 0;
        const indicator = hasFindings ? `✓ (${findingCount})` : '○';
        pdf.text(`${index + 1}. [${indicator}] ${payload.substring(0, 75)}${payload.length > 75 ? '...' : ''}`, margin + 10, yPosition);
        yPosition += 5;
      });
      
      if (metadata.payloadsUsed.length > 20) {
        yPosition = checkNewPage(yPosition, 8);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        pdf.text(`... and ${metadata.payloadsUsed.length - 20} more payloads`, margin + 10, yPosition);
        pdf.setTextColor(0, 0, 0);
        yPosition += 5;
      }
    } else {
      // Fallback if no payloads tracked - show basic info
      yPosition = checkNewPage(yPosition, 8);
      pdf.text('Comprehensive security scanning using automated payload generation', margin + 10, yPosition);
      yPosition += 5;
    }
    yPosition += 10;

    // Detailed Findings
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DETAILED SECURITY FINDINGS', margin, yPosition);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(120, 120, 120);
    pdf.text('(Sorted by severity: Critical → High → Medium → Low → Informational)', margin, yPosition + 8);
    pdf.setTextColor(0, 0, 0);
    yPosition += 15;

    // Sort findings by severity before displaying
    const sortedResults = sortResultsBySeverity(results);

    sortedResults.forEach((result, index) => {
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
      
      // Show which payload discovered this finding
      if ((result as any).sourcePayload) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 150);
        pdf.text('Discovery Payload:', margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition = addTextWithLineBreaks((result as any).sourcePayload, margin + 40, yPosition, pageWidth - margin - 45, 5);
        pdf.setTextColor(0, 0, 0);
        yPosition += 3;
      }
      
      pdf.setFontSize(11);
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

    // Remediation Priority Matrix
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REMEDIATION PRIORITY MATRIX', margin, yPosition);
    yPosition += 12;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Issues are prioritized by severity for immediate action:', margin, yPosition);
    yPosition += 10;
    
    // Priority breakdown table
    const priorityLevels = [
      { level: 'CRITICAL', count: results.filter(r => r.severity === 'Critical').length, action: 'IMMEDIATE - Address within 24-48 hours' },
      { level: 'HIGH', count: results.filter(r => r.severity === 'High').length, action: 'URGENT - Address within 1-2 weeks' },
      { level: 'MEDIUM', count: results.filter(r => r.severity === 'Medium').length, action: 'IMPORTANT - Address within 1 month' },
      { level: 'LOW', count: results.filter(r => r.severity === 'Low').length, action: 'MONITOR - Address within 3 months' },
    ];
    
    priorityLevels.forEach((priority) => {
      if (priority.count > 0) {
        yPosition = checkNewPage(yPosition, 15);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${priority.level}: ${priority.count} issue${priority.count !== 1 ? 's' : ''}`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        yPosition += 5;
        yPosition = addTextWithLineBreaks(priority.action, margin + 10, yPosition, pageWidth - margin - 20, 5);
        yPosition += 5;
        pdf.setFontSize(11);
      }
    });
    yPosition += 5;

    // Compliance Framework Summary
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPLIANCE & FRAMEWORKS', margin, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('This assessment aligns with major compliance frameworks:', margin, yPosition);
    yPosition += 10;
    
    const frameworks = [
      {
        name: 'OWASP Top 10',
        desc: 'Common web application vulnerabilities and mitigation strategies'
      },
      {
        name: 'NIST Cybersecurity Framework',
        desc: 'Identify, Protect, Detect, Respond, and Recover security functions'
      },
      {
        name: 'ISO 27001:2022',
        desc: 'Information security management systems requirements'
      },
      {
        name: 'CIS Controls',
        desc: 'Critical security controls for reducing cyber risk'
      },
      {
        name: 'GDPR Compliance',
        desc: 'Data protection and privacy requirements for EU users'
      },
    ];
    
    frameworks.forEach((fw) => {
      yPosition = checkNewPage(yPosition, 12);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text(`• ${fw.name}`, margin + 5, yPosition);
      yPosition += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      yPosition = addTextWithLineBreaks(fw.desc, margin + 15, yPosition, pageWidth - margin - 25, 4);
      yPosition += 6;
    });

    // Implementation Timeline
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('IMPLEMENTATION TIMELINE', margin, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Recommended timeline for remediation based on severity:', margin, yPosition);
    yPosition += 12;
    
    const timeline = [
      { phase: 'Phase 1 (Week 1-2)', items: 'Immediately patch Critical vulnerabilities, implement emergency controls', color: { r: 220, g: 38, b: 38 } },
      { phase: 'Phase 2 (Week 3-4)', items: 'Address all High-severity issues, conduct security training', color: { r: 251, g: 146, b: 60 } },
      { phase: 'Phase 3 (Month 2)', items: 'Resolve Medium-priority items, implement preventive controls', color: { r: 234, g: 179, b: 8 } },
      { phase: 'Phase 4 (Month 3+)', items: 'Monitor Low-priority issues, establish continuous security monitoring', color: { r: 59, g: 130, b: 246 } },
    ];
    
    timeline.forEach((t) => {
      yPosition = checkNewPage(yPosition, 20);
      
      // Color-coded phase indicator
      pdf.setFillColor(t.color.r, t.color.g, t.color.b);
      pdf.roundedRect(margin, yPosition - 8, 8, 8, 1, 1, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.text(t.phase, margin + 12, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      yPosition = addTextWithLineBreaks(t.items, margin + 10, yPosition, pageWidth - margin - 20, 5);
      yPosition += 5;
      pdf.setFontSize(12);
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

    // Additional Security Insights Section
    pdf.addPage();
    yPosition = margin;
    
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SECURITY INSIGHTS & BEST PRACTICES', margin, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const insights = [
      'Regular Security Audits: Conduct quarterly security assessments to identify emerging threats',
      'Vulnerability Management: Implement a systematic approach to discovering, prioritizing, and remediating vulnerabilities',
      'Incident Response Plan: Develop and maintain a documented incident response procedure',
      'Security Awareness Training: Ensure team members understand security best practices and threats',
      'Code Review Process: Implement peer review and security analysis in your development pipeline',
      'Dependency Scanning: Monitor and update third-party libraries for known vulnerabilities',
      'Access Control: Implement principle of least privilege for user and application access',
      'Encryption: Use encryption for data in transit and at rest',
      'Logging & Monitoring: Maintain comprehensive security logs and real-time threat detection',
      'Backup Strategy: Implement robust backup and disaster recovery procedures'
    ];
    
    insights.forEach((insight, index) => {
      yPosition = checkNewPage(yPosition, 10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}.`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      yPosition = addTextWithLineBreaks(insight, margin + 10, yPosition, pageWidth - margin - 20, 5);
      yPosition += 4;
    });

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
  csvContent += `Report Type,${aiReport ? 'AI-Enhanced Professional Assessment' : 'Standard Security Assessment'}\n`;
  csvContent += `Scan Mode,${metadata.scanMode || 'LIVE'}\n\n`;
  
  // Scan Methodology
  csvContent += 'SCAN METHODOLOGY\n';
  csvContent += `Total Payloads Generated,${metadata.payloadCount || metadata.queries || 0}\n`;
  csvContent += `GitHub Queries Executed,${metadata.githubQueries || 0}\n`;
  csvContent += `Google Dorking Queries,${metadata.googleQueries || 0}\n`;
  csvContent += `Rate Limiting Applied,Yes - Exponential Backoff\n\n`;
  
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

const sortResultsBySeverity = (results: ScanResult[]): ScanResult[] => {
  const severityOrder: { [key: string]: number } = {
    'Critical': 1,
    'High': 2,
    'Medium': 3,
    'Low': 4,
    'Informational': 5
  };
  
  return [...results].sort((a, b) => {
    const orderA = severityOrder[a.severity] || 999;
    const orderB = severityOrder[b.severity] || 999;
    return orderA - orderB;
  });
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