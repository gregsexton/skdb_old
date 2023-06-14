.PHONY: npm
npm: clean
	yarn tsc --build tsconfig.all.json
	./inlineWasm.sh
	chmod +x packages/skdb/dist/skdb-cli.js
	cp packages/skdb/skdb.wasm packages/skdb/dist/skdb.wasm

.PHONY: clean
clean:
	rm -rf packages/skdb/dist packages/skdb/tsconfig.tsbuildinfo

.PHONY: publish
publish:
	cd packages/skdb/ && npm publish --access public
