// src/tests/unit/helpers.test.js
import { generateBookingReference } from '../../utils/helpers.js';

describe('Helpers Utility - generateBookingReference', () => {
  test('should generate a reference starting with CV-', () => {
    const ref = generateBookingReference();
    expect(ref.startsWith('CV-')).toBe(true);
  });

  test('should generate a reference of length 11', () => {
    const ref = generateBookingReference();
    expect(ref.length).toBe(11);
  });

  test('should generate unique references', () => {
    const ref1 = generateBookingReference();
    const ref2 = generateBookingReference();
    expect(ref1).not.toBe(ref2);
  });

  test('should contain only alphanumeric characters after prefix', () => {
    const ref = generateBookingReference();
    const suffix = ref.substring(3);
    expect(/^[A-Z0-9]+$/.test(suffix)).toBe(true);
  });
});
