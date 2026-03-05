#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfraStack } from '../lib/infra-stack';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

const app = new cdk.App();
new InfraStack(app, 'DerNotificationStack', {
  env: {
    region: 'ap-south-1',
  },
  description: 'Daawat E Ramzaan - Push Notification Infrastructure',
});
