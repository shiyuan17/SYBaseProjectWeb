import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const coreRequiredSections = [
  'Summary',
  'Lifecycle Artifacts',
  'Dynamic Workflow',
  'Memory',
  'Evidence',
];

const coreRequiredFields = [
  ['Summary', 'Validation'],
  ['Summary', 'Risks'],
  ['Dynamic Workflow', 'Primary Workflow'],
];

const fullRequiredFields = [
  ['Full Evidence', 'Required test commands'],
  ['Full Evidence', 'Actual results'],
];

function extractSection(body, sectionName) {
  const lines = body.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => {
    const heading = line.trim().match(/^(#{2,6})\s+(.+?)\s*#*$/);
    return heading?.[2]?.trim().toLowerCase() === sectionName.toLowerCase();
  });
  if (startIndex === -1) {
    return null;
  }

  const startHeading = lines[startIndex]
    .trim()
    .match(/^(#{2,6})\s+(.+?)\s*#*$/);
  const startLevel = startHeading?.[1]?.length ?? 2;
  const endIndex = lines.findIndex((line, index) => {
    if (index <= startIndex) {
      return false;
    }

    const heading = line.trim().match(/^(#{2,6})\s+(.+?)\s*#*$/);
    return heading !== null && heading[1].length <= startLevel;
  });
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

function extractDynamicWorkflowState(body) {
  const dynamicWorkflowBody = extractSection(body, 'Dynamic Workflow');
  if (dynamicWorkflowBody === null) {
    return {
      dynamicWorkflowBody: null,
      primaryWorkflow: '',
      requiredModifiers: '',
      redZoneConfirmation: '',
    };
  }

  return {
    dynamicWorkflowBody,
    primaryWorkflow: (
      extractField(dynamicWorkflowBody, 'Primary Workflow') ?? ''
    )
      .trim()
      .toLowerCase(),
    requiredModifiers:
      extractField(dynamicWorkflowBody, 'Required modifiers') ?? '',
    redZoneConfirmation:
      extractField(dynamicWorkflowBody, 'Red-zone confirmation') ?? '',
  };
}

function isFullPrimaryWorkflow(primaryWorkflow) {
  return ['db', 'production debug', 'security', 'workflow-infra'].includes(
    primaryWorkflow,
  );
}

function resolvePacketTier(body) {
  const {
    dynamicWorkflowBody,
    primaryWorkflow: normalizedPrimaryWorkflow,
    redZoneConfirmation,
    requiredModifiers,
  } = extractDynamicWorkflowState(body);
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
    const fullReasons = [];

    if (isFullPrimaryWorkflow(normalizedPrimaryWorkflow)) {
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

function collectFullEvidenceFieldRequirements(body) {
  const { dynamicWorkflowBody, primaryWorkflow, requiredModifiers } =
    extractDynamicWorkflowState(body);
  if (dynamicWorkflowBody === null) {
    return [];
  }

  const requirements = [];

  if (
    primaryWorkflow === 'security' ||
    hasModifier(requiredModifiers, 'Security')
  ) {
    requirements.push('Dynamic security');
  }

  if (primaryWorkflow === 'db' || hasModifier(requiredModifiers, 'DB')) {
    requirements.push('Dynamic database');
  }

  if (hasModifier(requiredModifiers, 'Backend Cross-check')) {
    requirements.push('Cross-repo evidence');
  }

  if (hasModifier(requiredModifiers, 'Browser Verification')) {
    requirements.push('Dynamic simulation');
  }

  return [...new Set(requirements)];
}

function requiresRedTeamEvidence(body) {
  const {
    dynamicWorkflowBody,
    primaryWorkflow,
    requiredModifiers,
    redZoneConfirmation,
  } = extractDynamicWorkflowState(body);
  if (dynamicWorkflowBody === null) {
    return false;
  }

  if (
    ['db', 'production debug', 'security'].includes(primaryWorkflow) ||
    hasModifier(requiredModifiers, 'Security') ||
    hasModifier(requiredModifiers, 'DB') ||
    hasModifier(requiredModifiers, 'Red Team') ||
    hasSubstantiveValue(redZoneConfirmation)
  ) {
    return true;
  }

  const redTeamBody = extractSection(body, 'Red Team');
  if (redTeamBody === null) {
    return false;
  }

  return (
    hasSubstantiveValue(extractField(redTeamBody, 'Attack result')) ||
    hasSubstantiveValue(extractField(redTeamBody, 'Residual risk')) ||
    hasSubstantiveValue(extractField(redTeamBody, 'Checker / reviewer source'))
  );
}

function validateRequiredField({
  errors,
  sectionBody,
  sectionName,
  fieldName,
  useSubstantiveValue = false,
}) {
  const fieldValue = extractField(sectionBody, fieldName);
  if (fieldValue === null) {
    errors.push(`Missing field: ${sectionName} > ${fieldName}`);
    return;
  }

  const isEmpty = useSubstantiveValue
    ? !hasSubstantiveValue(fieldValue)
    : fieldValue.length === 0;
  if (isEmpty) {
    errors.push(`Empty field: ${sectionName} > ${fieldName}`);
  }
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

  const memoryBody = extractSection(body, 'Memory');
  if (memoryBody !== null && !hasSubstantiveMemoryJudgment(memoryBody)) {
    errors.push(
      'Memory section is present but has no substantive memory judgment',
    );
  }

  if (isFull) {
    const fullEvidenceBody = extractSection(body, 'Full Evidence');
    if (fullEvidenceBody === null) {
      errors.push('Missing section: Full Evidence');
    }

    for (const [sectionName, fieldName] of fullRequiredFields) {
      const sectionBody = extractSection(body, sectionName);
      if (sectionBody === null) {
        continue;
      }

      validateRequiredField({
        errors,
        fieldName,
        sectionBody,
        sectionName,
        useSubstantiveValue: true,
      });
    }

    if (fullEvidenceBody !== null) {
      for (const fieldName of collectFullEvidenceFieldRequirements(body)) {
        validateRequiredField({
          errors,
          fieldName,
          sectionBody: fullEvidenceBody,
          sectionName: 'Full Evidence',
          useSubstantiveValue: true,
        });
      }
    }
  }

  if (!isFull && !isFastPath) {
    const lightweightEvidenceBody = extractSection(
      body,
      'Lightweight Evidence',
    );
    if (lightweightEvidenceBody === null) {
      errors.push('Missing section: Lightweight Evidence');
    } else {
      for (const fieldName of [
        'Dynamic tests / validation',
        'Unverified items and reasons',
      ]) {
        validateRequiredField({
          errors,
          fieldName,
          sectionBody: lightweightEvidenceBody,
          sectionName: 'Lightweight Evidence',
          useSubstantiveValue: true,
        });
      }
    }
  }

  const redTeamBody = extractSection(body, 'Red Team');

  if (requiresRedTeamEvidence(body)) {
    if (redTeamBody === null) {
      errors.push('Missing section: Red Team');
    } else {
      for (const fieldName of [
        'Attack path',
        'Expected failure point',
        'Attack result',
        'Residual risk',
        'Checker / reviewer source',
      ]) {
        const fieldValue = extractField(redTeamBody, fieldName);
        if (!hasSubstantiveValue(fieldValue)) {
          errors.push(`Red Team evidence missing: ${fieldName}`);
        }
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
