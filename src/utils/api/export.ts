import { ScanResult, ScanMetadata } from '@/pages/Index';

interface ExportRequest {
  format: 'pdf' | 'excel' | 'json';
  results: ScanResult[];
  metadata: ScanMetadata;
  aiReport?: any;
}

interface ExportResponse {
  success: boolean;
  data?: any;
  blob?: Blob;
  error?: string;
}

export const exportResults = async ({ format, results, metadata, aiReport }: ExportRequest): Promise<ExportResponse> => {
  try {
    switch (format) {
      case 'json':
        return exportAsJson(results, metadata, aiReport);
      case 'pdf':
        return await exportAsPdf(results, metadata, aiReport);
      case 'excel':
        return await exportAsExcel(results, metadata, aiReport);
      default:
        return { success: false, error: 'Unsupported format' };
    }
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, error: 'Export failed' };
  }
};

const exportAsJson = (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): ExportResponse => {
  const exportData = {
    scanReport: {
      metadata,
      summary: {
        totalIssues: results.length,
        severityBreakdown: {
          critical: results.filter(r => r.severity === 'Critical').length,
          high: results.filter(r => r.severity === 'High').length,
          medium: results.filter(r => r.severity === 'Medium').length,
          low: results.filter(r => r.severity === 'Low').length,
        }
      },
      findings: results,
      aiReport: aiReport || null,
      generatedAt: new Date().toISOString(),
      version: "2.0"
    }
  };

  return { success: true, data: exportData };
};

const exportAsPdf = async (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): Promise<ExportResponse> => {
  // Generate professional PDF content with AI enhancements
  const pdfContent = generateProfessionalPdfContent(results, metadata, aiReport);
  
  // For demo purposes, return text content as blob (in production, use jsPDF or Puppeteer)
  const blob = new Blob([pdfContent], { type: 'text/plain' });
  return { success: true, blob };
};

const exportAsExcel = async (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): Promise<ExportResponse> => {
  // Generate professional Excel content with AI enhancements
  const excelContent = generateProfessionalExcelContent(results, metadata, aiReport);
  
  const blob = new Blob([excelContent], { 
    type: 'text/csv' 
  });
  return { success: true, blob };
};

const generateProfessionalPdfContent = (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): string => {
  const severityBreakdown = {
    critical: results.filter(r => r.severity === 'Critical').length,
    high: results.filter(r => r.severity === 'High').length,
    medium: results.filter(r => r.severity === 'Medium').length,
    low: results.filter(r => r.severity === 'Low').length,
  };

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                        🛡️  HCARF SECURITY SCANNER
                           Professional Security Assessment Report

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SCAN SUMMARY
═══════════════════════════════════════════════════════════════════════════
Target Domain: ${metadata.domain}
Scan Date: ${new Date(metadata.timestamp).toLocaleDateString()} ${new Date(metadata.timestamp).toLocaleTimeString()}
Scan Duration: ${metadata.scanDuration}ms
Queries Executed: ${metadata.queries}
Successful Queries: ${metadata.success}
Failed Queries: ${metadata.failed}

${aiReport?.executiveSummary || 'No AI analysis available'}

🚨 EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════
Total Security Issues Found: ${results.length}

Severity Breakdown:
┌─────────────────────────────────────────────────────────────────────────┐
│ 🔴 CRITICAL:   ${severityBreakdown.critical.toString().padStart(3)} issues (Immediate Action Required)        │
│ 🟠 HIGH:       ${severityBreakdown.high.toString().padStart(3)} issues (Address within 24-48 hours)      │
│ 🟡 MEDIUM:     ${severityBreakdown.medium.toString().padStart(3)} issues (Address within 1-2 weeks)       │
│ 🟢 LOW:        ${severityBreakdown.low.toString().padStart(3)} issues (Address in next cycle)           │
└─────────────────────────────────────────────────────────────────────────┘

Risk Level: ${severityBreakdown.critical > 0 ? '🔴 CRITICAL' : severityBreakdown.high > 2 ? '🟠 HIGH' : severityBreakdown.high > 0 ? '🟡 MEDIUM' : '🟢 LOW'}

📊 DETAILED FINDINGS
═══════════════════════════════════════════════════════════════════════════
${results.map((result, index) => `
┌─────────────────────────────────────────────────────────────────────────┐
│ Finding #${(index + 1).toString().padStart(2, '0')}: ${result.severity.toUpperCase()} SEVERITY                                    │
└─────────────────────────────────────────────────────────────────────────┘
🔍 Source: ${result.source}
🌐 URL: ${result.url}
📝 Finding: ${result.snippet}
💡 Recommendation: ${result.recommendation}
`).join('\n')}

${aiReport?.riskAssessment || ''}

🎯 RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════
${aiReport?.recommendations ? aiReport.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join('\n') : `
1. IMMEDIATE: Review and rotate any exposed credentials
2. SHORT-TERM: Implement proper secret management practices
3. ONGOING: Set up automated security monitoring and scanning
4. TRAINING: Educate development teams on secure coding practices
`}

📋 TECHNICAL DETAILS
═══════════════════════════════════════════════════════════════════════════
${aiReport?.technicalDetails || `
Scanning Methodology:
- GitHub Repository Analysis: Public repositories scanned for exposed secrets
- Google Custom Search: Public search results analyzed for information disclosure
- AI Enhancement: Machine learning algorithms applied for pattern recognition
- False Positive Filtering: Advanced filtering to reduce noise and focus on actionable findings

This assessment covers publicly accessible information and does not include:
- Internal network scanning
- Application penetration testing  
- Social engineering assessments
- Physical security evaluations
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                     Report generated by HCARF Security Scanner
                        ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
                             
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
};

const generateProfessionalExcelContent = (results: ScanResult[], metadata: ScanMetadata, aiReport?: any): string => {
  // Generate professional CSV content with AI enhancements
  const csvContent = [
    `# HCARF Security Scanner Report`,
    `# Domain: ${metadata.domain}`,
    `# Scan Date: ${new Date(metadata.timestamp).toLocaleDateString()}`,
    `# Total Issues: ${results.length}`,  
    `# Critical: ${results.filter(r => r.severity === 'Critical').length}`,
    `# High Risk: ${results.filter(r => r.severity === 'High').length}`,
    `# Medium Risk: ${results.filter(r => r.severity === 'Medium').length}`,
    `# Low Risk: ${results.filter(r => r.severity === 'Low').length}`,
    ``,
    `Finding ID,Severity,Risk Level,Source,URL,Finding Description,AI Recommendation,Context`,
    ...results.map((result, index) => {
      const riskLevel = result.severity === 'Critical' ? '🔴 CRITICAL' : 
                       result.severity === 'High' ? '🟠 HIGH' : 
                       result.severity === 'Medium' ? '🟡 MEDIUM' : '🟢 LOW';
      
      return `"${index + 1}","${result.severity}","${riskLevel}","${result.source}","${result.url}","${result.snippet.replace(/"/g, '""')}","${result.recommendation.replace(/"/g, '""')}","Detected via ${result.source}"`;
    })
  ].join('\n');
  
  return csvContent;
};