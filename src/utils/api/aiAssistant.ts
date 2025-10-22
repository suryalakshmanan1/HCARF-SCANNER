import { ScanResult, ScanMetadata } from '@/pages/Index';
import { callAiService } from '@/utils/ai/aiScan';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantRequest {
  message: string;
  scanResults: ScanResult[];
  scanMetadata: ScanMetadata | null;
  conversationHistory: Message[];
}

export const processAiQuery = async ({ 
  message, 
  scanResults, 
  scanMetadata, 
  conversationHistory 
}: AiAssistantRequest) => {
  try {
    // Prepare context for AI
    const context = {
      domain: scanMetadata?.domain || 'Unknown',
      resultCount: scanResults.length,
      severityBreakdown: {
        critical: scanResults.filter(r => r.severity === 'Critical').length,
        high: scanResults.filter(r => r.severity === 'High').length,
        medium: scanResults.filter(r => r.severity === 'Medium').length,
        low: scanResults.filter(r => r.severity === 'Low').length,
      },
      recentFindings: scanResults.slice(0, 5).map(r => ({
        severity: r.severity,
        source: r.source,
        snippet: r.snippet.substring(0, 100) + '...'
      }))
    };

    // Generate contextual AI response based on the query
    let response = '';

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('critical') || lowerMessage.includes('most important')) {
      const criticalIssues = scanResults.filter(r => r.severity === 'Critical');
      if (criticalIssues.length > 0) {
        response = `I found ${criticalIssues.length} critical issue(s) that need immediate attention:

${criticalIssues.map((issue, i) => `${i + 1}. **${issue.source}**: ${issue.snippet.substring(0, 150)}...
   
   **Action Required**: ${issue.recommendation}
`).join('\n')}

These issues pose the highest risk and should be addressed immediately to prevent potential security breaches.`;
      } else {
        response = "Good news! I didn't find any critical security issues in your scan. However, you should still address the medium and high severity findings to maintain good security posture.";
      }
    }
    else if (lowerMessage.includes('prevent') || lowerMessage.includes('avoid')) {
      response = `Based on your scan results, here are key prevention strategies:

**1. Secret Management**
- Never commit credentials to version control
- Use environment variables or secret management services
- Rotate keys regularly and monitor for unauthorized access

**2. Access Controls**
- Implement least privilege principles
- Use proper authentication and authorization
- Regular access audits and reviews

**3. Monitoring & Alerting**
- Set up security monitoring for your repositories
- Use tools like GitHub secret scanning
- Implement automated security testing in CI/CD

**4. Code Review Process**
- Mandatory security reviews for sensitive changes
- Use static analysis tools
- Train developers on secure coding practices

The ${context.resultCount} findings in your scan highlight areas where these practices could be improved.`;
    }
    else if (lowerMessage.includes('tools') || lowerMessage.includes('recommend')) {
      response = `Based on your scan results, I recommend these security tools:

**Secret Detection:**
- GitLeaks: Scan git repos for secrets
- TruffleHog: Find high-entropy strings and secrets
- GitHub Secret Scanning: Built-in GitHub protection

**Monitoring:**
- Snyk: Vulnerability monitoring and remediation
- SIEM solutions for log analysis
- Cloud security posture management tools

**Development:**
- Pre-commit hooks for secret detection
- Static Application Security Testing (SAST)
- Dependency vulnerability scanning

**For your ${context.domain} domain:**
${context.resultCount > 0 ? `Start by addressing the ${context.severityBreakdown.critical + context.severityBreakdown.high} high-priority issues found in the scan.` : 'Consider implementing preventive monitoring since no issues were found.'}`;
    }
    else if (lowerMessage.includes('explain') || lowerMessage.includes('implications')) {
      const highRiskFindings = scanResults.filter(r => r.severity === 'Critical' || r.severity === 'High');
      if (highRiskFindings.length > 0) {
        response = `Let me explain the security implications of your findings:

**High-Risk Issues Found: ${highRiskFindings.length}**

${highRiskFindings.slice(0, 3).map((finding, i) => `**${i + 1}. ${finding.severity} Risk - ${finding.source}**
- **What it means**: ${getSecurityImplication(finding)}
- **Potential impact**: ${getPotentialImpact(finding)}
- **Urgency**: ${getUrgencyLevel(finding)}
`).join('\n')}

These findings indicate that sensitive information about ${context.domain} is publicly accessible, which could be exploited by attackers for unauthorized access, data breaches, or service disruption.`;
      } else {
        response = `Your scan shows a relatively secure posture for ${context.domain}. The ${context.resultCount} findings are mostly low-risk items that represent good security hygiene opportunities rather than immediate threats.`;
      }
    }
    else {
      // Default contextual response
      response = await callAiService(message, context);
    }

    return { success: true, response };
  } catch (error) {
    console.error('AI Assistant error:', error);
    return { 
      success: false, 
      response: "I apologize, but I'm having trouble processing your request right now. Please try again later." 
    };
  }
};

const getSecurityImplication = (finding: ScanResult): string => {
  const snippet = finding.snippet.toLowerCase();
  if (snippet.includes('password') || snippet.includes('secret')) {
    return 'Authentication credentials are exposed publicly';
  } else if (snippet.includes('api') || snippet.includes('token')) {
    return 'API access tokens are discoverable by unauthorized users';
  } else if (snippet.includes('database')) {
    return 'Database connection information may be accessible';
  }
  return 'Sensitive configuration data is publicly visible';
};

const getPotentialImpact = (finding: ScanResult): string => {
  switch (finding.severity) {
    case 'Critical':
      return 'Immediate unauthorized access, data breach, or system compromise';
    case 'High':
      return 'Significant security risk with potential for exploitation';
    case 'Medium':
      return 'Moderate risk requiring attention to prevent escalation';
    default:
      return 'Low risk but should be addressed for security best practices';
  }
};

const getUrgencyLevel = (finding: ScanResult): string => {
  switch (finding.severity) {
    case 'Critical':
      return 'IMMEDIATE - Address within hours';
    case 'High':
      return 'HIGH - Address within 24-48 hours';
    case 'Medium':
      return 'MEDIUM - Address within 1-2 weeks';
    default:
      return 'LOW - Address in next maintenance cycle';
  }
};