
SOURCES=src/echo-server.js  src/echo-server-test.js

NODEJS=node

check: $(SOURCES)
	$(NODEJS) --version
	$(NODEJS) src/echo-server-test.js

update:
	npm update

tidy:
	js-beautify -r --end-with-newline src/echo-server.js
	js-beautify -r --end-with-newline src/echo-server-test.js


