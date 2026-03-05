#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfraStack } from '../lib/infra-stack';

const app = new cdk.App();
new InfraStack(app, 'DerNotificationStack', {
  env: {
    region: 'ap-south-1',
  },
  description: 'Daawat E Ramzaan - Push Notification Infrastructure',
});
