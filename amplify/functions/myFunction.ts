import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Context } from 'aws-lambda';

// Replace with your actual table name (see below)
const TABLE_NAME = process.env.SANDWICH_TABLE_NAME!;

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any, context: Context) => {
  try {
    const params = {
    TableName: "Sandwich",
    Item: {
      id: { S: "1" },
      name: { S: "Ice cream" },
      cost: { N: "1.00" }
        }
    };

    await client.send(new PutItemCommand(params));
    console.log("Dummy data inserted");

    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    console.log('Scan result:', result.Items);

    return {
      statusCode: 200,
      body: JSON.stringify({ sandwiches: result.Items }),
    };
  } catch (error) {
    console.error('Error scanning table:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch sandwiches' }),
    };
  }
};