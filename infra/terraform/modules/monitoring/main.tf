# Monitoring Infrastructure Module
# Phase 4, Week 8 - DevSecOps Checklist
#
# Configures monitoring and alerting infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ================================================================
# VARIABLES
# ================================================================

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  sensitive   = true
  default     = null
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

# ================================================================
# SNS TOPICS FOR ALERTS
# ================================================================

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name        = "${var.project_name}-alerts"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_sns_topic_subscription" "slack" {
  count     = var.slack_webhook_url != null ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "https"
  endpoint  = var.slack_webhook_url
}

# ================================================================
# CLOUDWATCH LOG GROUPS
# ================================================================

resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/application/${var.project_name}/${var.environment}"
  retention_in_days = var.environment == "production" ? 90 : 30

  tags = {
    Name        = "${var.project_name}-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_log_group" "security" {
  name              = "/aws/security/${var.project_name}/${var.environment}"
  retention_in_days = 365 # Security logs retained for 1 year

  tags = {
    Name        = "${var.project_name}-security-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ================================================================
# CLOUDWATCH METRIC ALARMS
# ================================================================

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High error rate detected (>10 5XX errors in 5 minutes)"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions          = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-high-error-rate"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${var.project_name}-${var.environment}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  extended_statistic  = "p95"
  threshold           = 3000 # 3 seconds
  alarm_description   = "High latency detected (p95 > 3s)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-high-latency"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_cloudwatch_metric_alarm" "security_anomaly" {
  alarm_name          = "${var.project_name}-${var.environment}-security-anomaly"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnauthorizedAttempts"
  namespace           = "Custom/${var.project_name}"
  period              = 300
  statistic           = "Sum"
  threshold           = 100
  alarm_description   = "Unusual number of unauthorized access attempts"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = {
    Name        = "${var.project_name}-security-anomaly"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ================================================================
# CLOUDWATCH DASHBOARD
# ================================================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Request Count"
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          metrics = [
            ["Custom/${var.project_name}", "RequestCount", { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "API Latency"
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          metrics = [
            ["Custom/${var.project_name}", "Latency", { stat = "p95" }],
            ["Custom/${var.project_name}", "Latency", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "Error Rate"
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          metrics = [
            ["Custom/${var.project_name}", "ErrorCount", { stat = "Sum" }]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title   = "AI Provider Latency"
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          metrics = [
            ["Custom/${var.project_name}", "OpenAILatency", { stat = "Average" }],
            ["Custom/${var.project_name}", "AnthropicLatency", { stat = "Average" }]
          ]
        }
      },
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6
        properties = {
          title  = "Recent Errors"
          region = "us-east-1"
          query  = "SOURCE '${aws_cloudwatch_log_group.application.name}' | fields @timestamp, @message | filter @message like /error/i | sort @timestamp desc | limit 100"
        }
      }
    ]
  })
}

# ================================================================
# OUTPUTS
# ================================================================

output "alerts_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "application_log_group" {
  description = "Application CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "security_log_group" {
  description = "Security CloudWatch log group name"
  value       = aws_cloudwatch_log_group.security.name
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
