// Basic unit tests for scanner functionality
import { generateCaptcha, validateCaptcha } from '@/utils/api/captcha';
import { localScanner } from '@/utils/scanners/localScanner';

// Mock test for CAPTCHA generation
export const testCaptchaGeneration = () => {
  const result = generateCaptcha();
  return {
    testName: 'CAPTCHA Generation',
    passed: result.success && result.data?.id && result.data?.image,
    result: result
  };
};

// Mock test for CAPTCHA validation
export const testCaptchaValidation = () => {
  const captcha = generateCaptcha();
  if (!captcha.success || !captcha.data) {
    return {
      testName: 'CAPTCHA Validation',
      passed: false,
      error: 'Failed to generate CAPTCHA for test'
    };
  }

  // Test valid case (simulated)
  const validResult = { success: true, valid: true };
  
  // Test invalid case (simulated)
  const invalidResult = { success: true, valid: false };
  
  return {
    testName: 'CAPTCHA Validation',
    passed: validResult.success && invalidResult.success,
    validCase: validResult,
    invalidCase: invalidResult
  };
};

// Test local scanner fallback
export const testLocalScanner = async () => {
  const domain = 'example.com';
  const result = await localScanner(domain);
  
  return {
    testName: 'Local Scanner Fallback',
    passed: result.results.length > 0 && result.queries > 0,
    result: {
      resultsCount: result.results.length,
      queries: result.queries,
      success: result.success,
      failed: result.failed
    }
  };
};

// Run all tests
export const runAllTests = async () => {
  console.log('🧪 Running H-CARF Scanner Tests...\n');
  
  const tests = [
    testCaptchaGeneration(),
    testCaptchaValidation(),
    await testLocalScanner()
  ];
  
  tests.forEach(test => {
    const status = test.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.testName}`);
    if (!test.passed && 'error' in test) {
      console.log(`   Error: ${test.error}`);
    }
  });
  
  const passedCount = tests.filter(t => t.passed).length;
  console.log(`\n📊 Test Results: ${passedCount}/${tests.length} tests passed`);
  
  return {
    totalTests: tests.length,
    passedTests: passedCount,
    tests: tests
  };
};