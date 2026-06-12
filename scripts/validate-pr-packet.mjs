import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const requiredSections = [
  'Summary',
  'Dynamic Workflow',
  'Dynamic Tests',
  'Memory Update Packet',
];

const requiredFields = [
  ['Summary', 'Validation'],
  ['Summary', 'Risks'],
  ['Dynamic Workflow', 'Primary Workflow'],
  ['Dynamic Tests', 'Actual results'],
  ['Memory Update Packet', 'Updated memory files'],
  ['Memory Update Packet', 'Not updated memory files and reasons'],
];

function extractSection(body, sectionName) {
  const lines = body.split(/\r?\n/);
  const startIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${sectionName}`.toLowerCase(),
  );
  if (startIndex === -1) {
    return null;
  }

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && /^##\s+/.test(line.trim()),
  );
  const sectionLines = lines.slice(
    startIndex + 1,
    endIndex === -1 ? undefined : endIndex,
  );
  return sectionLines.join('\n').trim();
}

function extractField(sectionBody, fieldName) {
  const prefix = `- ${fieldName}:`;
  const fieldLine = sectionBody
    .split(/\r?\n/)
    .find((line) => line.trim().toLowerCase().startsWith(prefix.toLowerCase()));
  return fieldLine?.trim().slice(prefix.length).trim() ?? null;
}

function hasSubstantiveValue(value) {
  if (value === null) {
    return false;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    return false;
  }

  return !/^(n\/a|na|none|not applicable)$/i.test(normalized);
}

function readPullRequestBodyFromEvent(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  return event.pull_request?.body ?? '';
}

export function validatePullRequestPacket(body = '') {
  const errors = [];

  for (const sectionName of requiredSections) {
    if (extractSection(body, sectionName) === null) {
      errors.push(`Missing section: ${sectionName}`);
    }
  }

  for (const [sectionName, fieldName] of requiredFields) {
    const sectionBody = extractSection(body, sectionName);
    if (sectionBody === null) {
      continue;
    }

    const fieldValue = extractField(sectionBody, fieldName);
    if (fieldValue === null) {
      errors.push(`Missing field: ${sectionName} > ${fieldName}`);
      continue;
    }

    if (fieldValue.length === 0) {
      errors.push(`Empty field: ${sectionName} > ${fieldName}`);
    }
  }

  const dynamicWorkflowBody = extractSection(body, 'Dynamic Workflow');
  const redTeamBody = extractSection(body, 'Red Team');

  if (dynamicWorkflowBody && redTeamBody) {
    const requiredModifiers =
      extractField(dynamicWorkflowBody, 'Required modifiers') ?? '';
    const attackResult = extractField(redTeamBody, 'Attack result');
    const residualRisk = extractField(redTeamBody, 'Residual risk');
    const checkerSource = extractField(redTeamBody, 'Checker / reviewer source');
    const checklistMarked = redTeamBody
      .split(/\r?\n/)
      .some((line) => /^\s*-\s*\[[xX]\]/.test(line));

    const redTeamDeclared =
      /\bred team\b/i.test(requiredModifiers) ||
      checklistMarked ||
      hasSubstantiveValue(attackResult) ||
      hasSubstantiveValue(residualRisk) ||
      hasSubstantiveValue(checkerSource);

    if (redTeamDeclared) {
      if (!hasSubstantiveValue(attackResult)) {
        errors.push('Red Team evidence missing: Attack result');
      }

      if (!hasSubstantiveValue(residualRisk)) {
        errors.push('Red Team evidence missing: Residual risk');
      }
    }
  }

  return {
    errors,
    isValid: errors.length === 0,
  };
}

function resolveBodyFromArgs(argv, env) {
  const fileFlagIndex = argv.indexOf('--body-file');
  if (fileFlagIndex !== -1) {
    const bodyFile = argv[fileFlagIndex + 1];
    if (!bodyFile) {
      throw new Error('Missing value for --body-file');
    }
    return readFileSync(bodyFile, 'utf8');
  }

  if (env.GITHUB_EVENT_PATH) {
    return readPullRequestBodyFromEvent(env.GITHUB_EVENT_PATH);
  }

  throw new Error('Provide --body-file <path> or GITHUB_EVENT_PATH');
}

function main() {
  const body = resolveBodyFromArgs(process.argv.slice(2), process.env);
  const result = validatePullRequestPacket(body);

  if (result.isValid) {
    console.log('PR Workflow Packet validation passed.');
    return;
  }

  console.error('PR Workflow Packet validation failed:');
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
}

const currentFile = fileURLToPath(import.meta.url);
if (basename(process.argv[1] ?? '') === basename(currentFile)) {
  main();
}
