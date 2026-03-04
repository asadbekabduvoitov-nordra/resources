import dotenv from 'dotenv';

dotenv.config();

function checkEnv() {
  console.log('=== Environment Variables Check ===\n');

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    BOT_TOKEN: process.env.BOT_TOKEN ? '***' + process.env.BOT_TOKEN.slice(-10) : 'NOT SET',
    WEBHOOK_DOMAIN: process.env.WEBHOOK_DOMAIN,
    WEBHOOK_PATH: process.env.WEBHOOK_PATH,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '***' + process.env.SUPABASE_ANON_KEY.slice(-10) : 'NOT SET',
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  };

  Object.entries(envVars).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    console.log(`${status} ${key}: ${value || 'NOT SET'}`);
  });

  console.log('\n=== Computed Values ===\n');
  const isProduction = process.env.NODE_ENV === 'production';
  const webhookDomain = process.env.WEBHOOK_DOMAIN || '';
  const shouldUseWebhook = isProduction && webhookDomain;

  console.log(`Is Production: ${isProduction}`);
  console.log(`Has Webhook Domain: ${!!webhookDomain}`);
  console.log(`Should Use Webhook: ${shouldUseWebhook}`);

  if (shouldUseWebhook) {
    const webhookUrl = `${webhookDomain}${process.env.WEBHOOK_PATH || '/webhook'}`;
    console.log(`\nFull Webhook URL: ${webhookUrl}`);
  } else {
    console.log('\n⚠️  Bot will use POLLING mode');
    if (isProduction) {
      console.log('⚠️  Warning: Running in production but WEBHOOK_DOMAIN is not set!');
    }
  }
}

checkEnv();
