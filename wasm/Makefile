
default: build/skdb_node.js

build/skdb_node.js: src/node_header.js build/skdb.js
	mkdir -p build && cp out32.wasm build
	cat src/node_header.js build/skdb.js > $@

build/skdb.js: src/skdb.ts
	mkdir -p build && cp out32.wasm build
	tsc --build tsconfig.json --pretty false

clean:
	rm -Rf build
