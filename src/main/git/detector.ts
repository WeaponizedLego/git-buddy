import { exec } from 'dugite'

export async function isGitInstalled(): Promise<{ installed: boolean; version?: string }> {
  const result = await exec(['--version'], process.cwd())
  return { installed: true, version: result.stdout.trim() }
}
