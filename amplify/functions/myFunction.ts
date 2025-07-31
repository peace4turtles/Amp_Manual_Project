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
    const TABLE_NAME = await findTableName("Sandwich");
    console.log(`Using table: ${TABLE_NAME}`);
    
    const params = {
    TableName: TABLE_NAME,
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