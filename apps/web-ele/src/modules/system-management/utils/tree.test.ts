import { describe, expect, it } from 'vitest';

import {
  filterTreeByKeyword,
  findTreeNodeById,
  flattenTree,
  getTreeExpandedKeys,
  normalizeTreeCheckedKeys,
} from './tree';

interface TestTreeNode {
  children?: TestTreeNode[];
  id: string;
  label: string;
}

const sampleTree: TestTreeNode[] = [
  {
    children: [
      {
        id: 'child-1',
        label: '胃',
      },
    ],
    id: 'root-1',
    label: '消化系统',
  },
];

describe('tree utils', () => {
  it('filters tree nodes by keyword', () => {
    expect(
      filterTreeByKeyword(sampleTree, (node) => node.label, '胃').map(
        (node) => node.id,
      ),
    ).toEqual(['root-1']);
  });

  it('returns safe fallbacks for non-array tree inputs', () => {
    expect(
      filterTreeByKeyword(
        null as never,
        (node: TestTreeNode) => node.label,
        '胃',
      ),
    ).toEqual([]);
    expect(findTreeNodeById(null as never, 'root-1')).toBeNull();
    expect(getTreeExpandedKeys(null as never)).toEqual([]);

    const collector: string[] = [];
    expect(() =>
      flattenTree({ id: 'broken' } as never, (node: TestTreeNode) => {
        collector.push(node.id);
      }),
    ).not.toThrow();
    expect(collector).toEqual([]);
  });

  it('ignores invalid children values during traversal', () => {
    const visited: string[] = [];

    flattenTree(
      [
        {
          children: { id: 'unexpected', label: 'bad' } as never,
          id: 'root-2',
          label: '无效子节点',
        },
      ],
      (node) => {
        visited.push(node.id);
      },
    );

    expect(visited).toEqual(['root-2']);
  });

  it('normalizes checked tree key collections to string arrays', () => {
    expect(normalizeTreeCheckedKeys(['menu-1', 2, null, 'menu-2'])).toEqual([
      'menu-1',
      'menu-2',
    ]);
    expect(normalizeTreeCheckedKeys(null)).toEqual([]);
  });
});
