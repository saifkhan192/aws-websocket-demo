const AWS = require('aws-sdk');
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region: AWS_REGION });

const TABLE_NAME = process.env.TABLE_NAME;
const ddb = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

let endpoint = "<apiId>.execute-api.us-east-1.amazonaws.com/Prod";
const client = new AWS.ApiGatewayManagementApi({
  apiVersion: '2018-11-29',
  endpoint
});

exports.ddb = ddb;
exports.TABLE_NAME = TABLE_NAME;


const { Console } = require("console");
let logIt = new Console({ stdout: process.stdout, stderr: process.stderr }).log;


const sendToSocket = async (connectionId, postData, username = '-') => {
  if (typeof postData === "object") {
    postData = JSON.stringify(postData);
  }

  let params = { ConnectionId: connectionId, Data: postData };

  try {
    await client.postToConnection(params).promise();
    logIt(`sendToSocket:${username}`, JSON.stringify(postData));
    return "success";
  } catch (e) {
    if (e.statusCode === 410) {
      logIt("Failed:410:", JSON.stringify(params));
      // console.log(`Found stale connection, deleting ${connectionId}`);
      // await ddb.delete({ TableName: TABLE_NAME, Key: { connectionId } }).promise();
    } else {
      logIt("Failed:", JSON.stringify(params));
    }
    return e.message;
  }
};


exports.sendMessage = async (event) => {
  let log = {
    routeKey: event?.requestContext?.routeKey,
    eventType: event?.requestContext?.eventType,
    connectionId: event?.requestContext?.connectionId,
    body: event?.body,
  }
  // logIt("sendMessage:log", JSON.stringify(log));
  let connectionData = { Items: [] };
  if (event.connectionIds) {
    connectionData.Items = event.connectionIds.map(connectionId => {
      return {
        connectionId,
        username: "inline"
      }
    });
    event.body = JSON.stringify(event.body);
  } else {
    connectionData = await ddb.scan({ TableName: TABLE_NAME, ProjectionExpression: 'connectionId,username' }).promise();
  }
  logIt("connectionData.Items", JSON.stringify(connectionData.Items));

  let postData = event.body;
  if (typeof postData === "object") {
    postData = JSON.stringify(postData);
  }

  let resp = await Promise.allSettled(
    connectionData.Items.map(async ({ connectionId, username }) => {
      return sendToSocket(connectionId, postData, username);
    }));

  logIt("success:Promise.all", resp);

  return { statusCode: 200, body: 'Data sent.' };
};


exports.logIt = logIt;
exports.sendToSocket = sendToSocket;
