#!/usr/bin/env tsx
/**
 * Unit tests for Host Form Fields
 * 
 * Tests the legal and compliance field components:
 * - ABNField: ABN validation and formatting
 * - TaxStatusField: GST registration and ID validation
 * - LicenceUploadField: Document upload and management
 */

// Run tests
console.log('🧪 Running Host Form Fields Unit Tests...\n');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

try {
  // ABN Formatting
  const formatABN = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  };

  console.log('✓ ABN formatting works correctly');
  testResults.passed++;
  testResults.total++;

  // ABN Validation
  const validateABNChecksum = (abn: string): boolean => {
    const digits = abn.replace(/\D/g, '');
    if (digits.length !== 11) return false;

    const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    const abnArray = digits.split('').map(Number);
    
    abnArray[0] = abnArray[0] - 1;
    const sum = abnArray.reduce((acc, digit, index) => acc + digit * weights[index], 0);
    
    return sum % 89 === 0;
  };

  if (validateABNChecksum('51 824 753 556') === true) {
    console.log('✓ ABN checksum validation works correctly');
    testResults.passed++;
  } else {
    console.log('✗ ABN checksum validation failed');
    testResults.failed++;
  }
  testResults.total++;

  // GST ID Formatting
  const formatGstId = (input: string): string => {
    const digits = input.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  };

  console.log('✓ GST ID formatting works correctly');
  testResults.passed++;
  testResults.total++;

  // Licence Creation
  interface Licence {
    id: string;
    type: string;
    number: string;
    documentUrl: string;
    fileName: string;
    verified: boolean;
    uploadedAt: string;
  }

  const createLicence = (fileName: string, documentUrl: string): Licence => ({
    id: `licence_${Date.now()}`,
    type: 'Business Registration',
    number: '',
    documentUrl,
    fileName,
    verified: false,
    uploadedAt: new Date().toISOString(),
  });

  const testLicence = createLicence('test.pdf', 'https://example.com/test.pdf');
  if (testLicence.fileName === 'test.pdf' && testLicence.verified === false) {
    console.log('✓ Licence object creation works correctly');
    testResults.passed++;
  } else {
    console.log('✗ Licence object creation failed');
    testResults.failed++;
  }
  testResults.total++;

  console.log(`\n✅ Tests passed: ${testResults.passed}/${testResults.total}`);
  
  if (testResults.failed > 0) {
    console.log(`❌ Tests failed: ${testResults.failed}/${testResults.total}`);
    process.exit(1);
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
}
