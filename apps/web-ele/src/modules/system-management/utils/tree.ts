export interface BasicTreeNode {
  children?: BasicTreeNode[];
  id: string;
}

export function filterTreeByKeyword<T extends BasicTreeNode>(
  tree: T[],
  getLabel: (node: T) => string,
  keyword: string,
): T[] {
  if (!Array.isArray(tree)) {
    return [];
  }

  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return tree;
  }

  const filteredNodes = tree
    .map((node) => {
      const children = filterTreeByKeyword(
        (Array.isArray(node.children) ? node.children : []) as T[],
        getLabel,
        keyword,
      );
      const matched = getLabel(node).toLowerCase().includes(normalizedKeyword);
      if (!matched && children.length === 0) {
        return null;
      }
      return {
        ...node,
        children,
      };
    })
    .filter(Boolean);

  return filteredNodes as T[];
}

export function flattenTree<T extends BasicTreeNode>(
  tree: T[],
  collector: (node: T) => void,
) {
  if (!Array.isArray(tree)) {
    return;
  }

  tree.forEach((node) => {
    collector(node);
    flattenTree(
      (Array.isArray(node.children) ? node.children : []) as T[],
      collector,
    );
  });
}

export function findTreeNodeById<T extends BasicTreeNode>(
  tree: T[],
  id: string,
): null | T {
  if (!Array.isArray(tree)) {
    return null;
  }

  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    const matched = findTreeNodeById(
      (Array.isArray(node.children) ? node.children : []) as T[],
      id,
    );
    if (matched) {
      return matched;
    }
  }
  return null;
}

export function getTreeExpandedKeys<T extends BasicTreeNode>(tree: T[]) {
  if (!Array.isArray(tree)) {
    return [];
  }

  const keys: string[] = [];
  flattenTree(tree, (node) => {
    keys.push(node.id);
  });
  return keys;
}

export function normalizeTreeCheckedKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
