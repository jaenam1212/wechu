/** neon() 반환 타입이 유니언이라 행 배열만 쓸 때 명시적으로 좁힙니다. */
export function neonRows<T extends Record<string, unknown>>(result: unknown): T[] {
  if (!Array.isArray(result)) return [];
  return result as T[];
}
