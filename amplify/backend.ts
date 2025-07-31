import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';

export const backend = defineBackend({
  auth,
  data,
  helloFunction: defineFunction({
    entry: './functions/myFunction.ts',
    environment: {
      TABLE_NAME: "Sandwich"
    }
  }),
});

// Grant the function access to list tables (account level)
backend.helloFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:ListTables'],
    resources: ['*']
  })
);

// Grant the function access to Sandwich tables specifically
backend.helloFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Scan',
      'dynamodb:Query'
    ],
    resources: [`arn:aws:dynamodb:*:*:table/Sandwich*`]
  })
);