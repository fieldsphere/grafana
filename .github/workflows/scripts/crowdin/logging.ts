type LogContext = Record<string, unknown>

export function logCrowdinInfo(message: string, context?: LogContext) {
  if (context) {
    console.log(message, context)
    return
  }
  console.log(message)
}

export function logCrowdinError(message: string, context?: LogContext) {
  if (context) {
    console.error(message, context)
    return
  }
  console.error(message)
}
