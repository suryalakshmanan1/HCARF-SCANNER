# HCARF Security Scanner

🛡️ **Professional AI-Powered Domain Security Analysis Platform**

A comprehensive security assessment tool that combines GitHub repository scanning, Google search intelligence, and AI-powered threat analysis to identify security vulnerabilities in public domains.

## ✨ Key Features

### 1. **AI-Powered Security Chat Assistant**
- Real-time conversational AI assistance for security analysis
- Security vulnerability analysis and remediation recommendations
- Attacker simulation perspectives for better threat understanding
- Compliance checking (OWASP, NIST, ISO 27001)
- Generate additional security payloads and fixes

### 2. **Multi-Source Security Scanning**
- **GitHub Repository Analysis**: Scans public repositories for exposed credentials, API keys, and configuration files
- **Google Dorking**: Advanced search queries to discover publicly exposed sensitive information
- **AI Validation**: Machine learning algorithms to reduce false positives and prioritize findings

### 3. **Professional Reporting**
- **PDF Reports**: Executive summaries with color-coded severity indicators, no markdown symbols
- **Excel/CSV Exports**: Structured data with compliance metrics for tracking
- **JSON Exports**: Complete datasets for system integration
- Professional formatting with HCARF branding

### 4. **Real-Time Progress Visualization**
- Animated radar-style scanning progress
- Step-by-step execution tracking with status indicators
- Retry options for failed scan steps
- Live status updates during scanning

### 5. **Security & Privacy**
- Ethical use agreement modal on first visit
- API keys stored securely in session storage only
- No permanent data storage on servers
- Real-time scanning with no external data transmission

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Shadcn UI + Radix UI
- **PDF Generation**: jsPDF for professional reports
- **APIs**: GitHub API, Google Custom Search, OpenRouter AI
- **Design**: Professional cybersecurity theme with semantic tokens

## 🏁 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone and install:
```bash
git clone <repository-url>
cd hcarf-scanner
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173)

### API Keys Setup

You'll need API keys for the following services:

1. **GitHub Personal Access Token**
   - Generate at: [GitHub Settings → Personal Access Tokens](https://github.com/settings/tokens)
   - Required permissions: `repo` (for private repos) or `public_repo` (for public repos only)
   - Click the external link icon in the API config modal to go directly to the token page

2. **Google Custom Search API**
   - Create at: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Enable Custom Search API
   - Create a Custom Search Engine at: [Programmable Search Engine](https://programmablesearchengine.google.com/)
   - Click the external link icon in the API config modal for quick access

3. **AI API Key (Optional but Recommended)**
   - Get from: [OpenRouter](https://openrouter.ai/keys)
   - Enables AI-powered analysis and chat features
   - Supports Anthropic Claude, OpenAI GPT, and other models
   - Click the external link icon in the API config modal for quick access

### Configuration

1. **Open the API Configuration Panel** (Settings icon ⚙️ next to the domain input)
2. **Add your API keys** in the respective fields
3. **Validate your keys** using the "Validate Keys" button
4. **Check status indicators**: Green dot = valid, Red dot = invalid, Gray dot = not validated
5. **Save Configuration** to store keys in session storage

## 🎯 How to Use

### Basic Scan

1. **Accept Security Guidelines**: On first visit, review and accept the ethical use agreement
2. **Enter a domain**: Type `example.com` or `https://example.com` in the input field
3. **Solve CAPTCHA**: Complete the CAPTCHA challenge to verify you're human
4. **Configure API Keys**: Click settings icon and add your API keys (if not already done)
5. **Start Scan**: Click "Start Advanced Security Scan" button
6. **Watch Progress**: Monitor real-time scanning progress with radar visualization
7. **Review Findings**: Analyze results with AI-validated severity levels

### AI Chat Assistant

1. **Open Chat**: Click the floating shield icon in the bottom-right corner
2. **Ask Questions**: Ask about your scan results or general security topics
3. **Use Quick Questions**: Click pre-built queries for instant insights
4. **Advanced Options**:
   - **🔧 Generate Fix**: Get detailed remediation instructions with code examples
   - **⚔️ Simulate Attacker**: Understand potential exploit scenarios from attacker's view
   - **📋 Compliance Check**: Map findings to OWASP, NIST, and ISO 27001 standards
5. **Get Recommendations**: Receive actionable security recommendations

### Export Reports

Choose from three professional formats:

1. **PDF Report**: Executive-ready with professional layout, charts, and recommendations
   - Clean formatting without markdown symbols
   - Color-coded severity indicators
   - AI-powered recommendations section
   - HCARF branding and footer

2. **Excel/CSV**: Structured data for analysis, tracking, and compliance
   - Severity breakdown
   - Finding details with business impact
   - Risk scores and confidence levels
   - AI recommendations

3. **JSON**: Complete dataset for integration with other security tools
   - Full metadata and scan details
   - Compliance analysis (GDPR, ISO 27001, NIST, SOX)
   - Action items and next steps
   - Structured for easy parsing

## 🔒 Security Best Practices

### Ethical Use Guidelines

✅ **DO:**
- Only scan domains you own or have explicit written permission to test
- Use for educational and authorized security assessments only
- Report vulnerabilities responsibly through proper disclosure channels
- Comply with all applicable local laws, regulations, and terms of service

❌ **DON'T:**
- Use findings to exploit, harm, or gain unauthorized access to any systems
- Circumvent security measures, access controls, or authentication mechanisms
- Violate terms of service of external APIs or services
- Scan domains without proper authorization or legal right

### Data Privacy

- **No Permanent Storage**: All scans are performed in real-time with no data stored on servers
- **Local Storage Only**: API keys are stored in browser session storage only
- **No External Transmission**: Scan results are not sent to external servers (except AI API for analysis)
- **Clear Data**: Clear your browser data to remove all locally stored information
- **Session-Based**: All data is cleared when you close the browser tab

### Rate Limiting

To avoid being blocked by APIs:
- The scanner implements smart rate limiting and request staggering
- GitHub API: 5,000 requests/hour for authenticated users
- Google Custom Search: 100 queries/day on free tier
- Respect API quotas and implement delays between requests if needed

## 📊 Scanning Methodology

### Phase 1: Initialization
- Validates all configured API keys
- Prepares security search payloads
- Configures rate limiting parameters
- Sets up AI analysis pipeline

### Phase 2: GitHub Repository Analysis
- Searches public repositories for the target domain
- Detects exposed credentials, API keys, and secrets
- Analyzes configuration files (`.env`, `.config`, etc.)
- Tracks commit history for sensitive data leaks
- Scans gists and issues for information disclosure

### Phase 3: Google Search Intelligence
- Advanced search queries (Google dorking)
- Discovers publicly indexed sensitive files
- Identifies exposed directories and admin panels
- Detects information disclosure vulnerabilities
- Finds backup files, logs, and database dumps

### Phase 4: AI Enhancement & Validation
- Validates findings to filter false positives (70%+ reduction)
- Assigns accurate severity levels based on context
- Generates professional, descriptive finding names
- Creates actionable remediation recommendations
- Maps findings to compliance frameworks (OWASP, NIST, ISO 27001)
- Calculates risk scores and business impact

## 🤖 AI Integration

The scanner leverages advanced AI models (via OpenRouter) for:

- **Finding Validation**: Machine learning reduces false positives by over 70%
- **Severity Assessment**: Context-aware risk prioritization and scoring
- **Recommendation Generation**: Detailed, actionable remediation steps with code examples
- **Conversational Analysis**: Natural language security Q&A and assistance
- **Compliance Mapping**: Automatic alignment with security frameworks
- **Attacker Simulation**: Understanding exploit scenarios from adversary perspective

## 📁 Project Structure

```
src/
├── components/scanner/     # Scanner UI components
├── utils/api/             # API utilities and handlers
├── utils/scanners/        # Scanning modules (GitHub, Google, Local)
├── utils/ai/              # AI analysis and enrichment
├── utils/tests/           # Unit tests
└── pages/                 # Main application pages
```

## 🧪 Testing

### Run Tests
```bash
npm run test
```

### Run Demo Script
```bash
chmod +x run-demo.sh
./run-demo.sh
```

### API Testing
Import `postman_collection.json` into Postman for endpoint testing.

## 🐛 Troubleshooting

### CAPTCHA Issues
- **CAPTCHA not appearing**: Check browser console for errors
- **CAPTCHA validation fails**: Ensure you're solving the latest challenge
- **CAPTCHA resets**: Each challenge is single-use for security

### Scan Issues
- **No results found**: Verify API keys are configured correctly and have proper permissions
- **Rate limit errors**: Too many requests - wait and retry, or upgrade API quotas
- **API validation fails**: Check that keys have required scopes/permissions enabled
- **Scan hangs**: Check network connection and API service status

### AI Chat Issues
- **AI not responding**: Verify AI API key is configured in settings
- **"API key not configured" error**: Add OpenRouter API key in the API configuration modal
- **Slow responses**: AI processing can take 5-15 seconds depending on complexity
- **Chat not opening**: Check browser console for errors, refresh page if needed

### Export Problems
- **File not downloading**: Check browser download permissions and popup blocker settings
- **Empty/corrupted exports**: Ensure scan results exist before exporting
- **PDF formatting issues**: Try using Excel or JSON format instead
- **Filename errors**: Browser may block special characters in filenames

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 🎨 Design System

HCARF Scanner features a professional cybersecurity-themed design system:

### Color Palette
- **Primary**: Deep blue (#5B68DF) for main brand elements
- **Accent**: Purple (#8833FF) for secondary highlights  
- **Severity Colors**: 
  - 🟢 Low: Green (#22C55E)
  - 🟡 Medium: Yellow (#EAB308)
  - 🟠 High: Orange (#F97316)
  - 🔴 Critical: Red (#DC2626)

### Design Principles
- **Semantic Tokens**: Consistent design tokens for all colors, gradients, and shadows
- **Dark Mode Optimized**: Reduced eye strain for extended security analysis sessions
- **Responsive Layout**: Works seamlessly on desktop, tablet, and mobile devices
- **Smooth Animations**: Professional transitions and progress indicators
- **Accessibility**: WCAG 2.1 AA compliant color contrasts

## 📄 License

This project is provided for **educational and authorized security assessment purposes only**.

**⚠️ Important**: Unauthorized use of this tool may violate computer fraud and abuse laws, terms of service agreements, and other regulations. Always obtain explicit written permission before scanning any domain or system you do not own.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [Shadcn UI](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- PDF generation with [jsPDF](https://github.com/parallax/jsPDF)
- AI integration via [OpenRouter](https://openrouter.ai/)

## 📞 Support & Contact

For issues, questions, feature requests, or security concerns:
- Open an issue on the GitHub repository
- Check existing issues for similar problems
- Provide detailed information and steps to reproduce

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The optimized production build will be created in the `dist/` directory.

### Deploy to Hosting

This is a static React application that can be deployed to:
- **Vercel**: `vercel deploy`
- **Netlify**: Drag `dist/` folder to Netlify Drop
- **GitHub Pages**: Configure GitHub Actions workflow
- **AWS S3 + CloudFront**: Upload `dist/` to S3 bucket
- **Any static hosting service**

### Environment Notes
- No server-side code required
- All API calls are made directly from the browser
- API keys are stored in browser session storage only
- No database or backend infrastructure needed

---

**⚠️ CRITICAL NOTICE**: This tool is for **authorized security testing only**. Always obtain proper authorization before scanning any domain. Unauthorized scanning may violate laws including the Computer Fraud and Abuse Act (CFAA) in the United States and similar laws in other jurisdictions.

**🛡️ Stay Secure. Stay Ethical. Stay Legal.**

---

**Made with ❤️ for the cybersecurity community**