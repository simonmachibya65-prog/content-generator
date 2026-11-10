const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || 'default_32_char_key_change_this!!',
  'utf8'
).slice(0, 32);

/**
 * Encrypt a string (for storing OAuth tokens securely)
 * @param {string} text - plain text to encrypt
 * @returns {string} encrypted hex string
 */
function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - encrypted hex string
 * @returns {string} decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate a cryptographically secure random state string for OAuth
 */
function generateOAuthState() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate PKCE code verifier
 */
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge from verifier
 */
function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

module.exports = { encrypt, decrypt, generateOAuthState, generateCodeVerifier, generateCodeChallenge };
