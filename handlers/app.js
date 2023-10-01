let { ddb, TABLE_NAME, sendMessage, logIt, sendToSocket } = require('./utills')

exports.connectHandler = async event => {
  let { requestContext } = event;
  let queryStringParameters = event.queryStringParameters || {};
  let username = queryStringParameters.name;
  let log = {
    routeKey: requestContext.routeKey,
    eventType: requestContext?.eventType,
    connectionId: requestContext.connectionId,
  }
  logIt("connectHandler", JSON.stringify(log));
  const putParams = {
    TableName: TABLE_NAME,
    Item: {
      connectionId: event.requestContext.connectionId,
      username,
      latitude: 0.0,
      longitude: 0.0,
    }
  };

  try {
    await ddb.put(putParams).promise();
    // logIt("putParams", JSON.stringify(putParams));
  } catch (err) {
    console.log("err", err);
    return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
  }

  return { statusCode: 200, body: 'Connected.' };
};

exports.disconnectHandler = async event => {
  console.log("disconnectHandler", event)

  const deleteParams = {
    TableName: TABLE_NAME,
    Key: {
      connectionId: event.requestContext.connectionId
    }
  };
  // console.log("deleteParams", deleteParams)

  try {
    await ddb.delete(deleteParams).promise();
  } catch (err) {
    return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
  }

  return { statusCode: 200, body: 'Disconnected.' };
};


// routeKey "$default/sendmessage" will trigger this lambda
exports.onMessageHandler = async event => {
  // logIt('event:', event);
  let { requestContext } = event;
  if (event.custom) {
    return await sendMessage(event.custom);
  }
  let body = JSON.parse(event?.body);
  let data = body.data;
  // logIt('data:', JSON.stringify(data));
  let log = {
    routeKey: requestContext.routeKey,
    eventType: requestContext.eventType,
    connectionId: requestContext.connectionId,
    body,
  }
  logIt("onMessage", JSON.stringify(log));

  if (body.action == "updateLocation") {
    let params = {
      TableName: TABLE_NAME,
      Key: {
        connectionId: requestContext.connectionId,
      },
      AttributeUpdates: {
        "latitude": {
          "Value": data?.location?.lat
        },
        "longitude": {
          "Value": data?.location?.long
        }
      },
    };
    await ddb.update(params).promise();
    // logIt('params', JSON.stringify(params));
    let payload = { "message": "locationUpdated", "data": { newLocation: data.location, id: requestContext.connectionId } };
    await sendToSocket(requestContext.connectionId, payload);
    return { statusCode: 200, body: 'location updated.' };
  }

  if (body.action == "getUsers") {
    let connections = (await ddb.scan({ TableName: TABLE_NAME }).promise()).Items;
    let payload = { "message": "getUsersResolved", "data": { connections } };
    await sendToSocket(requestContext.connectionId, payload);
    return { statusCode: 200, body: 'getUsers done.' };
  }

  if (body.action == "sendToAll") {
    let payload = { "message": "toAll", "data": data };
    await sendMessage({ body: payload });
    return { statusCode: 200, body: 'sendToAll done.' };
  }

  let payload = { "message": "sendmessage", "data": { server: data } };
  await sendToSocket(requestContext.connectionId, payload);
  return { statusCode: 200, body: 'success' };
};
