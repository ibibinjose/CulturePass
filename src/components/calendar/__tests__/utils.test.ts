import {
  getDaysInMonth,
  getFirstDayOfMonth,
  formatDateKey,
  formatPrice,
  toSafeDateKey,
} from '../utils';

describe('Calendar Utils', () => {
  describe('getDaysInMonth', () => {
    it('returns 31 days for January', () => {
      expect(getDaysInMonth(2024, 0)).toBe(31);
    });

    it('returns 29 days for February in a leap year (2024)', () => {
      expect(getDaysInMonth(2024, 1)).toBe(29);
    });

    it('returns 28 days for February in a non-leap year (2023)', () => {
      expect(getDaysInMonth(2023, 1)).toBe(28);
    });

    it('returns 30 days for April', () => {
      expect(getDaysInMonth(2024, 3)).toBe(30);
    });

    it('returns 31 days for December', () => {
      expect(getDaysInMonth(2024, 11)).toBe(31);
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('returns 1 (Monday) for January 2024', () => {
      expect(getFirstDayOfMonth(2024, 0)).toBe(1);
    });

    it('returns 4 (Thursday) for February 2024', () => {
      expect(getFirstDayOfMonth(2024, 1)).toBe(4);
    });

    it('returns 0 (Sunday) for January 2023', () => {
      expect(getFirstDayOfMonth(2023, 0)).toBe(0);
    });

    it('returns 6 (Saturday) for June 2024', () => {
      expect(getFirstDayOfMonth(2024, 5)).toBe(6);
    });
  });

  describe('formatDateKey', () => {
    it('formats single digit month and day with padding', () => {
      expect(formatDateKey(2024, 0, 1)).toBe('2024-01-01');
    });

    it('formats double digit month and day', () => {
      expect(formatDateKey(2024, 11, 31)).toBe('2024-12-31');
    });
  });

  describe('formatPrice', () => {
    it('returns "Free" when price is 0', () => {
      expect(formatPrice(0)).toBe('Free');
    });

    it('formats cents to dollars without decimals', () => {
      expect(formatPrice(1000)).toBe('$10');
    });

    it('rounds to the nearest dollar', () => {
      expect(formatPrice(1250)).toBe('$13');
      expect(formatPrice(1240)).toBe('$12');
    });
  });

  describe('toSafeDateKey', () => {
    it('returns the date string if it is valid (YYYY-MM-DD)', () => {
      expect(toSafeDateKey('2024-01-01')).toBe('2024-01-01');
    });

    it('returns null for invalid format', () => {
      expect(toSafeDateKey('2024/01/01')).toBeNull();
      expect(toSafeDateKey('01-01-2024')).toBeNull();
      expect(toSafeDateKey('abc')).toBeNull();
    });

    it('returns null for partial dates', () => {
      expect(toSafeDateKey('2024-01')).toBeNull();
    });

    it('returns null for null or undefined input', () => {
      expect(toSafeDateKey(null)).toBeNull();
      expect(toSafeDateKey(undefined)).toBeNull();
    });
  });
});