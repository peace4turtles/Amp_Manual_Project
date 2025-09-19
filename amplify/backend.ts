import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

import {
  BackupPlan,
  BackupPlanRule,
  BackupResource,
  BackupVault,
} from "aws-cdk-lib/aws-backup";
import { Schedule } from "aws-cdk-lib/aws-events";
import { Duration } from "aws-cdk-lib/core";

const backend = defineBackend({
  auth,
  data
});


const backupStack = backend.createStack("backup-stack");
const myTables = Object.values(backend.data.resources.tables);

// Log the tables being backed up (for debugging)
console.log('Tables being backed up:', Object.keys(backend.data.resources.tables));
console.log('Number of tables:', myTables.length);


const envName = process.env.AWS_BRANCH || 'default';
const vaultName = `model-hub-backup-vault-${envName}`
const vault = new BackupVault(backupStack, vaultName);


const plan = new BackupPlan(backupStack, "BackupPlan", {
  backupPlanName: "backup-plan",
  backupVault: vault,
});


plan.addRule(
  new BackupPlanRule({
    deleteAfter: Duration.days(7),
    ruleName: "backup-plan-rule",
    scheduleExpression: Schedule.cron({
      minute: "0",
      hour: "*",
      day: "*",
      month: "*",
      year: "*",
    }),
  })
);


plan.addSelection("BackupPlanSelection", {
  resources: myTables.map((table) => BackupResource.fromDynamoDbTable(table)),
  allowRestores: true,
});
