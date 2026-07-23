#!/usr/bin/env node
// scripts/verify-project-links.mjs
//
// Verifies every deploying app/client folder's .vercel/project.json matches
// the expected Vercel project. Source of truth mirrored in docs/PROJECT_REGISTRY.md
// — if you edit one, edit the other.
//
// Usage:
//   node scripts/verify-project-links.mjs            # check all folders, static table only
//   node scripts/verify-project-links.mjs <folder>    # check one folder, e.g. clients/salsa-burgers
//   node scripts/verify-project-links.mjs --live       # also cross-check against `vercel project inspect`
//
// Exit code: 0 if all checks PASS, 1 if any FAIL. Suitable for use as a pre-deploy gate.

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');

// Static source of truth. Keep in sync with docs/PROJECT_REGISTRY.md.
const REGISTRY = [
  {
    folder: 'apps/mira/portal',
    projectName: 'mira-portal',
    projectId: 'prj_75UXcFgDkNPjJWKtPMu9o2XijCjL',
  },
  {
    folder: 'apps/startup-factory-web',
    projectName: 'startup-factory-web',
    projectId: 'prj_XqOuowAPVwCIquJSGvtW1j7D1iiE',
  },
  {
    folder: 'apps/sf-cms',
    projectName: 'sf-cms',
    projectId: 'prj_istn9Vc3c7zd17QkzakT9CUWmW3B',
  },
  {
    folder: 'apps/sf-crm',
    projectName: 'sf-crm',
    projectId: 'prj_TR1XsOLUpLcpQxsu5yFmYKGEvJfk',
  },
  {
    folder: 'apps/sf-reports',
    projectName: 'sf-reports',
    projectId: 'prj_CKehhayVoAOeStxtyyyTV6g3Xl3t',
  },
  {
    folder: 'packages/cms-client',
    projectName: 'cms-client',
    projectId: 'prj_KjoFaJi7fH4b2OC14wDEzH8lm74N',
  },
  {
    folder: 'clients/salsa-burgers',
    projectName: 'salsa-burgers-web',
    projectId: 'prj_ermiutbVMzAyE8lRL3mrot8g5JRC',
  },
  {
    folder: 'clients/nc-global-assets',
    projectName: 'nc-global-assets',
    projectId: 'prj_dglycSdtgX52oCSDNqAfq8JeME82',
  },
  {
    folder: 'clients/nc-global-assets-next',
    projectName: 'nc-global-assets-next',
    projectId: 'prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD',
    optional: true, // not yet linked; WIP — don't fail the whole run if unlinked
  },
  {
    folder: 'clients/discoolver/creators-landing',
    projectName: 'discoolver-creators-landing',
    projectId: 'prj_No9UIOs54YPJW4iVQyeWnoNVpXG4',
  },
  {
    folder: 'clients/discoolver/briefing',
    projectName: 'discoolver-briefing',
    projectId: 'prj_leUpb2tNZkSikGVeVHUt8JwJujQZ',
  },
  {
    folder: 'clients/discoolver/deliverables/investor-deck-site',
    projectName: 'discoolver-investor-deck',
    projectId: 'prj_clu0ci7Z7FuvEsPq6GkHzvXliP48',
  },
  {
    folder: 'clients/discoolver/design-studio',
    projectName: 'discoolver-design-studio',
    projectId: 'prj_SoMU6F5A7bvp85cfPIFimYo5B2jP',
  },
];

// Known-bad project IDs that must NEVER appear in any project.json.
const BLOCKLIST = [
  { projectId: 'prj_CE4lSOWLgD7VJDAhwr6NJncqtKq6', reason: 'orphan "salsa-burgers" project, no domain, created by accident 2026-07-14' },
];

function checkFolder(entry) {
  const projectJsonPath = path.join(REPO_ROOT, entry.folder, '.vercel', 'project.json');

  if (!existsSync(projectJsonPath)) {
    return entry.optional
      ? { status: 'SKIP', message: 'not linked yet (optional/WIP)' }
      : { status: 'FAIL', message: `missing .vercel/project.json (expected projectId ${entry.projectId})` };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(projectJsonPath, 'utf8'));
  } catch (e) {
    return { status: 'FAIL', message: `unreadable/invalid JSON: ${e.message}` };
  }

  const blocked = BLOCKLIST.find((b) => b.projectId === parsed.projectId);
  if (blocked) {
    return { status: 'FAIL', message: `linked to BLOCKLISTED project ${parsed.projectId} (${blocked.reason})` };
  }

  if (parsed.projectId !== entry.projectId) {
    return {
      status: 'FAIL',
      message: `projectId mismatch — found ${parsed.projectId}, expected ${entry.projectId} (${entry.projectName})`,
    };
  }

  return { status: 'PASS', message: `${entry.projectName} (${entry.projectId})` };
}

function liveCheck(entry) {
  try {
    const out = execSync(`vercel project inspect ${entry.projectName} --yes 2>&1`, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      shell: true,
    });

    if (!out.includes(entry.projectId)) {
      return { status: 'FAIL', message: 'live inspect did not confirm expected projectId' };
    }

    // Also validate Root Directory — should be "." for all registered projects
    const rootDirMatch = out.match(/Root Directory\s+(.+?)(?:\n|$)/);
    const actualRootDir = rootDirMatch ? rootDirMatch[1].trim() : null;

    if (actualRootDir && actualRootDir !== '.' && actualRootDir !== '') {
      return {
        status: 'FAIL',
        message: `Root Directory mismatch — found "${actualRootDir}", expected "." (empty). Fix in Vercel dashboard: Settings → Build and Deployment → Root Directory → clear field → Save`,
      };
    }

    return { status: 'PASS', message: 'live project confirmed, Root Directory correct' };
  } catch (e) {
    return { status: 'FAIL', message: `vercel inspect failed: ${e.message.split('\n')[0]}` };
  }
}

// Also check the monorepo root is NOT linked to anything.
function checkRootUnlinked() {
  const rootProjectJson = path.join(REPO_ROOT, '.vercel', 'project.json');
  if (existsSync(rootProjectJson)) {
    const parsed = JSON.parse(readFileSync(rootProjectJson, 'utf8'));
    return { status: 'FAIL', message: `monorepo ROOT is linked to ${parsed.projectName || parsed.projectId} — this is dangerous, delete .vercel/project.json at repo root` };
  }
  return { status: 'PASS', message: 'monorepo root correctly unlinked' };
}

const args = process.argv.slice(2);
const live = args.includes('--live');
const filterArg = args.find((a) => !a.startsWith('--'));

let hadFailure = false;

console.log('Project Link Verification\n' + '='.repeat(40));

const rootResult = checkRootUnlinked();
console.log(`[${rootResult.status}] <monorepo root> — ${rootResult.message}`);
if (rootResult.status === 'FAIL') hadFailure = true;

for (const entry of REGISTRY) {
  if (filterArg && entry.folder !== filterArg) continue;

  const result = checkFolder(entry);
  console.log(`[${result.status}] ${entry.folder} — ${result.message}`);
  if (result.status === 'FAIL') hadFailure = true;

  if (live && result.status === 'PASS') {
    const lr = liveCheck(entry);
    console.log(`  [LIVE ${lr.status}] ${entry.folder} — ${lr.message}`);
    if (lr.status === 'FAIL') hadFailure = true;
  }
}

console.log('='.repeat(40));
console.log(hadFailure ? 'RESULT: FAIL — fix mismatches before deploying.' : 'RESULT: ALL PASS');
process.exit(hadFailure ? 1 : 0);
