/** Mismo par de usuarios → mismo convoId (DMs). */
export function deterministicDmId(a: string, b: string): string {
  const crypto = require('node:crypto') as typeof import('node:crypto');
  const key = [a, b].sort().join(':');
  const hash = crypto.createHash('sha256').update(key).digest('base64url');
  return 'dm_' + hash.slice(0, 12);
}

export function cryptoRandomId(size = 12): string {
  const crypto = require('node:crypto') as typeof import('node:crypto');
  return crypto.randomBytes(size).toString('base64url');
}
