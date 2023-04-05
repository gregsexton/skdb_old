.PHONY: npm
npm: clean
	tsc --build tsconfig.all.json
	chmod +x packages/skdb/dist/skdb-cli.js

.PHONY: clean
clean:
	rm -rf packages/skdb/dist packages/skdb/tsconfig.tsbuildinfo

.PHONY: publish
publish:
	cd packages/skdb/ && npm publish --access public
