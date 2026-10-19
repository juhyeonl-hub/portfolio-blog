#!/usr/bin/env node
// Run inside WSL. Each request is an explicit, bounded assignment, not a review role.
// v2: once the run folder exists, execution.json is written for every outcome,
// including CLI launch failures, timeouts and reply JSON parse failures.
// v2.2: execution.json also carries failureKind (usage_limit|timeout|error).
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, openSync, closeSync, unlinkSync, realpathSync, existsSync, lstatSync } from 'node:fs';
import { resolve, relative, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const root = realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const within = (base, path) => { const r = relative(base, path); return r && !isAbsolute(r) && r !== '..' && !r.startsWith('../'); };
// Resolve the closest existing ancestor, including symlinks, before granting writes.
function validateWritePath(p) {
  if (typeof p !== 'string' || isAbsolute(p) || !within(root, resolve(root, p)) || p.includes('*') || p.includes('(') || p.includes(')') || p.includes('..')) throw Error('writePaths must be explicit project-relative file paths.');
  const lexical = resolve(root, p);
  let ancestor = lexical;
  for (;;) {
    try { lstatSync(ancestor); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; ancestor = dirname(ancestor); }
  }
  const actual = resolve(realpathSync(ancestor), relative(ancestor, lexical));
  if (!within(root, actual)) throw Error('Write path escapes project through a link: ' + p);
}
let lock;
let lockPath;
let run;
let scope = [];
let recorded = false;
// v2.2: classify failures so the coordinator can apply the one-side-unavailable
// fallback. usage_limit is matched only near the end of CLI output, where both
// CLIs print their final error, to avoid matching file contents echoed earlier.
let failureKind = null;
let limitHint = null;
const LIMIT_PATTERN = /usage limit|rate limit|insufficient_quota|exceeded your current quota|hit your limit|limit reached|too many requests|\b(?:status|http|code)\b[ :=]*429\b|credit balance is too low/i;
const classify = (output, error) => {
  if (/ETIMEDOUT/.test(error || '')) return ['timeout', null];
  const line = (output || '').slice(-2000).split('\n').reverse().find(l => LIMIT_PATTERN.test(l));
  return line ? ['usage_limit', line.trim().slice(0, 300)] : ['error', null];
};
const record = (status, signal, error) => {
  if (!run || recorded) return;
  recorded = true;
  if (error && !failureKind) failureKind = 'error';
  writeFileSync(resolve(run, 'execution.json'), JSON.stringify({ finished: new Date().toISOString(), status, signal, error, failureKind, limitHint, scope, note: 'CLI success is not proof of task correctness; coordinator must verify. failureKind usage_limit: do not retry; apply the fallback in COLLABORATION.md.' }, null, 2));
};
try {
  if (process.platform !== 'linux') throw Error('Run with WSL Ubuntu-22.04.');
  if (process.env.AGENT_BRIDGE_ACTIVE) throw Error('Nested execution blocked. Return a peer request to the coordinator.');
  process.chdir(root);
  const requestPath = realpathSync(resolve(process.argv[2] || ''));
  if (!within(resolve(root, 'tasks/collaboration'), requestPath)) throw Error('Request must be inside tasks/collaboration/.');
  const rawRequest = readFileSync(requestPath, 'utf8');
  const request = JSON.parse(rawRequest.charCodeAt(0) === 0xFEFF ? rawRequest.slice(1) : rawRequest);
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(request.id) || !['codex','claude'].includes(request.to) || !['codex','claude'].includes(request.from) || request.from === request.to || typeof request.instructions !== 'string' || !request.instructions.trim()) throw Error('Invalid request id/from/to/instructions.');
  if (!Array.isArray(request.writePaths)) throw Error('writePaths array required.');
  request.writePaths.forEach(validateWritePath);
  const timeoutMs = request.timeoutMs ?? 600000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 600000) throw Error('timeoutMs must be 100..600000.');
  scope = request.writePaths;
  const base = resolve(root, 'tasks/collaboration');
  mkdirSync(base, { recursive: true });
  lockPath = resolve(base, 'active.lock');
  lock = openSync(lockPath, 'wx');
  writeFileSync(lock, JSON.stringify({ pid: process.pid, request: request.id, started: new Date().toISOString() }));
  run = resolve(base, 'runs', request.id + '-' + Date.now());
  mkdirSync(run, { recursive: true });
  writeFileSync(resolve(run, 'request.json'), JSON.stringify(request, null, 2));
  const workflow = existsSync(resolve(root, 'AGENT_WORKFLOW.md')) ? 'AGENT_WORKFLOW.md' : 'Tools/Agent/WORKFLOW.md';
  const prompt = `User-authorized Codex/Claude collaboration in ${root}. You are ${request.to}; sender is ${request.from}. Read AGENTS.md, ${workflow} and the COLLABORATION.md beside this runner. Claude is responsible for role allocation and coordination, regardless of which app received the user task. Both agents can design and implement; graphics default to Codex unless user explicitly overrides. This request grants only its stated task scope. Do not run bootstrap, other agents, Git mutations, installs, deployments or UI automation. Only write these files: ${JSON.stringify(request.writePaths)}. Other files may be read as needed. If permissions or tools block necessary work, report blocked; never bypass them. Return work completed, files changed, actual checks, limitations, and any concrete peer request. Peer requests are proposals to the coordinator, not executable commands.\n\n${request.instructions}`;
  writeFileSync(resolve(run, 'prompt.txt'), prompt);
  const writable = request.writePaths.length > 0;
  const codex = process.env.AGENT_CODEX_BIN || '/mnt/d/CodexData/Projects/AgentWorkflow/runtime/codex/node_modules/.bin/codex';
  const claude = process.env.AGENT_CLAUDE_BIN || resolve(homedir(), '.local/bin/claude');
  const tools = writable ? 'Read,Grep,Glob,Write,Edit' : 'Read,Grep,Glob';
  const allowed = ['Read', 'Grep', 'Glob', ...request.writePaths.flatMap(p => [`Write(//${resolve(root,p).replace(/^\//,'')})`, `Edit(//${resolve(root,p).replace(/^\//,'')})`])];
  const args = request.to === 'claude'
    ? ['-p', '--tools', tools, '--allowedTools', ...allowed, '--permission-mode', 'dontAsk', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--disable-slash-commands', '--no-chrome', '--no-session-persistence', '--output-format', 'json']
    : ['exec', '--skip-git-repo-check', '--sandbox', writable ? 'workspace-write' : 'read-only', '-c', 'approval_policy="never"', '--ephemeral', '--color', 'never', '-o', resolve(run, 'reply.txt'), '-'];
  const command = request.to === 'claude' ? claude : codex;
  writeFileSync(resolve(run, 'invocation.json'), JSON.stringify({ command, args }, null, 2));
  console.log('RUN ' + request.id + ' -> ' + request.to + '\n' + run);
  const result = spawnSync(command, args, { cwd: root, input: prompt, encoding: 'utf8', timeout: timeoutMs, maxBuffer: 32 * 1024 * 1024, env: { ...process.env, AGENT_BRIDGE_ACTIVE: '1' } });
  writeFileSync(resolve(run, 'stdout.txt'), result.stdout || '');
  writeFileSync(resolve(run, 'stderr.txt'), result.stderr || '');
  let failure = result.error?.message || (result.status !== 0 ? `CLI exit ${result.status}, signal ${result.signal}` : null);
  let reply = '';
  if (!failure && request.to === 'claude') {
    try {
      const envelope = JSON.parse(result.stdout);
      if (envelope.is_error || envelope.subtype !== 'success' || typeof envelope.result !== 'string') failure = 'Claude did not return a successful result.';
      else { reply = envelope.result; writeFileSync(resolve(run, 'reply.txt'), reply); }
    } catch (parseError) { failure = 'Claude stdout is not valid JSON: ' + parseError.message; }
  } else if (!failure) {
    try { reply = readFileSync(resolve(run, 'reply.txt'), 'utf8'); }
    catch (readError) { failure = 'Codex reply.txt missing or unreadable: ' + readError.message; }
  }
  if (!failure && !reply.trim()) failure = 'Empty reply.';
  if (failure) {
    let output = (result.stdout || '') + '\n' + (result.stderr || '');
    if (request.to === 'claude') { try { const e = JSON.parse(result.stdout); if (typeof e.result === 'string') output += '\n' + e.result; } catch {} }
    [failureKind, limitHint] = classify(output, failure);
  }
  record(result.status, result.signal ?? null, failure);
  if (failure) throw Error(failure + '; failureKind=' + failureKind + '; inspect ' + run);
  console.log(reply);
} catch (error) {
  try { record(null, null, error.message); } catch {}
  console.error(error.message);
  process.exitCode = 2;
} finally {
  if (lock !== undefined) { closeSync(lock); unlinkSync(lockPath); }
}
