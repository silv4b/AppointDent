export type ActionResult<T = void> = { data: T; error?: undefined } | { error: string; data?: undefined }

export function ok<T>(data: T): ActionResult<T>
export function ok(): ActionResult<void>
export function ok<T>(data?: T): ActionResult<T> {
  return (data !== undefined ? { data } : {}) as unknown as ActionResult<T>
}

export function err(message: string): { error: string } {
  return { error: message }
}
