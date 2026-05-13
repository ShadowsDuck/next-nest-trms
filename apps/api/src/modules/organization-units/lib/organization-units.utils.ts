import { throwConflict } from '../../../lib/http-errors';

/**
 * แปลง error แจ้งเตือนเมื่อข้อมูลมีชื่อซ้ำ
 */
export function rethrowDuplicateNameError(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  ) {
    throwConflict('ชื่อหน่วยงานซ้ำภายใต้หน่วยงานแม่เดียวกัน');
  }
}
