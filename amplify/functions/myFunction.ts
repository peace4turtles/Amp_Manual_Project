import { Context } from 'aws-lambda';

export const handler = async (event: any, context: Context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Hello from Amplify Gen 2 Lambda!' }),
  };
};
