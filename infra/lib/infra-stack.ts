import * as cdk from 'aws-cdk-lib/core';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

// Load timetable data
const timetableFile = path.join(__dirname, '..', '..', 'data', 'timetable.json');
const timetableData: Array<{ day: number; dateStr: string; fullDate: string; suhoor: string; iftar: string }> =
  JSON.parse(fs.readFileSync(timetableFile, 'utf8'));

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── DynamoDB Table ──────────────────────────────────────────────

    const subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: 'DerPushSubscriptions',
      partitionKey: { name: 'endpoint', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Secrets Manager ─────────────────────────────────────────────
    // Stores VAPID keys for Web Push authentication.
    // Format: { "publicKey": "...", "privateKey": "...", "subject": "mailto:..." }

    const vapidSecret = new secretsmanager.Secret(this, 'VapidKeys', {
      secretName: 'der-vapid-keys',
      description: 'VAPID keys for Web Push notifications (Daawat E Ramzaan)',
    });

    // ── Lambda: Register Token ──────────────────────────────────────

    const registerTokenFn = new lambdaNode.NodejsFunction(this, 'RegisterTokenFn', {
      functionName: 'der-register-token',
      entry: path.join(__dirname, '..', 'lambda', 'register-token', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      environment: {
        TABLE_NAME: subscriptionsTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
      },
    });

    subscriptionsTable.grantWriteData(registerTokenFn);

    // ── Lambda: Send Notification ───────────────────────────────────

    const sendNotificationFn = new lambdaNode.NodejsFunction(this, 'SendNotificationFn', {
      functionName: 'der-send-notification',
      entry: path.join(__dirname, '..', 'lambda', 'send-notification', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        TABLE_NAME: subscriptionsTable.tableName,
        VAPID_SECRET_ARN: vapidSecret.secretArn,
        TIMETABLE_JSON: JSON.stringify(timetableData),
        ADMIN_API_KEY: process.env.ADMIN_PASSWORD || 'ramzaan2026',
      },
      bundling: {
        minify: true,
        sourceMap: false,
        forceDockerBundling: false,
        externalModules: ['@aws-sdk/*'],
      },
    });

    subscriptionsTable.grantReadWriteData(sendNotificationFn);
    vapidSecret.grantRead(sendNotificationFn);

    // ── API Gateway (HTTP API) ──────────────────────────────────────

    const httpApi = new apigatewayv2.HttpApi(this, 'DerNotificationApi', {
      apiName: 'der-notification-api',
      description: 'Daawat E Ramzaan Notification API',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
      },
    });

    // POST /register-token (public)
    httpApi.addRoutes({
      path: '/register-token',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'RegisterTokenIntegration',
        registerTokenFn,
      ),
    });

    // POST /admin/notify (public route — protect with API key in the Lambda or via IAM)
    // For simplicity, we'll use a shared API key checked in the Lambda
    httpApi.addRoutes({
      path: '/admin/notify',
      methods: [apigatewayv2.HttpMethod.POST],
      integration: new apigatewayv2Integrations.HttpLambdaIntegration(
        'SendNotificationIntegration',
        sendNotificationFn,
      ),
    });

    // ── EventBridge Scheduler ───────────────────────────────────────
    // Create scheduled rules for Suhoor (-15min) and Iftar (-15min)
    // for each remaining day in the timetable

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // IAM role for the scheduler to invoke Lambda
    const schedulerRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
      description: 'Role for EventBridge Scheduler to invoke notification Lambda',
    });

    sendNotificationFn.grantInvoke(schedulerRole);

    // Create a schedule group for organizing our schedules
    const scheduleGroup = new scheduler.CfnScheduleGroup(this, 'DerScheduleGroup', {
      name: 'der-ramadan-notifications',
    });

    for (const entry of timetableData) {
      // Skip past dates
      if (entry.fullDate < today) continue;

      // Use exact times from the timetable
      const suhoorTime = entry.suhoor;
      const iftarTime = entry.iftar;

      // Suhoor schedule — at(YYYY-MM-DDThh:mm:00) in IST (UTC+5:30)
      const suhoorUtc = istToUtc(entry.fullDate, suhoorTime);
      new scheduler.CfnSchedule(this, `SuhoorDay${entry.day}`, {
        name: `der-suhoor-day-${entry.day}`,
        groupName: scheduleGroup.name,
        scheduleExpression: `at(${suhoorUtc})`,
        scheduleExpressionTimezone: 'UTC',
        flexibleTimeWindow: { mode: 'OFF' },
        target: {
          arn: sendNotificationFn.functionArn,
          roleArn: schedulerRole.roleArn,
          input: JSON.stringify({ detail: { type: 'suhoor', day: entry.day } }),
        },
        state: 'ENABLED',
      });

      // Iftar schedule
      const iftarUtc = istToUtc(entry.fullDate, iftarTime);
      new scheduler.CfnSchedule(this, `IftarDay${entry.day}`, {
        name: `der-iftar-day-${entry.day}`,
        groupName: scheduleGroup.name,
        scheduleExpression: `at(${iftarUtc})`,
        scheduleExpressionTimezone: 'UTC',
        flexibleTimeWindow: { mode: 'OFF' },
        target: {
          arn: sendNotificationFn.functionArn,
          roleArn: schedulerRole.roleArn,
          input: JSON.stringify({ detail: { type: 'iftar', day: entry.day } }),
        },
        state: 'ENABLED',
      });
    }

    // ── Outputs ─────────────────────────────────────────────────────

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: httpApi.apiEndpoint,
      description: 'Notification API Gateway URL',
    });

    new cdk.CfnOutput(this, 'RegisterTokenUrl', {
      value: `${httpApi.apiEndpoint}/register-token`,
      description: 'POST endpoint to register device tokens',
    });

    new cdk.CfnOutput(this, 'AdminNotifyUrl', {
      value: `${httpApi.apiEndpoint}/admin/notify`,
      description: 'POST endpoint to send admin push notifications',
    });

    new cdk.CfnOutput(this, 'VapidSecretArn', {
      value: vapidSecret.secretArn,
      description: 'ARN of the VAPID keys secret — update with your generated VAPID keys',
    });

    new cdk.CfnOutput(this, 'SubscriptionsTableName', {
      value: subscriptionsTable.tableName,
      description: 'DynamoDB table for push subscriptions',
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

/**
 * Offset a time string (HH:MM:SS) by a number of minutes.
 * Returns HH:MM:SS with the offset applied.
 */
function offsetTime(time: string, offsetMinutes: number): string {
  const [h, m, s] = time.split(':').map(Number);
  const totalMinutes = h * 60 + m + offsetMinutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(s || 0).padStart(2, '0')}`;
}

/**
 * Convert IST date + time to UTC datetime string for EventBridge at() expression.
 * IST is UTC+5:30. Returns format: YYYY-MM-DDThh:mm:ss
 */
function istToUtc(dateStr: string, timeStr: string): string {
  const [h, m, s] = timeStr.split(':').map(Number);
  // IST is UTC+5:30, so subtract 5 hours 30 minutes
  const istDate = new Date(`${dateStr}T${timeStr}+05:30`);
  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(istDate.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
