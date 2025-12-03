/**
 * Slack Integration for Critical Alerts
 *
 * Provides functionality to send notifications to Slack channels
 * for critical system alerts, monitoring updates, and important events.
 *
 * Environment Variables Required:
 * - SLACK_WEBHOOK_URL: Incoming webhook URL for the default channel
 * - SLACK_BOT_TOKEN: Bot token for advanced features (optional)
 * - SLACK_SIGNING_SECRET: For verifying incoming requests (optional)
 */

// ============================================================================
// Types
// ============================================================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  thread_ts?: string;
  mrkdwn?: boolean;
}

export interface SlackBlock {
  type: 'section' | 'divider' | 'header' | 'context' | 'actions' | 'image';
  text?: SlackTextObject;
  fields?: SlackTextObject[];
  accessory?: SlackAccessory;
  elements?: SlackElement[];
  block_id?: string;
}

export interface SlackTextObject {
  type: 'plain_text' | 'mrkdwn';
  text: string;
  emoji?: boolean;
}

export interface SlackAccessory {
  type: 'button' | 'image' | 'static_select';
  text?: SlackTextObject;
  action_id?: string;
  url?: string;
  value?: string;
  image_url?: string;
  alt_text?: string;
}

export interface SlackElement {
  type: 'button' | 'image' | 'plain_text' | 'mrkdwn';
  text?: SlackTextObject | string;
  action_id?: string;
  url?: string;
  value?: string;
  style?: 'primary' | 'danger';
  emoji?: boolean;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: { title: string; value: string; short?: boolean }[];
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface AlertConfig {
  title: string;
  message: string;
  severity: AlertSeverity;
  source?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
}

export interface SlackConfig {
  webhookUrl?: string;
  botToken?: string;
  defaultChannel?: string;
  appName?: string;
  environment?: string;
  enabled?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SEVERITY_CONFIG: Record<AlertSeverity, {
  emoji: string;
  color: string;
  priority: number;
}> = {
  info: { emoji: ':information_source:', color: '#2196F3', priority: 0 },
  warning: { emoji: ':warning:', color: '#FF9800', priority: 1 },
  error: { emoji: ':x:', color: '#F44336', priority: 2 },
  critical: { emoji: ':rotating_light:', color: '#9C27B0', priority: 3 },
};

const DEFAULT_CONFIG: SlackConfig = {
  appName: 'Onchain Analytics',
  environment: process.env.NODE_ENV || 'development',
  enabled: process.env.SLACK_ENABLED !== 'false',
};

// ============================================================================
// Slack Client
// ============================================================================

export class SlackClient {
  private config: SlackConfig;
  private messageQueue: SlackMessage[] = [];
  private isProcessing = false;
  private rateLimitDelay = 1000; // 1 message per second

  constructor(config: Partial<SlackConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      botToken: process.env.SLACK_BOT_TOKEN,
      defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#alerts',
      ...config,
    };
  }

  /**
   * Send a raw Slack message
   */
  async sendMessage(message: SlackMessage): Promise<{ ok: boolean; error?: string }> {
    if (!this.config.enabled) {
      console.log('[Slack] Disabled, skipping message:', message.text);
      return { ok: true };
    }

    if (!this.config.webhookUrl) {
      console.warn('[Slack] No webhook URL configured');
      return { ok: false, error: 'No webhook URL configured' };
    }

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Slack] Failed to send message:', errorText);
        return { ok: false, error: errorText };
      }

      return { ok: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[Slack] Error sending message:', errorMessage);
      return { ok: false, error: errorMessage };
    }
  }

  /**
   * Send an alert notification
   */
  async sendAlert(alert: AlertConfig): Promise<{ ok: boolean; error?: string }> {
    const severityConfig = SEVERITY_CONFIG[alert.severity];
    const timestamp = Math.floor(Date.now() / 1000);

    const blocks: SlackBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityConfig.emoji} ${alert.title}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: alert.message,
        },
      },
    ];

    // Add metadata fields if present
    if (alert.source || alert.entityType || alert.metadata) {
      const fields: SlackTextObject[] = [];

      if (alert.source) {
        fields.push({ type: 'mrkdwn', text: `*Source:*\n${alert.source}` });
      }

      if (alert.entityType && alert.entityId) {
        fields.push({
          type: 'mrkdwn',
          text: `*Entity:*\n${alert.entityType} (${alert.entityId})`,
        });
      }

      if (alert.severity) {
        fields.push({
          type: 'mrkdwn',
          text: `*Severity:*\n${alert.severity.toUpperCase()}`,
        });
      }

      if (this.config.environment) {
        fields.push({
          type: 'mrkdwn',
          text: `*Environment:*\n${this.config.environment}`,
        });
      }

      if (fields.length > 0) {
        blocks.push({
          type: 'section',
          fields,
        });
      }
    }

    // Add action button if URL provided
    if (alert.actionUrl) {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: alert.actionLabel || 'View Details',
              emoji: true,
            },
            url: alert.actionUrl,
            action_id: 'view_details',
            style: alert.severity === 'critical' ? 'danger' : 'primary',
          },
        ],
      });
    }

    // Add context footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${this.config.appName} | <!date^${timestamp}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
        },
      ],
    });

    const message: SlackMessage = {
      text: `${severityConfig.emoji} ${alert.title}: ${alert.message}`,
      blocks,
      attachments: [
        {
          color: severityConfig.color,
          fallback: `${alert.title}: ${alert.message}`,
        },
      ],
    };

    return this.sendMessage(message);
  }

  /**
   * Queue a message for batch sending (rate-limited)
   */
  queueMessage(message: SlackMessage): void {
    this.messageQueue.push(message);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.messageQueue.length === 0) return;

    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        await this.sendMessage(message);
        await new Promise((resolve) => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    this.isProcessing = false;
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Send a critical alert (highest priority)
   */
  async critical(title: string, message: string, options: Partial<AlertConfig> = {}) {
    return this.sendAlert({
      title,
      message,
      severity: 'critical',
      ...options,
    });
  }

  /**
   * Send an error alert
   */
  async error(title: string, message: string, options: Partial<AlertConfig> = {}) {
    return this.sendAlert({
      title,
      message,
      severity: 'error',
      ...options,
    });
  }

  /**
   * Send a warning alert
   */
  async warning(title: string, message: string, options: Partial<AlertConfig> = {}) {
    return this.sendAlert({
      title,
      message,
      severity: 'warning',
      ...options,
    });
  }

  /**
   * Send an info notification
   */
  async info(title: string, message: string, options: Partial<AlertConfig> = {}) {
    return this.sendAlert({
      title,
      message,
      severity: 'info',
      ...options,
    });
  }

  // ============================================================================
  // Specialized Alert Types
  // ============================================================================

  /**
   * Send a system health alert
   */
  async healthAlert(
    service: string,
    status: 'healthy' | 'degraded' | 'down',
    details?: string
  ) {
    const severityMap = {
      healthy: 'info' as const,
      degraded: 'warning' as const,
      down: 'critical' as const,
    };

    const emojiMap = {
      healthy: ':white_check_mark:',
      degraded: ':warning:',
      down: ':red_circle:',
    };

    return this.sendAlert({
      title: `System Health: ${service}`,
      message: `${emojiMap[status]} *${service}* is *${status.toUpperCase()}*${details ? `\n\n${details}` : ''}`,
      severity: severityMap[status],
      source: 'Health Monitor',
      metadata: { service, status },
    });
  }

  /**
   * Send a deployment notification
   */
  async deploymentNotification(
    version: string,
    environment: string,
    status: 'started' | 'completed' | 'failed',
    details?: string
  ) {
    const severityMap = {
      started: 'info' as const,
      completed: 'info' as const,
      failed: 'critical' as const,
    };

    const emojiMap = {
      started: ':rocket:',
      completed: ':white_check_mark:',
      failed: ':x:',
    };

    return this.sendAlert({
      title: `Deployment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `${emojiMap[status]} Deployment of *v${version}* to *${environment}*${status === 'completed' ? ' succeeded' : status === 'failed' ? ' failed' : ' started'}${details ? `\n\n${details}` : ''}`,
      severity: severityMap[status],
      source: 'Deployment Pipeline',
      metadata: { version, environment, status },
    });
  }

  /**
   * Send a cron job failure alert
   */
  async cronJobFailed(
    jobName: string,
    error: string,
    executionId?: string
  ) {
    return this.sendAlert({
      title: `Cron Job Failed: ${jobName}`,
      message: `The scheduled job *${jobName}* failed with error:\n\`\`\`${error}\`\`\``,
      severity: 'error',
      source: 'Cron Scheduler',
      entityType: 'cron_job',
      entityId: executionId,
      actionUrl: executionId
        ? `${process.env.NEXT_PUBLIC_APP_URL}/admin/cron?id=${executionId}`
        : undefined,
      actionLabel: 'View Execution',
    });
  }

  /**
   * Send a score drop alert
   */
  async scoreDropAlert(
    entityName: string,
    previousScore: number,
    newScore: number,
    threshold: number
  ) {
    const drop = previousScore - newScore;
    const severity = drop >= 20 ? 'critical' : drop >= 10 ? 'error' : 'warning';

    return this.sendAlert({
      title: `Score Drop Detected: ${entityName}`,
      message: `*${entityName}* score dropped from *${previousScore}* to *${newScore}* (${drop > 0 ? '-' : '+'}${Math.abs(drop)} points)\n\nThreshold: ${threshold} points`,
      severity,
      source: 'Score Monitor',
      metadata: { previousScore, newScore, drop, threshold },
    });
  }

  /**
   * Send a rate limit warning
   */
  async rateLimitWarning(
    service: string,
    currentUsage: number,
    limit: number,
    resetTime?: Date
  ) {
    const percentage = (currentUsage / limit) * 100;
    const severity = percentage >= 95 ? 'critical' : percentage >= 80 ? 'warning' : 'info';

    return this.sendAlert({
      title: `Rate Limit Warning: ${service}`,
      message: `*${service}* API usage is at *${percentage.toFixed(1)}%* of limit\n\nCurrent: ${currentUsage.toLocaleString()} / ${limit.toLocaleString()}${resetTime ? `\nResets: ${resetTime.toISOString()}` : ''}`,
      severity,
      source: 'Rate Limiter',
      metadata: { service, currentUsage, limit, percentage },
    });
  }

  /**
   * Send a payment failure alert
   */
  async paymentFailed(
    customerId: string,
    amount: number,
    currency: string,
    reason: string
  ) {
    return this.sendAlert({
      title: 'Payment Failed',
      message: `Payment of *${currency.toUpperCase()} ${amount.toFixed(2)}* failed for customer \`${customerId}\`\n\nReason: ${reason}`,
      severity: 'error',
      source: 'Billing System',
      entityType: 'customer',
      entityId: customerId,
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?customer=${customerId}`,
      actionLabel: 'View Customer',
    });
  }

  /**
   * Send a security alert
   */
  async securityAlert(
    type: string,
    description: string,
    sourceIp?: string,
    userId?: string
  ) {
    return this.sendAlert({
      title: `Security Alert: ${type}`,
      message: `:shield: ${description}${sourceIp ? `\n\nSource IP: \`${sourceIp}\`` : ''}${userId ? `\nUser ID: \`${userId}\`` : ''}`,
      severity: 'critical',
      source: 'Security Monitor',
      metadata: { type, sourceIp, userId },
      actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/security/alerts`,
      actionLabel: 'View Security Dashboard',
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let slackClientInstance: SlackClient | null = null;

export function getSlackClient(config?: Partial<SlackConfig>): SlackClient {
  if (!slackClientInstance || config) {
    slackClientInstance = new SlackClient(config);
  }
  return slackClientInstance;
}

// ============================================================================
// Convenience Exports
// ============================================================================

export const slack = {
  send: (message: SlackMessage) => getSlackClient().sendMessage(message),
  alert: (config: AlertConfig) => getSlackClient().sendAlert(config),
  critical: (title: string, message: string, options?: Partial<AlertConfig>) =>
    getSlackClient().critical(title, message, options),
  error: (title: string, message: string, options?: Partial<AlertConfig>) =>
    getSlackClient().error(title, message, options),
  warning: (title: string, message: string, options?: Partial<AlertConfig>) =>
    getSlackClient().warning(title, message, options),
  info: (title: string, message: string, options?: Partial<AlertConfig>) =>
    getSlackClient().info(title, message, options),
  health: (service: string, status: 'healthy' | 'degraded' | 'down', details?: string) =>
    getSlackClient().healthAlert(service, status, details),
  deployment: (version: string, env: string, status: 'started' | 'completed' | 'failed', details?: string) =>
    getSlackClient().deploymentNotification(version, env, status, details),
  cronFailed: (jobName: string, error: string, executionId?: string) =>
    getSlackClient().cronJobFailed(jobName, error, executionId),
  scoreDrop: (entity: string, prev: number, curr: number, threshold: number) =>
    getSlackClient().scoreDropAlert(entity, prev, curr, threshold),
  rateLimit: (service: string, current: number, limit: number, reset?: Date) =>
    getSlackClient().rateLimitWarning(service, current, limit, reset),
  paymentFailed: (customerId: string, amount: number, currency: string, reason: string) =>
    getSlackClient().paymentFailed(customerId, amount, currency, reason),
  security: (type: string, description: string, sourceIp?: string, userId?: string) =>
    getSlackClient().securityAlert(type, description, sourceIp, userId),
};

export default slack;
