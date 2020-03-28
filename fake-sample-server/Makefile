
SOURCES=echo-server.js  echo-server-test.js

check: $(SOURCES)
	nodejs echo-server-test.js

tidy:
	js-beautify -r --end-with-newline echo-server.js
	js-beautify -r --end-with-newline echo-server-test.js


