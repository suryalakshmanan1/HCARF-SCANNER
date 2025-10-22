#!/bin/bash

# H-CARF Scanner Demo Script
# This script demonstrates the core functionality of the scanner

echo "🚀 H-CARF Scanner Demo"
echo "======================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Demo Overview:${NC}"
echo "1. Generate CAPTCHA"
echo "2. Run security scan (demo mode)"
echo "3. Export results in multiple formats"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is required but not installed.${NC}"
    exit 1
fi

echo -e "${YELLOW}🔧 Installing dependencies...${NC}"
npm install --silent

echo -e "${YELLOW}🏗️  Building project...${NC}"
npm run build --silent

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""

# Test CAPTCHA generation
echo -e "${BLUE}🔐 Testing CAPTCHA generation...${NC}"
node -e "
const { generateCaptcha } = require('./dist/utils/api/captcha.js');
const result = generateCaptcha();
console.log('✅ CAPTCHA generated:', result.success ? 'SUCCESS' : 'FAILED');
if (result.success) {
  console.log('   ID:', result.data.id);
  console.log('   Image length:', result.data.image.length, 'characters');
}
"

echo ""

# Test scanner demo mode
echo -e "${BLUE}🔍 Running demo security scan...${NC}"
node -e "
(async () => {
  const { localScanner } = require('./dist/utils/scanners/localScanner.js');
  const result = await localScanner('example.com');
  console.log('✅ Demo scan completed');
  console.log('   Results found:', result.results.length);
  console.log('   Queries made:', result.queries);
  console.log('   Success rate:', result.success + '/' + (result.success + result.failed));
  
  // Show sample findings
  if (result.results.length > 0) {
    console.log('\\n📊 Sample findings:');
    result.results.slice(0, 2).forEach((finding, i) => {
      console.log(\`   \${i+1}. [\${finding.severity}] \${finding.source}\`);
      console.log(\`      \${finding.snippet.substring(0, 60)}...\`);
    });
  }
})();
"

echo ""

# Test export functionality
echo -e "${BLUE}📄 Testing export functionality...${NC}"
node -e "
(async () => {
  const { exportResults } = require('./dist/utils/api/export.js');
  
  const mockResults = [
    {
      source: 'Demo',
      url: 'https://example.com/test',
      snippet: 'Sample security finding for demo',
      severity: 'High',
      recommendation: 'This is a demo recommendation'
    }
  ];
  
  const mockMetadata = {
    domain: 'example.com',
    timestamp: new Date().toISOString(),
    scanDuration: 1000,
    queries: 1,
    success: 1,
    failed: 0
  };
  
  // Test JSON export
  const jsonResult = await exportResults({
    format: 'json',
    results: mockResults,
    metadata: mockMetadata
  });
  
  console.log('✅ JSON export:', jsonResult.success ? 'SUCCESS' : 'FAILED');
  
  // Test PDF export (placeholder)
  const pdfResult = await exportResults({
    format: 'pdf',
    results: mockResults,
    metadata: mockMetadata
  });
  
  console.log('✅ PDF export:', pdfResult.success ? 'SUCCESS' : 'FAILED');
  
  // Test Excel export (placeholder)
  const excelResult = await exportResults({
    format: 'excel',
    results: mockResults,
    metadata: mockMetadata
  });
  
  console.log('✅ Excel export:', excelResult.success ? 'SUCCESS' : 'FAILED');
})();
"

echo ""
echo -e "${GREEN}🎉 Demo completed successfully!${NC}"
echo ""
echo -e "${BLUE}📖 Next steps:${NC}"
echo "1. Start the development server: npm run dev"
echo "2. Open http://localhost:3000 in your browser"
echo "3. Try the scanner with demo mode (no API keys needed)"
echo "4. Configure API keys for live scanning"
echo ""
echo -e "${YELLOW}📚 Documentation:${NC}"
echo "- README.md - Setup and usage instructions"
echo "- postman_collection.json - API testing collection"
echo "- /src/utils/tests/ - Unit tests"
echo ""
echo -e "${GREEN}✨ H-CARF Scanner is ready to use!${NC}"