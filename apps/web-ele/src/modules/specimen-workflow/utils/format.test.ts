import { describe, expect, it } from 'vitest';

import { formatCurrentNode } from './format';

describe('format', () => {
  it('formats known current node values to Chinese labels', () => {
    expect(formatCurrentNode('REMOVAL')).toBe('离体确认');
    expect(formatCurrentNode('SUBMITTED')).toBe('已提交');
  });

  it('returns a dash for empty current node values', () => {
    expect(formatCurrentNode(null)).toBe('-');
    expect(formatCurrentNode('')).toBe('-');
    expect(formatCurrentNode('   ')).toBe('-');
  });

  it('falls back to the original current node value when no mapping exists', () => {
    expect(formatCurrentNode('UNKNOWN_NODE')).toBe('UNKNOWN_NODE');
  });
});
