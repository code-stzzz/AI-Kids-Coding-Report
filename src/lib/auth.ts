/**
 * JWT Token 解析工具
 */

interface JWTPayload {
  sub: string;
  email?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * 从 JWT token 中解析用户 ID
 * @param token JWT token 字符串
 * @returns 用户 ID 或 null
 */
export function getUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  try {
    // JWT 格式: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('[JWT] Token 格式错误，分段数:', parts.length);
      return null;
    }

    // Base64 解码 payload（第二部分）
    let payload = parts[1];
    
    // 处理 URL-safe base64 编码
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // 补齐 base64 长度
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += '='.repeat(padding);
    }

    // 解码
    const decoded = atob(payload);
    const parsed: JWTPayload = JSON.parse(decoded);

    // 检查是否过期
    if (parsed.exp && parsed.exp < Date.now() / 1000) {
      console.log('[JWT] Token 已过期');
      return null;
    }

    return parsed.sub || null;
  } catch (error) {
    console.error('[JWT] Token 解析失败:', error);
    return null;
  }
}

/**
 * 从请求头中提取 token
 * @param authHeader Authorization header 值
 * @returns token 字符串或 null
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }
  return authHeader.replace('Bearer ', '');
}

/**
 * 从请求中获取用户 ID
 * @param request NextRequest 对象
 * @returns 用户 ID 或 null
 */
export function getUserIdFromRequest(request: { headers: { get: (name: string) => string | null } }): string | null {
  const authHeader = request.headers.get('authorization');
  const token = extractToken(authHeader);
  return getUserIdFromToken(token);
}
