export interface OutlineNode {
  level: number;
  text: string;
  line: number;
}

export function parseOutline(markdown: string): OutlineNode[] {
  const nodes: OutlineNode[] = [];
  let fenced = false;
  markdown.split(/\r?\n/).forEach((line, lineNumber) => {
    if (/^\s*```/.test(line)) {
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    const match = /^(#{1,3})\s+(.+)$/.exec(line);
    if (match) nodes.push({ level: match[1].length, text: match[2], line: lineNumber });
  });
  return nodes;
}
