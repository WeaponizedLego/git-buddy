import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export async function isGitInstalled(): Promise<{ installed: boolean; version?: string }> {
  try {
    const { stdout } = await execFileAsync('git', ['--version'], { timeout: 5000 })
    return { installed: true, version: stdout.trim() }
  } catch {
    return { installed: false }
  }
}
