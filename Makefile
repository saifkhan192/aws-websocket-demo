build:
	sam build --skip-pull-image

build_and_deploy:
	make build
	sam deploy --config-env dev

run_app:
	python3 -m http.server 8000 --bind localhost

run_wscat:
	wscat -c wss://<apiId>.execute-api.us-east-1.amazonaws.com/Prod
	# {"message":"sendmessage", "data":"hello world"}