// src/lib/ratelimit.ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Koneksi otomatis membaca variabel yang kita masukkan di .env tadi
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Batasi: Maksimal 5 kali percobaan login per 15 menit per IP address
export const loginRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@ratelimit/login",
});

/**
 * Memeriksa apakah notifikasi untuk sapi tertentu boleh dikirim (Cooldown 30 menit)
 * @param cattleId ID dari eartag / sapi
 * @param alertType Tipe alert (misal: 'demam', 'suhu-rendah', 'baterai')
 */
export async function shouldSendNotification(cattleId: string, alertType: string): Promise<boolean> {
  const cacheKey = `@telegram-cooldown:${cattleId}:${alertType}`;
  
  // 1. Cek apakah key ini sudah ada di Redis
  const isCooldownActive = await redis.get(cacheKey);
  
  if (isCooldownActive) {
    // Jika masih ada di Redis, berarti masih dalam masa cooldown 30 menit -> JANGAN KIRIM
    return false;
  }
  
  // 2. Jika tidak ada, set key di Redis dengan masa aktif 30 menit (1800 detik)
  // Ini menandakan cooldown dimulai sekarang
  await redis.set(cacheKey, "active", { ex: 1800 });
  return true;
}