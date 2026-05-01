import "server-only";

import { neon, Pool } from "@neondatabase/serverless";

const g = globalThis as unknown as {
  __wechuNeon?: ReturnType<typeof neon>;
  __wechuPool?: Pool;
};

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL이 설정되어 있지 않습니다.");
  }
  if (!g.__wechuNeon) {
    g.__wechuNeon = neon(url);
  }
  return g.__wechuNeon;
}

export function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url?.trim()) {
    throw new Error("DATABASE_URL이 설정되어 있지 않습니다.");
  }
  if (!g.__wechuPool) {
    g.__wechuPool = new Pool({ connectionString: url });
  }
  return g.__wechuPool;
}
