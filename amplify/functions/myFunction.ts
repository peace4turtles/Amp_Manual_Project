import { DynamoDBClient, PutItemCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Context } from 'aws-lambda';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const dynamoClient = new DynamoDBClient({});

// Function to find the actual table name
async function findTableName(prefix: string): Promise<string> {
  const listTablesCommand = new ListTablesCommand({});
  const result = await dynamoClient.send(listTablesCommand);
  
  const matchingTable = result.TableNames?.find(tableName => 
    tableName.startsWith(prefix)
  );
  
  if (!matchingTable) {
    throw new Error(`No table found with prefix: ${prefix}`);
  }
  
  return matchingTable;
}

export const handler = async (event: any, context: Context) => {
  try {
    // Find the actual table name dynamically
    const TABLE_NAME = await findTableName(process.env.TABLE_NAME!);
    console.log(`Using table: ${TABLE_NAME}`);
        
    const params1 = {
    TableName: TABLE_NAME,
    Item: {
        id: { S: "1" },
        name: { S: "Ice cream" },
        cost: { N: "1.00" }
    }
    };

    const params2 = {
    TableName: TABLE_NAME,
    Item: {
        id: { S: "2" },
        name: { S: "Turkey Sandwich" },
        cost: { N: "5.99" }
    }
    };

    const params3 = {
    TableName: TABLE_NAME,
    Item: {
        id: { S: "3" },
        name: { S: "Ham and Cheese" },
        cost: { N: "4.50" }
    }
    };

    await client.send(new PutItemCommand(params1));
    await client.send(new PutItemCommand(params2));
    await client.send(new PutItemCommand(params3));
    console.log("Dummy data inserted");

    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    console.log('Scan result:', result.Items);

    return {
      statusCode: 200,
      headers: {
      'Access-Control-Allow-Origin': '*', // or 'http://localhost:3000'
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Requested-With',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Content-Type': 'application/json'
      },
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