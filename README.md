# simple-websockets-chat-app

Simple web chat using aws websocket
```
├── handlers
│   ├── app.js
│   ├── package.json
│   └── utills.js
├── index.html
├── Makefile
├── README.md
├── samconfig.toml
└── template.yaml
```

## Tools

* AWS SAM CLI / AWS SDK for JavaScript
* AWS S3
* AWS API Gateway
* AWS Lambda
* AWS DynamoDB
* AWS CloudWatch Logs

## Deploying to your account
```
make build_and_deploy
```

## Run html app
```
make run_app
```

## Testing APIs

To test the WebSocket API, you can use [wscat](https://github.com/websockets/wscat), an open-source command line tool.

``` bash
$ npm install -g wscat
```
3. On the console, connect to your published API endpoint by executing the following command:
``` bash
$ wscat -c wss://{YOUR-API-ID}.execute-api.{YOUR-REGION}.amazonaws.com/{STAGE}
```
4. To test the sendmessage: 
``` bash
$ wscat -c wss://{YOUR-API-ID}.execute-api.{YOUR-REGION}.amazonaws.com/prod
connected (press CTRL+C to quit)
> {"action":"sendmessage", "data":"hello world"}
< hello world
```
