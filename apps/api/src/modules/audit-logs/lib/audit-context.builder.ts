import type { Context } from 'hono';
import type { HonoEnv } from '../../../types/hono';
import type { AuditContextInput, AuditLogContext } from '../audit-logs.types';

/**
 * Layer 1: Pure builder — ประกอบร่างวัตถุ Domain
 * (Testable, Framework-agnostic)
 */
export function buildAuditLogContext(
  input: AuditContextInput,
): AuditLogContext {
  return {
    userId: input.userId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  };
}

/**
 * Layer 2: Policy layer — จัดการนโยบายการดึงค่าจาก HTTP Header
 */
export function resolveIpAddress(c: Context<HonoEnv>): string | null {
  return (
    c.req.header('cf-connecting-ip') ??
    c.req.header('x-forwarded-for') ??
    c.req.header('x-real-ip') ??
    null
  );
}

/**
 * Layer 3: Framework Extractor (Authenticated)
 * @throws Error ถ้าเรียกใช้ใน Route ที่ไม่มี Auth Middleware
 */
export function extractAuditContext(c: Context<HonoEnv>): AuditLogContext {
  const user = c.get('user');
  if (!user) {
    throw new Error(
      '[extractAuditContext] called on unauthenticated route. ' +
        'Add auth middleware or use extractPublicAuditContext instead.',
    );
  }

  return buildAuditLogContext({
    userId: user.id,
    ipAddress: resolveIpAddress(c),
    userAgent: c.req.header('user-agent') ?? null,
  });
}

/**
 * Layer 3: Framework Extractor (Public/Intentional)
 * @param systemActorId ID ที่ระบุเจตนาว่าใครเป็นคนทำ (เช่น 'anonymous', 'system')
 */
export function extractPublicAuditContext(
  c: Context<HonoEnv>,
  systemActorId: string,
): AuditLogContext {
  return buildAuditLogContext({
    userId: systemActorId,
    ipAddress: resolveIpAddress(c),
    userAgent: c.req.header('user-agent') ?? null,
  });
}
