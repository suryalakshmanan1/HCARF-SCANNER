import { ScanResult, ScanMetadata } from '@/pages/Index';

interface ReportRequest {
  results: ScanResult[];
  metadata: ScanMetadata;
  includeExecutiveSummary?: boolean;
}

interface ReportResponse {
  success: boolean;
  report?: {
    executiveSummary: string;
    keyFindings: string[];
    riskAssessment: string;
    recommendations: string[];
    technicalDetails: string;
  };
  error?: string;
}

export const generateAiReport = async ({ 
  results, 
  metadata, 
  includeExecutiveSummary = true 
}: ReportRequest): Promise<ReportResponse> => {
  try {
    // Analyze results for report generation
    const severityBreakdown = {
      critical: results.filter(r => r.severity === 'Critical').length,
      high: results.filter(r => r.severity === 'High').length,
      medium: results.filter(r => r.severity === 'Medium').length,
      low: results.filter(r => r.severity === 'Low').length,
    };

    const totalIssues = results.length;
    const riskLevel = getRiskLevel(severityBreakdown);
    
    // Try to use AI service for enhanced report generation if available
    const apiKeys = JSON.parse(sessionStorage.getItem('apiKeys') || '{}');
    let aiEnhancedReport = null;
    
    if (apiKeys.aiApiKey && results.length > 0) {
      try {
        const { OpenRouterService } = await import('./openRouterService');
        const aiService = new OpenRouterService(apiKeys.aiApiKey);
        aiEnhancedReport = await generateAiEnhancedReport(aiService, results, metadata);
      } catch (error) {
        console.error('AI-enhanced report generation failed:', error);
      }
    }

    // Generate executive summary (AI-enhanced if available)
    const executiveSummary = aiEnhancedReport?.executiveSummary || 
      (includeExecutiveSummary ? generateExecutiveSummary(
        metadata.domain, 
        totalIssues, 
        severityBreakdown, 
        riskLevel
      ) : '');

    // Generate key findings
    const keyFindings = aiEnhancedReport?.keyFindings || generateKeyFindings(results, severityBreakdown);

    // Generate risk assessment  
    const riskAssessment = aiEnhancedReport?.riskAssessment || generateRiskAssessment(results, severityBreakdown, metadata.domain);

    // Generate recommendations
    const recommendations = aiEnhancedReport?.recommendations || generateRecommendations(results, severityBreakdown);

    // Generate technical details
    const technicalDetails = aiEnhancedReport?.technicalDetails || generateTechnicalDetails(results, metadata);

    return {
      success: true,
      report: {
        executiveSummary,
        keyFindings,
        riskAssessment,
        recommendations,
        technicalDetails
      }
    };
  } catch (error) {
    console.error('AI Report generation error:', error);
    return {
      success: false,
      error: 'Failed to generate AI report'
    };
  }
};

const getRiskLevel = (breakdown: { critical: number; high: number; medium: number; low: number }): string => {
  if (breakdown.critical > 0) return 'CRITICAL';
  if (breakdown.high > 2) return 'HIGH';
  if (breakdown.high > 0 || breakdown.medium > 5) return 'MEDIUM';
  return 'LOW';
};

const generateExecutiveSummary = (
  domain: string, 
  totalIssues: number, 
  breakdown: { critical: number; high: number; medium: number; low: number },
  riskLevel: string
): string => {
  return `## Executive Summary

This security assessment of **${domain}** identified **${totalIssues}** potential security findings across public repositories and search results. The overall risk level for this domain is classified as **${riskLevel}**.

### Key Statistics:
- **Critical Issues**: ${breakdown.critical} (require immediate attention)
- **High Risk Issues**: ${breakdown.high} (address within 24-48 hours)
- **Medium Risk Issues**: ${breakdown.medium} (address within 1-2 weeks)
- **Low Risk Issues**: ${breakdown.low} (address in next maintenance cycle)

### Immediate Actions Required:
${breakdown.critical > 0 ? 
  `⚠️ **URGENT**: ${breakdown.critical} critical security issue(s) require immediate remediation to prevent potential data breaches or unauthorized access.` : 
  `✅ No critical security issues identified in this assessment.`
}

### Business Impact:
${getRiskLevel(breakdown) === 'CRITICAL' ? 
  'HIGH BUSINESS IMPACT: Exposed credentials or sensitive data could lead to data breaches, financial loss, and reputational damage.' :
  getRiskLevel(breakdown) === 'HIGH' ?
  'MODERATE BUSINESS IMPACT: Security vulnerabilities present manageable risks that should be addressed promptly.' :
  'LOW BUSINESS IMPACT: Identified issues represent good security hygiene opportunities with minimal immediate risk.'
}`;
};

const generateKeyFindings = (
  results: ScanResult[], 
  breakdown: { critical: number; high: number; medium: number; low: number }
): string[] => {
  const findings: string[] = [];

  // Critical findings
  const criticalIssues = results.filter(r => r.severity === 'Critical');
  if (criticalIssues.length > 0) {
    findings.push(`**${criticalIssues.length} Critical Security Issues**: Exposed credentials or sensitive data requiring immediate action`);
  }

  // High-risk findings
  const highIssues = results.filter(r => r.severity === 'High');
  if (highIssues.length > 0) {
    findings.push(`**${highIssues.length} High-Risk Vulnerabilities**: API keys, tokens, or configuration data publicly accessible`);
  }

  // Source breakdown
  const sources = [...new Set(results.map(r => r.source))];
  findings.push(`**${sources.length} Information Sources**: Issues found across ${sources.join(', ')}`);

  // Pattern analysis
  const patterns = analyzePatterns(results);
  if (patterns.length > 0) {
    findings.push(`**Common Patterns**: ${patterns.join(', ')}`);
  }

  return findings;
};

const generateRiskAssessment = (
  results: ScanResult[], 
  breakdown: { critical: number; high: number; medium: number; low: number },
  domain: string
): string => {
  return `## Risk Assessment for ${domain}

### Threat Level Analysis:
- **Data Exposure Risk**: ${breakdown.critical > 0 ? 'HIGH' : breakdown.high > 0 ? 'MEDIUM' : 'LOW'}
- **Unauthorized Access Risk**: ${breakdown.critical + breakdown.high > 0 ? 'ELEVATED' : 'MODERATE'}
- **Compliance Risk**: ${breakdown.critical > 0 ? 'HIGH' : 'MEDIUM'}

### Attack Vectors Identified:
${results.slice(0, 5).map((result, i) => 
  `${i + 1}. **${result.severity} Risk via ${result.source}**: ${result.snippet.substring(0, 100)}...`
).join('\n')}

### Potential Impact:
- **Financial**: ${breakdown.critical > 0 ? 'Potential for significant financial loss due to data breaches' : 'Limited financial exposure'}
- **Operational**: ${breakdown.high > 0 ? 'Service disruption or unauthorized access possible' : 'Minimal operational impact'}
- **Reputational**: ${breakdown.critical + breakdown.high > 0 ? 'Potential reputational damage from security incidents' : 'Limited reputational risk'}`;
};

const generateRecommendations = (
  results: ScanResult[], 
  breakdown: { critical: number; high: number; medium: number; low: number }
): string[] => {
  const recommendations: string[] = [];

  if (breakdown.critical > 0) {
    recommendations.push('**IMMEDIATE**: Revoke and rotate all exposed credentials within 2-4 hours');
    recommendations.push('**IMMEDIATE**: Audit access logs for unauthorized usage of exposed credentials');
    recommendations.push('**IMMEDIATE**: Implement emergency monitoring for affected systems');
  }

  if (breakdown.high > 0) {
    recommendations.push('**24-48 HOURS**: Review and secure all exposed API keys and tokens');
    recommendations.push('**24-48 HOURS**: Implement proper secret management practices');
  }

  recommendations.push('**ONGOING**: Implement automated secret scanning in CI/CD pipelines');
  recommendations.push('**ONGOING**: Establish regular security assessments and monitoring');
  recommendations.push('**ONGOING**: Provide security awareness training for development teams');

  // Pattern-based recommendations
  if (results.some(r => r.source === 'GitHub')) {
    recommendations.push('**GITHUB**: Enable GitHub secret scanning and push protection');
  }

  if (results.some(r => r.snippet.toLowerCase().includes('database'))) {
    recommendations.push('**DATABASE**: Review database access controls and connection security');
  }

  return recommendations;
};

const generateTechnicalDetails = (results: ScanResult[], metadata: ScanMetadata): string => {
  return `## Technical Scan Details

### Scan Metadata:
- **Target Domain**: ${metadata.domain}
- **Scan Duration**: ${metadata.scanDuration}ms
- **Queries Executed**: ${metadata.queries}
- **Successful Queries**: ${metadata.success}
- **Failed Queries**: ${metadata.failed}
- **Timestamp**: ${new Date(metadata.timestamp).toLocaleString()}

### Detailed Findings:
${results.map((result, i) => `
**Finding ${i + 1}**: ${result.severity} Severity
- **Source**: ${result.source}
- **URL**: ${result.url}
- **Finding**: ${result.snippet}
- **Recommendation**: ${result.recommendation}
`).join('\n')}

### Scanning Methodology:
- **GitHub Repository Scanning**: Search across public repositories for exposed credentials and sensitive data
- **Google Custom Search**: Query public search results for information disclosure
- **AI Enhancement**: Pattern recognition and severity classification using machine learning
- **False Positive Filtering**: Automated filtering to reduce noise and focus on actionable findings`;
};

const analyzePatterns = (results: ScanResult[]): string[] => {
  const patterns: string[] = [];
  
  const snippets = results.map(r => r.snippet.toLowerCase()).join(' ');
  
  if (snippets.includes('aws') || snippets.includes('amazon')) {
    patterns.push('AWS credential exposure');
  }
  if (snippets.includes('database') || snippets.includes('mongodb') || snippets.includes('mysql')) {
    patterns.push('Database credential exposure');
  }
  if (snippets.includes('api_key') || snippets.includes('token')) {
    patterns.push('API key exposure');
  }
  if (snippets.includes('password') || snippets.includes('secret')) {
    patterns.push('Password/secret exposure');
  }
  
  return patterns;
};

// AI-enhanced report generation
const generateAiEnhancedReport = async (aiService: any, results: ScanResult[], metadata: ScanMetadata) => {
  try {
    const severityBreakdown = {
      critical: results.filter(r => r.severity === 'Critical').length,
      high: results.filter(r => r.severity === 'High').length,
      medium: results.filter(r => r.severity === 'Medium').length,
      low: results.filter(r => r.severity === 'Low').length,
    };

    const prompt = `Generate a professional cybersecurity report for domain "${metadata.domain}".

Scan Results Summary:
- Total Issues: ${results.length}
- Critical: ${severityBreakdown.critical}
- High: ${severityBreakdown.high}  
- Medium: ${severityBreakdown.medium}
- Low: ${severityBreakdown.low}

Top Findings:
${results.slice(0, 5).map((r, i) => `${i + 1}. ${r.severity} - ${r.source}: ${r.snippet.substring(0, 100)}...`).join('\n')}

Generate a report with these sections:
1. Executive Summary (2-3 paragraphs, business-focused)
2. Key Findings (3-5 bullet points)
3. Risk Assessment (detailed analysis)
4. Recommendations (5-7 actionable items with priorities)
5. Technical Details (methodology and context)

Format as JSON:
{
  "executiveSummary": "...",
  "keyFindings": ["...", "..."],
  "riskAssessment": "...",
  "recommendations": ["...", "..."],
  "technicalDetails": "..."
}`;

    const response = await aiService.makeRequest({
      model: 'anthropic/claude-3-haiku',
      messages: [
        { 
          role: 'system', 
          content: 'You are a professional cybersecurity analyst creating formal security assessment reports. Be thorough, accurate, and business-focused.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content || '';
    return JSON.parse(content);
    
  } catch (error) {
    console.error('AI report enhancement failed:', error);
    return null;
  }
};