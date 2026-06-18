import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const decisionsPath = path.join(ROOT, 'docs/memory/DECISIONS.md');
const detailPath = path.join(ROOT, 'docs/reviews/decisions-business-detail.md');
const body = fs.readFileSync(decisionsPath, 'utf8');

const rows = [];
for (const line of body.split(/\r?\n/)) {
  const match = line.match(
    /^\| (DEC-\d{8}-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/,
  );
  if (!match) continue;
  rows.push({
    id: match[1],
    date: match[2].trim(),
    topic: match[3].trim(),
    decision: match[4].trim(),
    impact: match[5].trim(),
  });
}

function shorten(text, max) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

fs.writeFileSync(
  detailPath,
  `# Business Decisions Detail

Full contract text for active business decisions. Index: [docs/memory/DECISIONS.md](../memory/DECISIONS.md). Governance-process history: [decisions-archive.md](./decisions-archive.md).

| ID | Date | Topic | Decision | Impact |
| --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${row.id} | ${row.date} | ${row.topic} | ${row.decision} | ${row.impact} |`,
  )
  .join('\n')}
`,
);

const index = `# DECISIONS.md

## Purpose

**Index** of active business and cross-repo decisions. Full contract text: [docs/reviews/decisions-business-detail.md](../reviews/decisions-business-detail.md). Governance-process history: [docs/reviews/decisions-archive.md](../reviews/decisions-archive.md).

## Active Decisions (index)

| ID | Date | Topic | Summary |
| --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${row.id} | ${row.date} | ${shorten(row.topic, 72)} | ${shorten(row.decision, 120)} |`,
  )
  .join('\n')}

## Update Rules

- Add decisions only when they change future behavior; append full row to \`decisions-business-detail.md\` and a summary line here.
- Superseded decisions move to \`docs/reviews/decisions-archive.md\`; do not delete IDs.
- Cross-repo items must reference sibling backend paths in the detail file.
`;

fs.writeFileSync(decisionsPath, index);
console.log(
  `DECISIONS indexed: ${rows.length} rows, index ${index.split(/\r?\n/).length} lines, detail ${fs.readFileSync(detailPath, 'utf8').split(/\r?\n/).length} lines`,
);
