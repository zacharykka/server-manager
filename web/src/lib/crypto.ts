import CryptoJS from 'crypto-js'

const CLIENT_SALT = 'server-manager-2025-secure-salt'

/**
 * 客户端密码加密函数
 * 使用SHA-256 + 盐值进行客户端哈希
 * 注意：这只是传输层保护，服务器端仍需要使用bcrypt
 */
export function hashPassword(password: string): string {
  // 使用SHA-256 + 盐值进行客户端哈希
  return CryptoJS.SHA256(password + CLIENT_SALT).toString(CryptoJS.enc.Hex)
}

/**
 * 生成安全的随机盐值（如果需要动态盐值）
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex)
}

/**
 * 验证密码强度
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('密码长度至少8位')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('密码必须包含至少一个特殊字符')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}