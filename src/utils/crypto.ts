import CryptoJS from 'crypto-js';

// ============================================================
// 类型定义
// ============================================================

/** 加密结果 */
export interface EncryptResult {
  /** 加密后的文本（Base64） */
  ciphertext: string;
  /** 盐值（Base64） */
  salt: string;
  /** IV向量（Base64） */
  iv: string;
  /** 加密模式 */
  mode: string;
  /** 密钥派生方式 */
  kdf: string;
}

/** 加密配置 */
export interface CryptoConfig {
  /** 密钥大小（位），默认 256 */
  keySize?: 128 | 192 | 256;
  /** 迭代次数，默认 10000 */
  iterations?: number;
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_CONFIG: Required<CryptoConfig> = {
  keySize: 256,
  iterations: 10000
};

// ============================================================
// 类型辅助：定义 WordArray 类型
// ============================================================

// crypto-js 的 WordArray 实际类型
type CryptoJSWordArray = any; // 使用 any 避免类型冲突

// ============================================================
// 密钥生成
// ============================================================

/**
 * 生成随机密钥
 * @param keySize - 密钥大小（字节），默认 32
 * @returns Base64 编码的密钥
 */
export function generateKey(keySize: number = 32): string {
  const words = CryptoJS.lib.WordArray.random(keySize);
  return words.toString(CryptoJS.enc.Base64);
}

/**
 * 生成随机 IV 向量
 * @param ivSize - IV 大小（字节），默认 16
 * @returns Base64 编码的 IV
 */
export function generateIV(ivSize: number = 16): string {
  const words = CryptoJS.lib.WordArray.random(ivSize);
  return words.toString(CryptoJS.enc.Base64);
}

/**
 * 生成随机盐值
 * @param saltSize - 盐值大小（字节），默认 16
 * @returns Base64 编码的盐值
 */
export function generateSalt(saltSize: number = 16): string {
  const words = CryptoJS.lib.WordArray.random(saltSize);
  return words.toString(CryptoJS.enc.Base64);
}

// ============================================================
// 核心加密函数
// ============================================================

/**
 * 从密码派生密钥（使用 PBKDF2）
 */
function deriveKey(
  password: string,
  salt: string,
  keySize: number = 256,
  iterations: number = 10000
): any {
  const saltWords = CryptoJS.enc.Base64.parse(salt);
  return CryptoJS.PBKDF2(password, saltWords, {
    keySize: keySize / 32,
    iterations: iterations,
    hasher: CryptoJS.algo.SHA256
  });
}

/**
 * 加密内容（使用密码 + 随机盐和 IV）
 * @param content - 明文内容
 * @param password - 加密密码
 * @param config - 加密配置
 * @returns 加密结果（包含密文、盐、IV）
 * 
 * @example
 * ```ts
 * const result = encryptWithPassword('我的秘密笔记', 'mypassword123')
 * console.log(result.ciphertext) // 加密后的内容
 * console.log(result.salt)       // 盐值（需要保存）
 * console.log(result.iv)         // IV向量（需要保存）
 * ```
 */
export function encryptWithPassword(
  content: string,
  password: string,
  config: CryptoConfig = {}
): EncryptResult {
  const { keySize, iterations } = { ...DEFAULT_CONFIG, ...config };

  // 生成随机盐和 IV
  const salt = generateSalt();
  const iv = generateIV();

  // 从密码派生密钥
  const key = deriveKey(password, salt, keySize, iterations);

  // 加密
  const encrypted = CryptoJS.AES.encrypt(content, key, {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    ciphertext: encrypted.toString(),
    salt: salt,
    iv: iv,
    mode: 'AES-CBC',
    kdf: 'PBKDF2-SHA256'
  };
}

/**
 * 解密内容（使用密码 + 盐和 IV）
 * @param ciphertext - 加密数据
 * @param password - 解密密码
 * @param salt - 盐值（Base64）
 * @param iv - IV向量（Base64）
 * @param config - 解密配置
 * @returns 解密后的明文
 * 
 * @example
 * ```ts
 * const plaintext = decryptWithPassword(
 *   ciphertext,
 *   'mypassword123',
 *   savedSalt,
 *   savedIV
 * )
 * ```
 */
export function decryptWithPassword(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string,
  config: CryptoConfig = {}
): string {
  if (!ciphertext || !password || !salt || !iv) {
    throw new Error('解密参数不完整');
  }

  try {
    const { keySize, iterations } = { ...DEFAULT_CONFIG, ...config };

    // 从密码派生密钥
    const key = deriveKey(password, salt, keySize, iterations);

    // 解密
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key, {
      iv: CryptoJS.enc.Base64.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    const result = decrypted.toString(CryptoJS.enc.Utf8);

    if (!result) {
      throw new Error('解密失败，密码错误或数据已损坏');
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`解密失败: ${error.message}`);
    }
    throw new Error('解密失败: 未知错误');
  }
}

// ============================================================
// 简单加密（兼容旧代码）
// ============================================================

/**
 * 简单加密（使用固定密钥，不推荐用于生产环境）
 * @deprecated 建议使用 encryptWithPassword
 */
export function encryptContent(content: string): string {
  const secretKey = import.meta.env.VITE_CRYPTO_KEY || 'default-secret-key';
  return CryptoJS.AES.encrypt(content, secretKey).toString();
}

/**
 * 简单解密（使用固定密钥）
 * @deprecated 建议使用 decryptWithPassword
 */
export function decryptContent(encrypted: string): string {
  try {
    const secretKey = import.meta.env.VITE_CRYPTO_KEY || 'default-secret-key';
    const bytes = CryptoJS.AES.decrypt(encrypted, secretKey);
    const result = bytes.toString(CryptoJS.enc.Utf8);
    if (!result) {
      throw new Error('解密失败');
    }
    return result;
  } catch (error) {
    throw new Error(`解密失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// ============================================================
// 哈希函数
// ============================================================

/**
 * 计算文本的 SHA-256 哈希
 */
export function sha256(text: string): string {
  return CryptoJS.SHA256(text).toString(CryptoJS.enc.Hex);
}

/**
 * 计算文本的 MD5 哈希（不推荐用于安全场景）
 * @deprecated 使用 sha256 代替
 */
export function md5(text: string): string {
  return CryptoJS.MD5(text).toString(CryptoJS.enc.Hex);
}

// ============================================================
// 工具函数
// ============================================================

/**
 * 验证加密数据是否完整
 */
export function isValidEncryptedData(data: EncryptResult): boolean {
  return !!(data.ciphertext && data.salt && data.iv);
}

/**
 * 获取加密数据大小（估算，KB）
 */
export function getEncryptedSize(encrypted: string): number {
  return Math.round(encrypted.length / 1024);
}

/**
 * 检查字符串是否已加密（简单判断）
 */
export function isEncrypted(text: string): boolean {
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  return base64Regex.test(text) && text.length > 20;
}

// ============================================================
// 默认导出
// ============================================================

export default {
  encryptWithPassword,
  decryptWithPassword,
  encryptContent,
  decryptContent,
  generateKey,
  generateIV,
  generateSalt,
  sha256,
  md5,
  isValidEncryptedData,
  getEncryptedSize,
  isEncrypted
};