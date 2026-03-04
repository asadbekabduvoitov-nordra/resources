import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',

  // Telegram
  telegram: {
    botToken: process.env.BOT_TOKEN!,
    webhookDomain: process.env.WEBHOOK_DOMAIN || '',
    webhookPath: process.env.WEBHOOK_PATH || '/webhook',
    devTelegramId: parseInt(process.env.DEV_TELEGRAM_ID || '0', 10),
  },

  // Authentication
  auth: {
    adminPassword: process.env.ADMIN_PASSWORD!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
} as const;

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'BOT_TOKEN',
] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
