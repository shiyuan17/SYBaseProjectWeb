import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRequiredSections = ['Summary', 'Dynamic Workflow'];

const coreRequiredFields = [
  ['Summary', 'Validation'],
  ['Summary', 'Risks'],
  ['Dynamic Workflow', 'Primary Workflow'],
];

const fullRequiredSections = ['Dynamic Tests', 'Memory Update Packet'];

const fullRequiredFields = [
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

  return !/^(n\/a|na|none|not applicable|not triggered|omitted)$/i.test(
    normalized,
  );
}

function hasSubstantiveMemoryJudgment(sectionBody) {
  if (sectionBody === null) {
    return false;
  }

  const memoryField =
    extractField(sectionBody, 'Memory') ??
    extractField(sectionBody, 'Judgment') ??
    extractField(sectionBody, 'Memory judgment');
  if (hasSubstantiveValue(memoryField)) {
    return true;
  }

  const updatedMemoryFiles = extractField(sectionBody, 'Updated memory files');
  const notUpdatedMemoryFiles = extractField(
    sectionBody,
    'Not updated memory files and reasons',
  );
  return (
    hasSubstantiveValue(updatedMemoryFiles) ||
    hasSubstantiveValue(notUpdatedMemoryFiles)
  );
}

function readPullRequestBodyFromEvent(eventPath) {
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  return event.pull_request?.body ?? '';
}

function splitModifiers(value) {
  return value
    .split(/[,/|;]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function hasModifier(requiredModifiers, modifier) {
  return splitModifiers(requiredModifiers).includes(modifier.toLowerCase());
}

function resolvePacketTier(body) {
  const dynamicWorkflowBody = extractSection(body, 'Dynamic Workflow');
  if (dynamicWorkflowBody === null) {
    return {
      fullReasons: [],
      isFastPath: false,
      isFull: false,
      isLightweight: false,
      missingReason: false,
    };
  }

  const primaryWorkflow =
    extractField(dynamicWorkflowBody, 'Primary Workflow') ?? '';
  if (!/^(not applicable|n\/a)\b/i.test(primaryWorkflow.trim())) {
    const normalizedPrimaryWorkflow = primaryWorkflow.trim().toLowerCase();
    const requiredModifiers =
      extractField(dynamicWorkflowBody, 'Required modifiers') ?? '';
    const redZoneConfirmation =
      extractField(dynamicWorkflowBody, 'Red-zone confirmation') ?? '';
    const fullReasons = [];

    if (
      ['db', 'production debug', 'security'].includes(normalizedPrimaryWorkflow)
    ) {
      fullReasons.push(`primary workflow ${primaryWorkflow.trim()}`);
    }

    for (const modifier of [
      'Security',
      'DB',
      'Red Team',
      'Backend Cross-check',
      'Browser Verification',
    ]) {
      if (hasModifier(requiredModifiers, modifier)) {
        fullReasons.push(`modifier ${modifier}`);
      }
    }

    if (hasSubstantiveValue(redZoneConfirmation)) {
      fullReasons.push('red-zone confirmation');
    }

    return {
      fullReasons,
      isFastPath: false,
      isFull: fullReasons.length > 0,
      isLightweight: fullReasons.length === 0,
      missingReason: false,
    };
  }

  const reason = primaryWorkflow
    .trim()
    .replace(/^(not applicable|n\/a)\b/i, '')
    .replaceAll(/[\s():,.;—-]+/g, '');
  return {
    fullReasons: [],
    isFastPath: true,
    isFull: false,
    isLightweight: false,
    missingReason: reason.length === 0,
  };
}

function collectFullEvidenceRequirements(body) {
  const dynamicWorkflowBody = extractSection(body, 'Dynamic Workflow');
  if (dynamicWorkflowBody === null) {
    return [];
  }

  const primaryWorkflow = (
    extractField(dynamicWorkflowBody, 'Primary Workflow') ?? ''
  )
    .trim()
    .toLowerCase();
  const requiredModifiers =
    extractField(dynamicWorkflowBody, 'Required modifiers') ?? '';
  const redZoneConfirmation =
    extractField(dynamicWorkflowBody, 'Red-zone confirmation') ?? '';
  const requirements = [];

  if (
    primaryWorkflow === 'security' ||
    hasModifier(requiredModifiers, 'Security')
  ) {
    requirements.push('Dynamic Security');
  }

  if (primaryWorkflow === 'db' || hasModifier(requiredModifiers, 'DB')) {
    requirements.push('Dynamic Database');
  }

  if (hasModifier(requiredModifiers, 'Backend Cross-check')) {
    requirements.push('Cross-Repo Evidence');
  }

  if (hasModifier(requiredModifiers, 'Browser Verification')) {
    requirements.push('Dynamic Simulation');
  }

  if (
    ['db', 'production debug', 'security'].includes(primaryWorkflow) ||
    hasModifier(requiredModifiers, 'Red Team') ||
    hasSubstantiveValue(redZoneConfirmation)
  ) {
    requirements.push('Red Team');
  }

  return [...new Set(requirements)];
}

export function validatePullRequestPacket(body = '') {
  const errors = [];

  // Packet tiers:
  // - Fast Path may omit implementation-only evidence blocks.
  // - Lightweight keeps core validation and memory fields.
  // - Full requires the evidence sections implied by high-risk workflows/modifiers.
  const { isFastPath, isFull, missingReason } = resolvePacketTier(body);
  if (missingReason) {
    errors.push(
      'Fast path requires a brief reason: Primary Workflow must be "Not applicable (<reason>)"',
    );
  }

  for (const sectionName of coreRequiredSections) {
    if (extractSection(body, sectionName) === null) {
      errors.push(`Missing section: ${sectionName}`);
    }
  }

  for (const [sectionName, fieldName] of coreRequiredFields) {
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

  if (isFull) {
    for (const sectionName of fullRequiredSections) {
      if (extractSection(body, sectionName) === null) {
        errors.push(`Missing section: ${sectionName}`);
      }
    }

    for (const [sectionName, fieldName] of fullRequiredFields) {
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
  } else {
    const memoryUpdateBody = extractSection(body, 'Memory Update Packet');
    if (
      memoryUpdateBody !== null &&
      !hasSubstantiveMemoryJudgment(memoryUpdateBody)
    ) {
      errors.push(
        'Memory Update Packet is present but has no substantive memory judgment',
      );
    }
  }

  if (isFull) {
    for (const sectionName of collectFullEvidenceRequirements(body)) {
      if (extractSection(body, sectionName) === null) {
        errors.push(`Full packet evidence missing section: ${sectionName}`);
      }
    }
  }

  const dynamicWorkflowBody = extractSection(body, 'Dynamic Workflow');
  const redTeamBody = extractSection(body, 'Red Team');

  if (dynamicWorkflowBody) {
    const requiredModifiers =
      extractField(dynamicWorkflowBody, 'Required modifiers') ?? '';
    const attackResult =
      redTeamBody === null ? null : extractField(redTeamBody, 'Attack result');
    const residualRisk =
      redTeamBody === null ? null : extractField(redTeamBody, 'Residual risk');
    const checkerSource =
      redTeamBody === null
        ? null
        : extractField(redTeamBody, 'Checker / reviewer source');
    const checklistMarked =
      redTeamBody !== null &&
      redTeamBody.split(/\r?\n/).some((line) => /^\s*-\s*\[[xX]\]/.test(line));

    const redTeamDeclared =
      /\bred team\b/i.test(requiredModifiers) ||
      checklistMarked ||
      hasSubstantiveValue(attackResult) ||
      hasSubstantiveValue(residualRisk) ||
      hasSubstantiveValue(checkerSource);

    if (redTeamDeclared) {
      if (redTeamBody === null) {
        errors.push('Red Team evidence missing: section');
      }

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
