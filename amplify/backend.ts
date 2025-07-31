import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';

export const backend = defineBackend({
  auth,
  data,
  helloFunction: defineFunction({
    entry: './functions/myFunction.ts',
  }),
});
const sandwichTable = backend.data.resources.tables["Sandwich"];
backend.helloFunction.addEnvironment("TABLE_NAME", sandwichTable.tableName);

// Grant the function access to the Sandwich table
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
    resources: [sandwichTable.tableArn]
  })
);