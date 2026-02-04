import crypto from 'crypto'

const ALGO = 'aes-256-gcm'
const IV_LENGTH = 12 // recommended for GCM

const KEY = new Uint8Array(Buffer.from(process.env.SECRET_KEY!, 'hex'))
if (KEY.length !== 32) {
  throw new Error('SECRET_KEY must be 32 bytes (64 hex chars)')
}

export function encryptToken(token: string): string {
  const iv = new Uint8Array(crypto.randomBytes(IV_LENGTH))
  const cipher = crypto.createCipheriv(ALGO, KEY, iv)

  const encrypted = Buffer.concat([
    new Uint8Array(cipher.update(token, 'utf8')),
    new Uint8Array(cipher.final()),
  ])

  const tag = cipher.getAuthTag()

  return [
    Buffer.from(iv).toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

export function decryptToken(data: string): string | null {
  try {
    const [ivHex, tagHex, encryptedHex] = data.split(':')

    const iv = new Uint8Array(Buffer.from(ivHex, 'hex'))
    const tag = new Uint8Array(Buffer.from(tagHex, 'hex'))
    const encrypted = new Uint8Array(Buffer.from(encryptedHex, 'hex'))

    const decipher = crypto.createDecipheriv(ALGO, KEY, iv)
    decipher.setAuthTag(tag)

    const decrypted = Buffer.concat([
      new Uint8Array(decipher.update(encrypted)),
      new Uint8Array(decipher.final()),
    ])

    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

export function buildHttpOnlyCookie(token: string) {
  return `access_token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
}