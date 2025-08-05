import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Effect, PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { Stack } from "aws-cdk-lib";
import { auth } from './auth/resource';
import { data } from './data/resource';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  LambdaIntegration,
  RestApi,
  Cors
} from "aws-cdk-lib/aws-apigateway";
import { myAPIFunction } from './functions/api-function.js/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  myAPIFunction,
  helloFunction: defineFunction({
    entry: './functions/myFunction.ts',
    environment: {
      TABLE_NAME: "Sandwich"
    }
  }),
  storage
});

backend.helloFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['dynamodb:ListTables'],
    resources: ['*']
  })
);

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

// create a new API stack
const apiStack = backend.createStack("api-stack");

// Remove defaultCorsPreflightOptions - this is causing the conflict
const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
    defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
    allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
    allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  },
});

const lambdaIntegration = new LambdaIntegration(
  backend.helloFunction.resources.lambda
);

const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(apiStack, 'CognitoAuthorizer', {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create items resource
const items = myRestApi.root.addResource("items", {
  defaultMethodOptions: {
    authorizationType: AuthorizationType.COGNITO,
  },
});

// Add GET method for items
items.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
});

// create public resource  
const publicItems = myRestApi.root.addResource("public");

// Add CORS preflight for public
// publicItems.addCorsPreflight({
//   allowOrigins: ['*'],
//   allowMethods: ['GET', 'POST', 'OPTIONS'],
//   allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// });

// Add GET method for public
publicItems.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.NONE,
});

// create IAM policy
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/items", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/public", "dev")}`,
      ],
    }),
  ],
});

// attach policy to roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(apiRestPolicy);

// add outputs
backend.addOutput({
  custom: {
    API: {
      [myRestApi.restApiName]: {
        endpoint: myRestApi.url,
        region: Stack.of(myRestApi).region,
        apiName: myRestApi.restApiName,
      },
    },
  },
});