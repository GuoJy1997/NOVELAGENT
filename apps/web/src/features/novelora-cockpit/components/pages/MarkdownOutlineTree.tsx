import type { OutlineNode } from '../../lib/markdownOutline';

interface MarkdownOutlineTreeProps {
  nodes: OutlineNode[];
  onJump: (line: number) => void;
  heading?: string;
  emptyLabel?: string;
}

export function MarkdownOutlineTree({
  nodes,
  onJump,
  heading = '文档目录',
  emptyLabel = '暂无标题',
}: MarkdownOutlineTreeProps) {
  return (
    <div className="markdown-outline-tree">
      <h3>{heading}</h3>
      {nodes.length ? (
        <div className="markdown-outline-tree__list">
          {nodes.map((node) => (
            <button
              key={`${node.line}-${node.text}`}
              type="button"
              style={{ paddingLeft: `${12 + (node.level - 1) * 16}px` }}
              onClick={() => onJump(node.line)}
            >
              {node.text}
            </button>
          ))}
        </div>
      ) : (
        <p>{emptyLabel}</p>
      )}
    </div>
  );
}
