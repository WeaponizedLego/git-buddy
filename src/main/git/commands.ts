import { writeFile, access, constants } from 'fs/promises'
import { join } from 'path'
import { runGit } from './executor'
import { AppError } from '../utils/errors'

const DEFAULT_GITIGNORE = `# ── Dependencies ──────────────────────────────────────
node_modules/
vendor/
.bundle/
bower_components/

# Python
venv/
.venv/
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt

# ── Environment & Secrets ──────────────────────────────
.env
.env.local
.env.*.local
.env.development.local
.env.test.local
.env.production.local
*.pem
*.key
*.p12
*.pfx

# ── OS Files ───────────────────────────────────────────
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
desktop.ini

# ── Editor & IDE ───────────────────────────────────────
.vscode/
.idea/
*.swp
*.swo
*~
.project
.classpath
.settings/
*.sublime-project
*.sublime-workspace

# ── Build Outputs ──────────────────────────────────────
dist/
build/
out/
.next/
.nuxt/
.output/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# ── Java / Kotlin ──────────────────────────────────────
*.class
*.jar
*.war
*.ear
.gradle/
target/

# ── C / C++ ────────────────────────────────────────────
*.o
*.obj
*.so
*.dll
*.exe

# ── Coverage & Testing ─────────────────────────────────
coverage/
.nyc_output/
.pytest_cache/

# ── Misc ───────────────────────────────────────────────
*.bak
*.tmp
*.orig
`

export interface CommitInfo {
  sha: string
  shortSha: string
  message: string
  date: string
  relativeDate: string
}

export interface GitStatus {
  modifiedCount: number
  files: string[]
}

export interface WorktreeInfo {
  path: string
  branch: string
  modifiedFiles: string[]
  commitsAhead: number
}

export async function checkIsRepo(cwd: string): Promise<boolean> {
  try {
    await runGit(['rev-parse', '--is-inside-work-tree'], cwd)
    return true
  } catch {
    return false
  }
}

async function createDefaultGitignore(cwd: string): Promise<void> {
  const gitignorePath = join(cwd, '.gitignore')
  try {
    await access(gitignorePath, constants.F_OK)
    return // already exists — do not overwrite
  } catch {
    await writeFile(gitignorePath, DEFAULT_GITIGNORE, 'utf-8')
  }
}

export async function initRepo(cwd: string): Promise<void> {
  await runGit(['init', '-b', 'main'], cwd)
  await createDefaultGitignore(cwd)
}

export async function getStatus(cwd: string): Promise<GitStatus> {
  const output = await runGit(['status', '--porcelain'], cwd)
  if (!output) return { modifiedCount: 0, files: [] }

  const files = output.split('\n').filter(Boolean).map((line) => line.slice(3))
  return { modifiedCount: files.length, files }
}

export async function getLog(cwd: string, limit = 50): Promise<CommitInfo[]> {
  try {
    const format = '%H%n%h%n%s%n%aI%n%ar'
    const output = await runGit(
      ['log', `--format=${format}`, `-${limit}`, '--'],
      cwd
    )
    if (!output) return []

    const lines = output.split('\n')
    const commits: CommitInfo[] = []

    for (let i = 0; i + 4 < lines.length; i += 5) {
      commits.push({
        sha: lines[i],
        shortSha: lines[i + 1],
        message: lines[i + 2],
        date: lines[i + 3],
        relativeDate: lines[i + 4]
      })
    }

    return commits
  } catch {
    // No commits yet
    return []
  }
}

export async function getRemoteUrl(cwd: string): Promise<string | null> {
  try {
    return await runGit(['remote', 'get-url', 'origin'], cwd)
  } catch {
    return null
  }
}

export async function saveSnapshot(
  cwd: string,
  message: string
): Promise<{ pushed: boolean }> {
  await runGit(['add', '-A'], cwd)

  try {
    await runGit(['commit', '-m', message], cwd)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('nothing to commit')) {
      throw new AppError(
        "Everything's already saved! No changes to snapshot.",
        msg
      )
    }
    throw err
  }

  // Try to push, but don't fail if no remote
  const remote = await getRemoteUrl(cwd)
  if (remote) {
    try {
      await runGit(['push', 'origin', 'main'], cwd)
      return { pushed: true }
    } catch {
      // Push failed but commit succeeded
      return { pushed: false }
    }
  }

  return { pushed: false }
}

export async function getLinkedWorktrees(cwd: string): Promise<WorktreeInfo[]> {
  try {
    const output = await runGit(['worktree', 'list', '--porcelain'], cwd)
    const blocks = output.split('\n\n').filter(Boolean)
    blocks.shift() // remove main worktree

    const worktrees: WorktreeInfo[] = []
    for (const block of blocks) {
      const lines = block.split('\n')
      const path = lines.find(l => l.startsWith('worktree '))?.slice('worktree '.length).trim() ?? ''
      const branch = lines.find(l => l.startsWith('branch '))?.slice('branch refs/heads/'.length).trim() ?? ''
      if (!path || !branch) continue

      const status = await getStatus(path).catch(() => ({ modifiedCount: 0, files: [] }))
      let commitsAhead = 0
      try {
        const aheadOut = await runGit(['log', `main..${branch}`, '--format=%H'], cwd)
        commitsAhead = aheadOut.split('\n').filter(Boolean).length
      } catch { /* branch may not exist on main yet */ }

      if (status.files.length > 0 || commitsAhead > 0) {
        worktrees.push({ path, branch, modifiedFiles: status.files, commitsAhead })
      }
    }
    return worktrees
  } catch {
    return []
  }
}

export async function saveWorktreeToMain(
  cwd: string,
  worktree: WorktreeInfo,
  snapshotMessage?: string
): Promise<{ pushed: boolean }> {
  // 1. Commit uncommitted changes in the worktree if needed
  if (worktree.modifiedFiles.length > 0 && snapshotMessage) {
    await runGit(['add', '-A'], worktree.path)
    await runGit(['commit', '-m', snapshotMessage], worktree.path)
  }

  // 2. Merge into main
  await runGit(['merge', worktree.branch, '--no-edit'], cwd)

  // 3. Clean up the worktree
  try { await runGit(['worktree', 'remove', '--force', worktree.path], cwd) } catch { /* ok */ }
  await runGit(['worktree', 'prune'], cwd)

  // 4. Try push
  const remote = await getRemoteUrl(cwd)
  if (remote) {
    try { await runGit(['push', 'origin', 'main'], cwd); return { pushed: true } } catch { /* ok */ }
  }
  return { pushed: false }
}

export async function discardWorktree(cwd: string, worktreePath: string): Promise<void> {
  try { await runGit(['worktree', 'remove', '--force', worktreePath], cwd) } catch { /* ok */ }
  await runGit(['worktree', 'prune'], cwd)
}

export async function getCurrentBranch(cwd: string): Promise<string> {
  return (await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd)).trim()
}

export async function listBranches(cwd: string): Promise<string[]> {
  const output = await runGit(['branch', '--format=%(refname:short)'], cwd)
  return output.split('\n').filter(Boolean)
}

export async function switchBranch(cwd: string, branch: string): Promise<void> {
  await runGit(['checkout', branch], cwd)
}

export async function mergeBranchToMain(cwd: string, sourceBranch: string): Promise<{ pushed: boolean }> {
  if (sourceBranch === 'main') {
    throw new AppError("Can't merge main into itself!", 'Source branch is already main')
  }
  const status = await getStatus(cwd)
  if (status.modifiedCount > 0) {
    throw new AppError(
      'You have unsaved changes!',
      `${status.modifiedCount} modified files`,
      'Save a snapshot first, then merge.'
    )
  }
  await runGit(['checkout', 'main'], cwd)
  try {
    await runGit(['merge', sourceBranch], cwd)
  } catch (err) {
    try { await runGit(['merge', '--abort'], cwd) } catch { /* ok */ }
    throw new AppError(
      'Merge had conflicts.',
      err instanceof Error ? err.message : String(err),
      'Resolve the conflicts on your branch first, then try merging again.'
    )
  }
  const remote = await getRemoteUrl(cwd)
  if (remote) {
    try { await runGit(['push', 'origin', 'main'], cwd); return { pushed: true } } catch { /* ok */ }
  }
  return { pushed: false }
}

async function isMergeCommit(cwd: string, sha: string): Promise<boolean> {
  const parents = await runGit(['log', '-1', '--format=%P', sha], cwd)
  return parents.trim().split(/\s+/).filter(Boolean).length > 1
}

export async function goBackTo(cwd: string, targetSha: string): Promise<void> {
  // Ensure clean working tree
  const status = await getStatus(cwd)
  if (status.modifiedCount > 0) {
    throw new AppError(
      'You have unsaved changes!',
      `${status.modifiedCount} modified files`,
      'Save a snapshot first, then try going back.'
    )
  }

  // Check if target is already HEAD
  const headSha = await runGit(['rev-parse', 'HEAD'], cwd)
  if (headSha === targetSha) {
    throw new AppError("You're already here!", 'Target SHA equals HEAD')
  }

  // Get commits to revert (from target exclusive to HEAD inclusive, oldest first)
  const output = await runGit(
    ['log', '--reverse', '--format=%H', `${targetSha}..HEAD`],
    cwd
  )
  const commitsToRevert = output.split('\n').filter(Boolean)

  if (commitsToRevert.length === 0) {
    throw new AppError("You're already here!", 'No commits to revert')
  }

  // Revert in reverse order (newest first) with --no-commit
  const reversed = [...commitsToRevert].reverse()
  try {
    for (const sha of reversed) {
      const mergeCommit = await isMergeCommit(cwd, sha)
      const args = mergeCommit
        ? ['revert', '-m', '1', '--no-commit', sha]
        : ['revert', '--no-commit', sha]
      await runGit(args, cwd)
    }
  } catch (err: unknown) {
    // Conflict occurred - abort the revert
    try {
      await runGit(['revert', '--abort'], cwd)
    } catch {
      // If abort also fails, try to reset
      await runGit(['reset', '--hard', 'HEAD'], cwd)
    }

    throw new AppError(
      'Going back got a bit tangled up.',
      err instanceof Error ? err.message : String(err),
      'Try saving your current work first, then go back.'
    )
  }

  // Get the target commit's message for our revert commit
  const targetMsg = await runGit(['log', '-1', '--format=%s', targetSha], cwd)
  await runGit(
    ['commit', '-m', `Go back to: ${targetMsg}`],
    cwd
  )

  // Try to push
  const remote = await getRemoteUrl(cwd)
  if (remote) {
    try {
      await runGit(['push', 'origin', 'main'], cwd)
    } catch {
      // Push failed but revert succeeded locally
    }
  }
}
