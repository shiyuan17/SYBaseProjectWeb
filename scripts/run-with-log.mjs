import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const rawArgs = process.argv.slice(2);
const logFileArg = rawArgs[0];

if (!logFileArg) {
  console.error(
    'Usage: node ./scripts/run-with-log.mjs <log-file> [--env KEY=VAL ...] [--] <command> [...args]',
  );
  process.exit(1);
}

const extraEnv = {};
let commandStartIndex = 1;

while (commandStartIndex < rawArgs.length) {
  const token = rawArgs[commandStartIndex];
  if (token === '--') {
    commandStartIndex += 1;
    break;
  }
  if (token === '--env') {
    const assignment = rawArgs[commandStartIndex + 1];
    const separatorIndex = assignment?.indexOf('=') ?? -1;
    if (!assignment || separatorIndex <= 0) {
      console.error('Usage: --env requires KEY=VALUE');
      process.exit(1);
    }
    extraEnv[assignment.slice(0, separatorIndex)] = assignment.slice(
      separatorIndex + 1,
    );
    commandStartIndex += 2;
    continue;
  }
  break;
}

const [command, ...args] = rawArgs.slice(commandStartIndex);

if (!command) {
  console.error(
    'Usage: node ./scripts/run-with-log.mjs <log-file> [--env KEY=VAL ...] [--] <command> [...args]',
  );
  process.exit(1);
}

const logFile = path.resolve(process.cwd(), logFileArg);
await mkdir(path.dirname(logFile), { recursive: true });

const logStream = createWriteStream(logFile, {
  encoding: 'utf8',
  flags: 'a',
});

const startedAt = new Date();

function quoteCommandPart(value) {
  if (!/[()\s"%^&|<>]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}

function resolveLocalBin(commandName) {
  const binDir = path.join(process.cwd(), 'node_modules', '.bin');
  const extensions =
    process.platform === 'win32' ? ['.CMD', '.cmd', '.exe', ''] : [''];

  for (const extension of extensions) {
    const candidate = path.join(binDir, `${commandName}${extension}`);
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return commandName;
}

function resolveSpawn(commandName, commandArgs) {
  const resolvedCommand = resolveLocalBin(commandName);

  if (process.platform !== 'win32') {
    return {
      args: commandArgs,
      command: resolvedCommand,
    };
  }

  return {
    args: [
      '/d',
      '/s',
      '/c',
      [resolvedCommand, ...commandArgs]
        .map((commandPart) => quoteCommandPart(commandPart))
        .join(' '),
    ],
    command: 'cmd.exe',
  };
}

function writeLog(message) {
  logStream.write(message);
}

function writeSection(message) {
  writeLog(`\n[${new Date().toISOString()}] ${message}\n`);
}

writeSection(`START ${command} ${args.join(' ')}`.trim());

let child;
try {
  const spawnOptions = resolveSpawn(command, args);
  child = spawn(spawnOptions.command, spawnOptions.args, {
    env: { ...process.env, ...extraEnv },
    stdio: ['inherit', 'pipe', 'pipe'],
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  writeSection(`ERROR ${message}`);
  logStream.end(() => {
    process.exit(1);
  });
}

if (!child) {
  process.exit(1);
}

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  writeLog(chunk);
});

child.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  writeLog(chunk);
});

child.on('error', (error) => {
  writeSection(`ERROR ${error.message}`);
  logStream.end(() => {
    process.exit(1);
  });
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    writeSection(`SIGNAL ${signal}`);
    child.kill(signal);
  });
}

child.on('close', (code, signal) => {
  const durationMs = Date.now() - startedAt.getTime();
  const status = signal ? `SIGNAL ${signal}` : `EXIT ${code ?? 'unknown'}`;
  writeSection(`END ${status} durationMs=${durationMs}`);
  logStream.end(() => {
    if (signal) {
      process.exit(1);
      return;
    }
    process.exit(code ?? 1);
  });
});
