// src/utils/encryptUtil.ts
import CryptoJS from 'crypto-js';

// ============================================================
// 密码验证工具
// ============================================================

export interface PasswordValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * 验证密码强度
 * 规则：长度≥6，必须同时包含字母(a-z,A-Z)和数字(0-9)
 * @param password - 待验证的密码
 * @returns 验证结果
 */
export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return { isValid: false, message: '密码不能为空' };
  }

  const pwd = password.trim();

  if (pwd.length < 6) {
    return { isValid: false, message: '密码长度至少6位' };
  }

  // 同时包含字母 + 数字
  const hasLetter = /[a-zA-Z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);

  if (!hasLetter || !hasNumber) {
    return { isValid: false, message: '密码必须同时包含字母和数字' };
  }

  return { isValid: true };
}

/**
 * 验证密码是否匹配（用于确认密码）
 */
export function validatePasswordMatch(password: string, confirmPassword: string): PasswordValidationResult {
  if (password !== confirmPassword) {
    return { isValid: false, message: '两次输入的密码不一致' };
  }
  return validatePassword(password);
}

/**
 * 检查密码强度等级
 * @param password - 密码
 * @returns 强度等级: 'weak' | 'medium' | 'strong'
 */
export function checkPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (!password || password.length < 6) return 'weak';

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
}

// ============================================================
// 加密工具（保留供其他场景使用）
// ============================================================

/**
 * 加密内容（使用密码 + 随机盐和 IV）
 */
export function encryptContent(content: string, password: string): {
  ciphertext: string;
  salt: string;
  iv: string;
} {
  const salt = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);
  const iv = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64);

  const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Base64.parse(salt), {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256
  });

  const encrypted = CryptoJS.AES.encrypt(content, key, {
    iv: CryptoJS.enc.Base64.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });

  return {
    ciphertext: encrypted.toString(),
    salt,
    iv
  };
}

/**
 * 解密内容
 */
export function decryptContent(
  ciphertext: string,
  password: string,
  salt: string,
  iv: string
): string {
  const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Base64.parse(salt), {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256
  });

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
}

// ============================================================
// 默认导出
// ============================================================

export default {
  validatePassword,
  validatePasswordMatch,
  checkPasswordStrength,
  encryptContent,
  decryptContent
};