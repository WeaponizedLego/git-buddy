import { exec } from 'dugite'

export async function runGit(args: string[], cwd: string): Promise<string> {
  const result = await exec(args, cwd, { signal: AbortSignal.timeout(30_000) })
  if (result.exitCode !== 0) {
    const detail = result.stderr || result.stdout || `git exited with code ${result.exitCode}`
    const err = new Error(detail)
    Object.assign(err, { stderr: result.stderr })
    throw err
  }
  return result.stdout.trim()
}
