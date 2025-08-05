import { defineBackend, defineFunction } from '@aws-amplify/backend';
import { Effect, PolicyStatement, Policy } from 'aws-cdk-lib/aws-iam';
import { Stack } from "aws-cdk-lib";
import { auth } from './auth/resource';
import { data } from './data/resource';
import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
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

const myRestApi = new RestApi(apiStack, "RestApi", {
  restApiName: "myRestApi",
  deploy: true,
  deployOptions: {
    stageName: "dev",
  },
  // defaultCorsPreflightOptions: {
  //   allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
  //   allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
  //   allowHeaders: Cors.DEFAULT_HEADERS, // Specify only the headers you need to allow
  // },
});

const lambdaIntegration = new LambdaIntegration(
  backend.helloFunction.resources.lambda
);

const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(apiStack, 'CognitoAuthorizer', {
  cognitoUserPools: [backend.auth.resources.userPool],
});

// create a new resource path with IAM authorization
const items = myRestApi.root.addResource("items");
items.addMethod("GET", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
  methodResponses: [{
  statusCode: '200',
  responseParameters: {
    'method.response.header.Access-Control-Allow-Origin': true,
    'method.response.header.Access-Control-Allow-Headers': true,
    'method.response.header.Access-Control-Allow-Methods': true,
    },
  }],
});
items.addMethod("POST", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
});
items.addMethod("DELETE", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
});
items.addMethod("PUT", lambdaIntegration, {
  authorizationType: AuthorizationType.COGNITO,
  authorizer: cognitoAuthorizer,
});

// add a proxy resource path to the API
items.addProxy({
  anyMethod: true,
  defaultIntegration: lambdaIntegration,
});


// Add public endpoint (no authentication required)
const publicItems = myRestApi.root.addResource("public");

publicItems.addCorsPreflight({
  allowOrigins: ['*'], // or specify your frontend URL like ['http://localhost:3000']
  allowMethods: ['GET', 'POST', 'OPTIONS'], // Include all methods you're using
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

items.addCorsPreflight({
  allowOrigins: ['*'], // or specify your frontend URL like ['http://localhost:3000']
  allowMethods: ['GET', 'POST', 'OPTIONS'], // Include all methods you're using
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});

publicItems.addMethod("POST", lambdaIntegration, {
  authorizationType: AuthorizationType.NONE, // No auth required
});

publicItems.addMethod("GET", lambdaIntegration, {
    authorizationType: AuthorizationType.NONE,
  methodResponses: [{
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Origin': true,
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
    },
  }],
});

// create a new IAM policy to allow Invoke access to the API
const apiRestPolicy = new Policy(apiStack, "RestApiPolicy", {
  statements: [
    new PolicyStatement({
      actions: ["execute-api:Invoke"],
      resources: [
        `${myRestApi.arnForExecuteApi("*", "/items", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/items/*", "dev")}`,
        `${myRestApi.arnForExecuteApi("*", "/cognito-auth-path", "dev")}`,
      ],
    }),
  ],
});

// attach the policy to the authenticated and unauthenticated IAM roles
backend.auth.resources.authenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);
backend.auth.resources.unauthenticatedUserIamRole.attachInlinePolicy(
  apiRestPolicy
);

// add outputs to the configuration file
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