import { Router, Request, Response } from 'express';
import { env } from '../config';
import { getBot } from '../bot';
import fs from 'fs';
import path from 'path';

const router = Router();

// Simple auth middleware - use admin password
const authMiddleware = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (token === env.auth.adminPassword) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Use admin password as Bearer token.' });
  }
};

// Get bot status and webhook info
router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bot = getBot();
    const webhookInfo = await bot.telegram.getWebhookInfo();
    const me = await bot.telegram.getMe();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: env.nodeEnv,
        isProduction: env.isProduction,
        port: env.port,
      },
      bot: {
        username: me.username,
        id: me.id,
        firstName: me.first_name,
      },
      webhook: {
        url: webhookInfo.url || 'Not set (using polling)',
        hasCustomCertificate: webhookInfo.has_custom_certificate,
        pendingUpdateCount: webhookInfo.pending_update_count,
        lastErrorDate: webhookInfo.last_error_date,
        lastErrorMessage: webhookInfo.last_error_message,
        maxConnections: webhookInfo.max_connections,
      },
      config: {
        webhookDomain: env.telegram.webhookDomain,
        webhookPath: env.telegram.webhookPath,
        expectedWebhookUrl: env.telegram.webhookDomain
          ? `${env.telegram.webhookDomain}${env.telegram.webhookPath}`
          : 'Not configured',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: env.isDevelopment ? error.stack : undefined,
    });
  }
});

// Get recent logs (if log file exists)
router.get('/logs', authMiddleware, (req: Request, res: Response) => {
  try {
    const logPath = path.join(process.cwd(), 'logs', 'combined.log');

    if (fs.existsSync(logPath)) {
      const logs = fs.readFileSync(logPath, 'utf-8');
      const lines = logs.split('\n').filter(line => line.trim());
      const recentLogs = lines.slice(-100); // Last 100 lines

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        totalLines: lines.length,
        showing: recentLogs.length,
        logs: recentLogs,
      });
    } else {
      res.json({
        success: true,
        message: 'No log file found',
        note: 'Logs may be written to console only',
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Force webhook setup (useful for debugging)
router.post('/webhook/setup', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bot = getBot();
    const webhookUrl = `${env.telegram.webhookDomain}${env.telegram.webhookPath}`;

    if (!env.telegram.webhookDomain) {
      return res.status(400).json({
        success: false,
        error: 'WEBHOOK_DOMAIN is not configured',
      });
    }

    // Delete old webhook
    await bot.telegram.deleteWebhook({ drop_pending_updates: false });

    // Set new webhook
    await bot.telegram.setWebhook(webhookUrl);

    // Verify
    const webhookInfo = await bot.telegram.getWebhookInfo();

    res.json({
      success: true,
      message: 'Webhook setup complete',
      webhook: {
        url: webhookInfo.url,
        pendingUpdateCount: webhookInfo.pending_update_count,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete webhook (switch to polling)
router.post('/webhook/delete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const bot = getBot();
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });

    const webhookInfo = await bot.telegram.getWebhookInfo();

    res.json({
      success: true,
      message: 'Webhook deleted',
      webhook: webhookInfo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export const logsRoutes = router;
