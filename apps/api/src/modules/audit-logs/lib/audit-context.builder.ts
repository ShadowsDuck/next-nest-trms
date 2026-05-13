import { getConnInfo } from '@hono/node-server/conninfo';
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
  // 1. เชื่อ Cloudflare ก่อนเสมอ
  const cfIp = c.req.header('cf-connecting-ip');
  if (cfIp) return cfIp;

  // 2. เชื่อ x-forwarded-for (ดึงตัวแรกสุดใน proxy chain)
  const xff = c.req.header('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();

  // 3. fallback ไปที่ x-real-ip
  const xri = c.req.header('x-real-ip');
  if (xri) return xri;

  // 4. ก๊อกสุดท้าย: ดึงจาก TCP level ผ่าน Hono Helper
  const connInfo = getConnInfo(c);
  return connInfo.remote.address || null;
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
