import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REVIEWS = path.join(ROOT, 'docs/reviews');

const GOVERNANCE_DECISION_IDS = new Set([
  'DEC-20260608-001',
  'DEC-20260608-002',
  'DEC-20260608-003',
  'DEC-20260610-001',
  'DEC-20260611-001',
  'DEC-20260611-006',
  'DEC-20260612-001',
  'DEC-20260612-002',
  'DEC-20260612-003',
  'DEC-20260612-004',
  'DEC-20260612-005',
  'DEC-20260612-006',
  'DEC-20260612-007',
  'DEC-20260612-008',
  'DEC-20260612-009',
  'DEC-20260612-010',
  'DEC-20260612-011',
  'DEC-20260612-012',
  'DEC-20260613-001',
  'DEC-20260613-002',
  'DEC-20260613-003',
  'DEC-20260614-001',
  'DEC-20260615-001',
  'DEC-20260615-002',
  'DEC-20260615-003',
  'DEC-20260618-004',
]);

const SUPERSEDED_ONLY_IDS = new Set(['DEC-20260611-011', 'DEC-20260617-004']);

function parseTableRows(body, idPattern) {
  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(
      new RegExp(`^\\| (${idPattern}) \\|([^|]*)\\|([^|]*)\\|([^|]*)\\|([^|]*)\\|([^|]*)\\|([^|]*)\\|`),
    );
    if (!match) continue;
    rows.push({
      id: match[1],
      date: match[2].trim(),
      context: match[3].trim(),
      decision: match[4].trim(),
      rationale: match[5].trim(),
      impact: match[6].trim(),
      revisit: match[7].trim(),
      raw: line,
    });
  }
  return rows;
}

function shorten(text, max = 180) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function parseBugRows(body) {
  const rows = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(
      /^\| (BUG-\d{8}-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/,
    );
    if (!match) continue;
    rows.push({
      id: match[1],
      status: match[2].trim(),
      reproduction: match[3].trim(),
      impact: match[4].trim(),
      workaround: match[5].trim(),
      verification: match[6].trim(),
      raw: line,
    });
  }
  return rows;
}

function archiveKnownBugs() {
  const bugsPath = path.join(ROOT, 'docs/memory/KNOWN_BUGS.md');
  const body = fs.readFileSync(bugsPath, 'utf8');
  const rows = parseBugRows(body);
  const last5 = rows.slice(-5);

  fs.mkdirSync(REVIEWS, { recursive: true });
  fs.writeFileSync(
    path.join(REVIEWS, 'bug-archive.md'),
    `# Bug Archive

Resolved bugs archived from \`docs/memory/KNOWN_BUGS.md\` on 2026-06-18. IDs are preserved.

## Entry Format (full)

| ID | Status | Reproduction | Impact | Workaround | Verification |
| --- | --- | --- | --- | --- | --- |
${rows.map((row) => row.raw).join('\n')}
`,
  );

  const slim = `# KNOWN_BUGS.md

## Purpose

Track **Open** bugs and a short tail of recently resolved items. Full resolved history: [docs/reviews/bug-archive.md](../reviews/bug-archive.md).

## Open Bugs

| ID | Status | Summary | Impact |
| --- | --- | --- | --- |
| _(none)_ | — | No open bugs at last archive (2026-06-18). | — |

## Recently Resolved (summary only)

| ID | Resolved | Summary |
| --- | --- | --- |
${last5
  .map(
    (row) =>
      `| ${row.id} | ${row.status} | ${shorten(row.reproduction, 140)} |`,
  )
  .join('\n')}

## Update Rules

- Record only concrete, reproducible, or user-reported bugs.
- When Resolved summaries exceed five rows, move older rows to \`docs/reviews/bug-archive.md\`.
- Open bugs keep full reproduction; archive keeps full detail.
`;

  fs.writeFileSync(bugsPath, slim);
  console.log(`KNOWN_BUGS slimmed: ${rows.length} archived, ${slim.split(/\r?\n/).length} lines`);
}

function archiveDecisions() {
  const decisionsPath = path.join(ROOT, 'docs/memory/DECISIONS.md');
  const body = fs.readFileSync(decisionsPath, 'utf8');
  const rows = parseTableRows(body, 'DEC-\\d{8}-\\d{3}');

  const archived = [];
  const active = [];

  for (const row of rows) {
    const isGovernance = GOVERNANCE_DECISION_IDS.has(row.id);
    const isSupersededOnly =
      SUPERSEDED_ONLY_IDS.has(row.id) ||
      /Historical only/i.test(row.revisit) ||
      (/Superseded by/i.test(row.impact) && !/supersedes/i.test(row.decision));

    if (isGovernance || isSupersededOnly) {
      archived.push(row);
    } else {
      active.push(row);
    }
  }

  fs.writeFileSync(
    path.join(REVIEWS, 'decisions-archive.md'),
    `# Decisions Archive

Governance-process and superseded decisions archived from \`docs/memory/DECISIONS.md\` on 2026-06-18.

| ID | Date | Context | Decision | Rationale | Impact | Revisit When |
| --- | --- | --- | --- | --- | --- | --- |
${archived.map((row) => row.raw).join('\n')}
`,
  );

  const slim = `# DECISIONS.md

## Purpose

Active business and cross-repo decisions. Governance-process history: [docs/reviews/decisions-archive.md](../reviews/decisions-archive.md).

## Active Decisions

| ID | Date | Topic | Decision | Impact |
| --- | --- | --- | --- | --- |
${active
  .map(
    (row) =>
      `| ${row.id} | ${row.date} | ${shorten(row.context, 80)} | ${shorten(row.decision, 200)} | ${shorten(row.impact, 160)} |`,
  )
  .join('\n')}

## Update Rules

- Add decisions only when they change future behavior.
- Superseded decisions move to \`docs/reviews/decisions-archive.md\`; do not delete IDs.
- Cross-repo items must reference sibling backend paths.
`;

  fs.writeFileSync(decisionsPath, slim);
  console.log(
    `DECISIONS slimmed: ${archived.length} archived, ${active.length} active, ${slim.split(/\r?\n/).length} lines`,
  );
}

function archiveTechDebt() {
  const debtPath = path.join(ROOT, 'docs/memory/TECH_DEBT.md');
  const body = fs.readFileSync(debtPath, 'utf8');
  const rows = parseTableRows(body, 'TD-\\d{8}-\\d{3}').map((row) => ({
    ...row,
    status: row.impact.includes('Open') ? 'Open' : row.raw.includes('| Open |') ? 'Open' : 'Resolved',
  }));

  // Re-parse with correct columns for TECH_DEBT format
  const debtRows = [];
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(
      /^\| (TD-\d{8}-\d{3}) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/,
    );
    if (!match) continue;
    debtRows.push({
      id: match[1],
      severity: match[2].trim(),
      source: match[3].trim(),
      impact: match[4].trim(),
      action: match[5].trim(),
      status: match[6].trim(),
      raw: line,
    });
  }

  const open = debtRows.filter((row) => row.status === 'Open');
  const resolved = debtRows.filter((row) => row.status === 'Resolved');

  fs.writeFileSync(
    path.join(REVIEWS, 'tech-debt-archive.md'),
    `# Tech Debt Archive

Resolved items archived from \`docs/memory/TECH_DEBT.md\` on 2026-06-18.

| ID | Severity | Source | Impact | Suggested Action | Status |
| --- | --- | --- | --- | --- | --- |
${resolved.map((row) => row.raw).join('\n')}
`,
  );

  const slim = `# TECH_DEBT.md

## Purpose

Track **Open** technical debt. Resolved history: [docs/reviews/tech-debt-archive.md](../reviews/tech-debt-archive.md).

## Open Items

| ID | Severity | Source | Impact | Suggested Action |
| --- | --- | --- | --- | --- |
${open
  .map(
    (row) =>
      `| ${row.id} | ${row.severity} | ${shorten(row.source, 60)} | ${shorten(row.impact, 120)} | ${shorten(row.action, 100)} |`,
  )
  .join('\n')}

## Update Rules

- ID format: \`TD-YYYYMMDD-NNN\`.
- Update status instead of deleting; archive Resolved rows when the ledger grows.
`;

  fs.writeFileSync(debtPath, slim);
  console.log(
    `TECH_DEBT slimmed: ${resolved.length} archived, ${open.length} open, ${slim.split(/\r?\n/).length} lines`,
  );
}

archiveKnownBugs();
archiveDecisions();
archiveTechDebt();
