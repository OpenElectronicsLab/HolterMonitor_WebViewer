
SOURCES=src/echo-server.js  src/echo-server-test.js

check: $(SOURCES)
	nodejs src/echo-server-test.js

tidy:
	js-beautify -r --end-with-newline src/echo-server.js
	js-beautify -r --end-with-newline src/echo-server-test.js


