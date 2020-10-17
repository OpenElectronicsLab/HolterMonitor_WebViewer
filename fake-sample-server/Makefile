
SOURCES=src/echo-server.js  src/echo-server-test.js

NODEJS=node

default: check

node_modules/ws/lib/websocket-server.js:
	npm install

check: $(SOURCES) node_modules/ws/lib/websocket-server.js
	$(NODEJS) --version
	$(NODEJS) src/echo-server-test.js

update:
	npm update

tidy:
	js-beautify -r --end-with-newline src/echo-server.js
	js-beautify -r --end-with-newline src/echo-server-test.js
	js-beautify -r --end-with-newline src/launch-echo-server.js
	js-beautify -r --end-with-newline src/sine-wave-generator.js
	js-beautify -r --end-with-newline src/static/index.js
