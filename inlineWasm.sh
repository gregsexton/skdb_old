#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd "$SCRIPT_DIR" || exit 1

SOURCE=packages/skdb/dist/skdb-wasm-b64.js
WASM=packages/skdb/skdb.wasm
TMP=$(mktemp /tmp/SRC.XXXXXX)

if [[ "$OSTYPE" == "darwin"* ]]; then
    b64cmd="base64 -i"
else
    b64cmd="base64 -w0"
fi

(echo -n "const wasmBase64 = \`"
 $b64cmd $WASM
 echo "\`;"
 sed "s/const wasmBase64.*;//" $SOURCE) > "$TMP"

mv "$TMP" $SOURCE
