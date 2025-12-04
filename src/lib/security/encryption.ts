/**
 * Encryption at Rest Module
 *
 * RED TEAM AUDIT FIX: HIGH-006
 * Implements field-level encryption for sensitive data before storage
 *
 * Features:
 * - AES-256-GCM encryption
 * - Key rotation support
 * - Deterministic encryption for searchable fields
 * - Encrypted field markers
 * - Automatic key derivation from master key
 */

// ============================================================================
// TYPES
// ============================================================================

export interface EncryptedField {
  ciphertext: string;
  iv: string;
  tag: string;
  keyId: string;
  algorithm: 'AES-256-GCM';
  version: number;
}

export interface EncryptedFieldString {
  __encrypted: true;
  data: EncryptedField;
}

export interface EncryptionConfig {
  masterKeyEnvVar?: string;
  keyId?: string;
  enableDeterministicEncryption?: boolean;
}

export interface KeyInfo {
  id: string;
  createdAt: string;
  algorithm: string;
  status: 'active' | 'rotating' | 'deprecated';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALGORITHM = 'AES-256-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 128; // bits
const ENCRYPTION_VERSION = 1;
const ENCRYPTED_MARKER = '__enc__';

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Derive encryption key from master key and key ID
 */
async function deriveKey(masterKey: string, keyId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();

  // Import master key as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(`vda-encryption-${keyId}`),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get master encryption key from environment
 */
function getMasterKey(envVar: string = 'DATA_ENCRYPTION_KEY'): string {
  const key = process.env[envVar];
  if (!key) {
    throw new Error(`Encryption key not configured. Set ${envVar} environment variable.`);
  }
  if (key.length < 32) {
    throw new Error('Encryption key must be at least 32 characters');
  }
  return key;
}

/**
 * Get current key ID (supports rotation)
 */
function getCurrentKeyId(): string {
  return process.env.ENCRYPTION_KEY_ID || 'default-v1';
}

// ============================================================================
// ENCRYPTION FUNCTIONS
// ============================================================================

/**
 * Encrypt a string value
 */
export async function encrypt(
  plaintext: string,
  config: EncryptionConfig = {}
): Promise<EncryptedField> {
  const { masterKeyEnvVar = 'DATA_ENCRYPTION_KEY', keyId = getCurrentKeyId() } = config;

  const masterKey = getMasterKey(masterKeyEnvVar);
  const key = await deriveKey(masterKey, keyId);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encoder.encode(plaintext)
  );

  // Extract auth tag (last 16 bytes of ciphertext in WebCrypto)
  const ciphertextArray = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextArray.slice(0, -16);
  const tag = ciphertextArray.slice(-16);

  return {
    ciphertext: arrayToBase64(actualCiphertext),
    iv: arrayToBase64(iv),
    tag: arrayToBase64(tag),
    keyId,
    algorithm: ALGORITHM,
    version: ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt an encrypted field
 */
export async function decrypt(
  encrypted: EncryptedField,
  config: EncryptionConfig = {}
): Promise<string> {
  const { masterKeyEnvVar = 'DATA_ENCRYPTION_KEY' } = config;

  if (encrypted.algorithm !== ALGORITHM) {
    throw new Error(`Unsupported algorithm: ${encrypted.algorithm}`);
  }

  const masterKey = getMasterKey(masterKeyEnvVar);
  const key = await deriveKey(masterKey, encrypted.keyId);

  // Reconstruct ciphertext with tag
  const ciphertext = base64ToArray(encrypted.ciphertext);
  const tag = base64ToArray(encrypted.tag);
  const iv = base64ToArray(encrypted.iv);

  // Combine ciphertext and tag (WebCrypto expects them together)
  const combined = new Uint8Array(ciphertext.length + tag.length);
  combined.set(ciphertext);
  combined.set(tag, ciphertext.length);

  // Decrypt
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    combined
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

// ============================================================================
// DETERMINISTIC ENCRYPTION (for searchable fields)
// ============================================================================

/**
 * Encrypt with deterministic IV (same input = same output)
 * WARNING: Use only for fields that need to be searchable
 * Less secure than random IV encryption
 */
export async function encryptDeterministic(
  plaintext: string,
  config: EncryptionConfig = {}
): Promise<EncryptedField> {
  const { masterKeyEnvVar = 'DATA_ENCRYPTION_KEY', keyId = getCurrentKeyId() } = config;

  const masterKey = getMasterKey(masterKeyEnvVar);
  const key = await deriveKey(masterKey, keyId);

  // Derive IV deterministically from plaintext
  const encoder = new TextEncoder();
  const ivSource = await crypto.subtle.digest('SHA-256', encoder.encode(plaintext + keyId));
  const iv = new Uint8Array(ivSource).slice(0, IV_LENGTH);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: TAG_LENGTH,
    },
    key,
    encoder.encode(plaintext)
  );

  const ciphertextArray = new Uint8Array(ciphertext);
  const actualCiphertext = ciphertextArray.slice(0, -16);
  const tag = ciphertextArray.slice(-16);

  return {
    ciphertext: arrayToBase64(actualCiphertext),
    iv: arrayToBase64(iv),
    tag: arrayToBase64(tag),
    keyId,
    algorithm: ALGORITHM,
    version: ENCRYPTION_VERSION,
  };
}

// ============================================================================
// STRING SERIALIZATION
// ============================================================================

/**
 * Encrypt to a string format suitable for database storage
 */
export async function encryptToString(
  plaintext: string,
  config: EncryptionConfig = {}
): Promise<string> {
  const encrypted = await encrypt(plaintext, config);
  return `${ENCRYPTED_MARKER}${JSON.stringify(encrypted)}`;
}

/**
 * Decrypt from string format
 */
export async function decryptFromString(
  encryptedString: string,
  config: EncryptionConfig = {}
): Promise<string> {
  if (!isEncryptedString(encryptedString)) {
    throw new Error('String is not encrypted');
  }

  const jsonStr = encryptedString.substring(ENCRYPTED_MARKER.length);
  const encrypted: EncryptedField = JSON.parse(jsonStr);
  return decrypt(encrypted, config);
}

/**
 * Check if a string is encrypted
 */
export function isEncryptedString(value: string): boolean {
  return typeof value === 'string' && value.startsWith(ENCRYPTED_MARKER);
}

// ============================================================================
// OBJECT ENCRYPTION HELPERS
// ============================================================================

/**
 * Encrypt specific fields in an object
 */
export async function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[],
  config: EncryptionConfig = {}
): Promise<T> {
  const result = { ...obj };

  for (const field of fieldsToEncrypt) {
    const value = obj[field];
    if (typeof value === 'string') {
      (result as Record<string, unknown>)[field as string] = await encryptToString(value, config);
    }
  }

  return result;
}

/**
 * Decrypt specific fields in an object
 */
export async function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[],
  config: EncryptionConfig = {}
): Promise<T> {
  const result = { ...obj };

  for (const field of fieldsToDecrypt) {
    const value = obj[field];
    if (typeof value === 'string' && isEncryptedString(value)) {
      try {
        (result as Record<string, unknown>)[field as string] = await decryptFromString(value, config);
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error);
        // Keep encrypted value if decryption fails
      }
    }
  }

  return result;
}

// ============================================================================
// KEY ROTATION
// ============================================================================

/**
 * Re-encrypt a field with a new key
 */
export async function rotateEncryption(
  encrypted: EncryptedField,
  oldConfig: EncryptionConfig,
  newConfig: EncryptionConfig
): Promise<EncryptedField> {
  // Decrypt with old key
  const plaintext = await decrypt(encrypted, oldConfig);

  // Encrypt with new key
  return encrypt(plaintext, newConfig);
}

/**
 * Check if a field needs key rotation
 */
export function needsKeyRotation(encrypted: EncryptedField, currentKeyId: string = getCurrentKeyId()): boolean {
  return encrypted.keyId !== currentKeyId;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function arrayToBase64(array: Uint8Array): string {
  return btoa(String.fromCharCode(...array));
}

function base64ToArray(base64: string): Uint8Array {
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return array;
}

/**
 * Generate a random encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return arrayToBase64(array);
}

/**
 * Get information about the current encryption key
 */
export function getKeyInfo(): KeyInfo {
  return {
    id: getCurrentKeyId(),
    createdAt: process.env.ENCRYPTION_KEY_CREATED_AT || 'unknown',
    algorithm: ALGORITHM,
    status: 'active',
  };
}

// ============================================================================
// SENSITIVE FIELD DEFINITIONS
// ============================================================================

/**
 * Define which fields should be encrypted by table
 */
export const ENCRYPTED_FIELDS: Record<string, string[]> = {
  user_profiles: ['phone_number', 'address'],
  api_keys: [], // key_hash is already hashed, not encrypted
  audit_log: ['details'], // Contains potentially sensitive data
  user_feedback: ['comment'], // User comments may contain PII
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  encrypt,
  decrypt,
  encryptDeterministic,
  encryptToString,
  decryptFromString,
  isEncryptedString,
  encryptFields,
  decryptFields,
  rotateEncryption,
  needsKeyRotation,
  generateEncryptionKey,
  getKeyInfo,
  ENCRYPTED_FIELDS,
};
