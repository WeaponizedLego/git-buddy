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
      await runGit(['revert', '--no-commit', sha], cwd)
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
