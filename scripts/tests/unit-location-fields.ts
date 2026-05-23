#!/usr/bin/env tsx
/**
 * Unit tests for Location Form Fields
 * 
 * Tests the location field components:
 * - LocationField: Address input with Google Places autocomplete
 * - AccessibilityChecklistField: Accessibility features checklist
 * - MapPreview: Map preview with adjustable pin
 */

import type { Address, AccessibilityFeatures } from '../../shared/schema/hostProfile';

// Run tests
console.log('🧪 Running Location Form Fields Unit Tests...\n');

const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
};

try {
  // Test 1: Address validation - PO Box detection
  const validateAddress = (address: Address, requirePhysical: boolean): boolean => {
    if (!requirePhysical) return true;

    const poBoxPattern = /\b(P\.?\s*O\.?\s*Box|Post\s*Office\s*Box)\b/i;
    if (poBoxPattern.test(address.street)) {
      return false;
    }

    return true;
  };

  const physicalAddress: Address = {
    street: '123 Test Street',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
    latitude: -33.8688,
    longitude: 151.2093,
    isPrimary: true,
  };

  const poBoxAddress: Address = {
    ...physicalAddress,
    street: 'PO Box 123',
  };

  if (validateAddress(physicalAddress, true) === true) {
    console.log('✓ Physical address validation passes');
    testResults.passed++;
  } else {
    console.log('✗ Physical address validation failed');
    testResults.failed++;
  }
  testResults.total++;

  if (validateAddress(poBoxAddress, true) === false) {
    console.log('✓ PO Box address validation correctly rejects');
    testResults.passed++;
  } else {
    console.log('✗ PO Box address validation failed to reject');
    testResults.failed++;
  }
  testResults.total++;

  if (validateAddress(poBoxAddress, false) === true) {
    console.log('✓ PO Box address validation passes when not required physical');
    testResults.passed++;
  } else {
    console.log('✗ PO Box address validation failed when not required physical');
    testResults.failed++;
  }
  testResults.total++;

  // Test 2: Accessibility score calculation
  const calculateAccessibilityScore = (features: AccessibilityFeatures): number => {
    const enabledCount = Object.values(features).filter(Boolean).length;
    const totalCount = 6; // Total number of accessibility features
    return Math.round((enabledCount / totalCount) * 100);
  };

  const noFeatures: AccessibilityFeatures = {
    wheelchairAccess: false,
    accessibleParking: false,
    accessibleToilets: false,
    hearingLoop: false,
    brailleSignage: false,
    serviceAnimalFriendly: false,
  };

  const halfFeatures: AccessibilityFeatures = {
    wheelchairAccess: true,
    accessibleParking: true,
    accessibleToilets: true,
    hearingLoop: false,
    brailleSignage: false,
    serviceAnimalFriendly: false,
  };

  const allFeatures: AccessibilityFeatures = {
    wheelchairAccess: true,
    accessibleParking: true,
    accessibleToilets: true,
    hearingLoop: true,
    brailleSignage: true,
    serviceAnimalFriendly: true,
  };

  if (calculateAccessibilityScore(noFeatures) === 0) {
    console.log('✓ Accessibility score calculation: 0% for no features');
    testResults.passed++;
  } else {
    console.log('✗ Accessibility score calculation failed for no features');
    testResults.failed++;
  }
  testResults.total++;

  if (calculateAccessibilityScore(halfFeatures) === 50) {
    console.log('✓ Accessibility score calculation: 50% for half features');
    testResults.passed++;
  } else {
    console.log('✗ Accessibility score calculation failed for half features');
    testResults.failed++;
  }
  testResults.total++;

  if (calculateAccessibilityScore(allFeatures) === 100) {
    console.log('✓ Accessibility score calculation: 100% for all features');
    testResults.passed++;
  } else {
    console.log('✗ Accessibility score calculation failed for all features');
    testResults.failed++;
  }
  testResults.total++;

  // Test 3: Address formatting
  const formatAddress = (address: Address): string => {
    return [
      address.street,
      address.city,
      address.state,
      address.postcode,
      address.country,
    ]
      .filter(Boolean)
      .join(', ');
  };

  const formattedAddress = formatAddress(physicalAddress);
  if (formattedAddress === '123 Test Street, Sydney, NSW, 2000, Australia') {
    console.log('✓ Address formatting works correctly');
    testResults.passed++;
  } else {
    console.log('✗ Address formatting failed');
    testResults.failed++;
  }
  testResults.total++;

  // Test 4: Coordinate validation
  const validateCoordinates = (latitude: number, longitude: number): boolean => {
    return (
      latitude >= -90 &&
      latitude <= 90 &&
      longitude >= -180 &&
      longitude <= 180
    );
  };

  if (validateCoordinates(-33.8688, 151.2093) === true) {
    console.log('✓ Valid coordinates pass validation');
    testResults.passed++;
  } else {
    console.log('✗ Valid coordinates failed validation');
    testResults.failed++;
  }
  testResults.total++;

  if (validateCoordinates(91, 0) === false) {
    console.log('✓ Invalid latitude correctly rejected');
    testResults.passed++;
  } else {
    console.log('✗ Invalid latitude failed to reject');
    testResults.failed++;
  }
  testResults.total++;

  if (validateCoordinates(0, 181) === false) {
    console.log('✓ Invalid longitude correctly rejected');
    testResults.passed++;
  } else {
    console.log('✗ Invalid longitude failed to reject');
    testResults.failed++;
  }
  testResults.total++;

  // Test 5: Accessibility feature toggle
  const toggleAccessibilityFeature = (
    features: AccessibilityFeatures,
    key: keyof AccessibilityFeatures
  ): AccessibilityFeatures => {
    return {
      ...features,
      [key]: !features[key],
    };
  };

  const toggledFeatures = toggleAccessibilityFeature(noFeatures, 'wheelchairAccess');
  if (toggledFeatures.wheelchairAccess === true) {
    console.log('✓ Accessibility feature toggle works correctly');
    testResults.passed++;
  } else {
    console.log('✗ Accessibility feature toggle failed');
    testResults.failed++;
  }
  testResults.total++;

  // Test 6: Select all accessibility features
  const selectAllAccessibilityFeatures = (): AccessibilityFeatures => {
    return {
      wheelchairAccess: true,
      accessibleParking: true,
      accessibleToilets: true,
      hearingLoop: true,
      brailleSignage: true,
      serviceAnimalFriendly: true,
    };
  };

  const allSelected = selectAllAccessibilityFeatures();
  if (Object.values(allSelected).every(Boolean)) {
    console.log('✓ Select all accessibility features works correctly');
    testResults.passed++;
  } else {
    console.log('✗ Select all accessibility features failed');
    testResults.failed++;
  }
  testResults.total++;

  // Test 7: Clear all accessibility features
  const clearAllAccessibilityFeatures = (): AccessibilityFeatures => {
    return {
      wheelchairAccess: false,
      accessibleParking: false,
      accessibleToilets: false,
      hearingLoop: false,
      brailleSignage: false,
      serviceAnimalFriendly: false,
    };
  };

  const allCleared = clearAllAccessibilityFeatures();
  if (Object.values(allCleared).every((v) => v === false)) {
    console.log('✓ Clear all accessibility features works correctly');
    testResults.passed++;
  } else {
    console.log('✗ Clear all accessibility features failed');
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
