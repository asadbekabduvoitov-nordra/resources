import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';

dotenv.config();

async function deleteWebhook() {
  const botToken = process.env.BOT_TOKEN;

  if (!botToken) {
    console.error('BOT_TOKEN not found in environment variables');
    process.exit(1);
  }

  const bot = new Telegraf(botToken);

  try {
    console.log('Checking current webhook info...');
    const webhookInfo = await bot.telegram.getWebhookInfo();
    console.log('Current webhook:', JSON.stringify(webhookInfo, null, 2));

    if (webhookInfo.url) {
      console.log('\nDeleting webhook...');
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });
      console.log('✅ Webhook deleted successfully!');
    } else {
      console.log('No webhook is currently set');
    }

    // Verify deletion
    const updatedInfo = await bot.telegram.getWebhookInfo();
    console.log('\nUpdated webhook info:', JSON.stringify(updatedInfo, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

deleteWebhook();
