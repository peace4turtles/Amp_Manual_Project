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

// Grant the function access to all DynamoDB tables with Sandwich prefix
backend.helloFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'dynamodb:ListTables',
      'dynamodb:GetItem',
      'dynamodb:PutItem',
      'dynamodb:UpdateItem',
      'dynamodb:DeleteItem',
      'dynamodb:Scan',
      'dynamodb:Query'
    ],
    resources: [
      `arn:aws:dynamodb:*:*:table/Sandwich*`,
      `arn:aws:dynamodb:*:*:table/*`
    ]
  })
);