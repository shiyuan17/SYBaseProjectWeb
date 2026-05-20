export interface BasicTreeNode {
  children?: BasicTreeNode[];
  id: string;
}

export function filterTreeByKeyword<T extends BasicTreeNode>(
  tree: T[],
  getLabel: (node: T) => string,
  keyword: string,
): T[] {
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return tree;
  }

  const filteredNodes = tree
    .map((node) => {
      const children = filterTreeByKeyword(
        (node.children ?? []) as T[],
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
  tree.forEach((node) => {
    collector(node);
    flattenTree((node.children ?? []) as T[], collector);
  });
}

export function findTreeNodeById<T extends BasicTreeNode>(
  tree: T[],
  id: string,
): null | T {
  for (const node of tree) {
    if (node.id === id) {
      return node;
    }
    const matched = findTreeNodeById((node.children ?? []) as T[], id);
    if (matched) {
      return matched;
    }
  }
  return null;
}

export function getTreeExpandedKeys<T extends BasicTreeNode>(tree: T[]) {
  const keys: string[] = [];
  flattenTree(tree, (node) => {
    keys.push(node.id);
  });
  return keys;
}
