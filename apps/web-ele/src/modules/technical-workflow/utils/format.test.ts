import { describe, expect, it } from 'vitest';

import { formatSlicingSlideDisplayNo } from './format';

describe('formatSlicingSlideDisplayNo', () => {
  it('prefers slideNo when present', () => {
    expect(formatSlicingSlideDisplayNo('A1', 'A1')).toBe('A1');
    expect(formatSlicingSlideDisplayNo('A1-A2', 'A1+A2')).toBe('A1-A2');
  });

  it('falls back to embeddingBoxNo when slideNo is empty', () => {
    expect(formatSlicingSlideDisplayNo(null, 'A1')).toBe('A1');
    expect(formatSlicingSlideDisplayNo('  ', 'B2')).toBe('B2');
  });

  it('converts merged embedding box fallback from plus to hyphen', () => {
    expect(formatSlicingSlideDisplayNo(null, 'A1+A2')).toBe('A1-A2');
    expect(formatSlicingSlideDisplayNo('', 'B1+B2')).toBe('B1-B2');
  });

  it('returns dash when both slideNo and embeddingBoxNo are empty', () => {
    expect(formatSlicingSlideDisplayNo(null, null)).toBe('-');
    expect(formatSlicingSlideDisplayNo('', '  ')).toBe('-');
  });
});
