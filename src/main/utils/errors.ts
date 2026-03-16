export class AppError extends Error {
  constructor(
    public friendlyMessage: string,
    public technicalDetail: string,
    public recoveryHint?: string
  ) {
    super(friendlyMessage)
    this.name = 'AppError'
  }
}

export function toFriendlyError(error: unknown): AppError {
  if (error instanceof AppError) return error

  const msg = error instanceof Error ? error.message : String(error)

  if (msg.includes('not a git repository')) {
    return new AppError(
      "This folder isn't set up for Git yet.",
      msg,
      'Want me to set it up for you?'
    )
  }

  if (msg.includes('nothing to commit')) {
    return new AppError(
      "Everything's already saved! No changes to snapshot.",
      msg
    )
  }

  if (msg.includes('CONFLICT') || msg.includes('conflict')) {
    return new AppError(
      'Going back got a bit tangled up.',
      msg,
      'Try saving your current work first, then go back.'
    )
  }

  if (msg.includes('Could not resolve host') || msg.includes('unable to access')) {
    return new AppError(
      "Can't reach the server.",
      msg,
      'Check your internet connection and try again.'
    )
  }

  if (msg.includes('rejected') && msg.includes('push')) {
    return new AppError(
      'Someone else made changes online.',
      msg,
      'Try pulling the latest changes first.'
    )
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return new AppError(
      'That took too long.',
      msg,
      'Check your internet connection and try again.'
    )
  }

  return new AppError(
    'Oops! Something went wrong.',
    msg,
    'Try again, or restart Git Buddy if it keeps happening.'
  )
}
