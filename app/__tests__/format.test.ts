/**
 * @format
 */

import {formatPrice, parseDate, toDateString} from '../src/utils/format';

describe('formatPrice', () => {
  test('shows small amounts in full', () => {
    expect(formatPrice(45000)).toBe('₹45,000');
  });

  test('shows lakhs and crores', () => {
    expect(formatPrice(4500000)).toBe('₹45 L');
    expect(formatPrice(1250000)).toBe('₹12.5 L');
    expect(formatPrice(32000000)).toBe('₹3.2 Cr');
  });

  test('marks monthly prices', () => {
    expect(formatPrice(45000, 'month')).toBe('₹45,000/mo');
    expect(formatPrice(150000, 'month')).toBe('₹1.5 L/mo');
  });
});

describe('dates', () => {
  test('keeps the local day before 5:30 am in India', () => {
    // 2:00 am on 3 November in India is still 2 November in UTC
    expect(toDateString(new Date('2026-11-02T20:30:00Z'))).toBe('2026-11-03');
  });

  test('pads single digit months and days', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('reads a saved date as that same local day', () => {
    const date = parseDate('2026-11-03');
    expect([date.getDate(), date.getHours()]).toEqual([3, 0]);
  });
});
