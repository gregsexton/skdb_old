const util = require('util');
const fs = require('fs');
var source = fs.readFileSync('./out32.wasm');

var instance = null;
var args = [];
var SKIP_call0 = null;
var current_stdin = 0;
var stdin = '';
var stdout = new Array();
var skipMain = null;
var fileDescrs = new Array();
var fileDescrNbr = 2;
var files = new Array();
var changed_files = new Array();

function encodeUTF8(s) {
  var data = new Uint8Array(instance.exports.memory.buffer);
	var i = 0, addr = instance.exports.SKIP_Obstack_alloc(s.length * 4);
	for (var ci = 0; ci != s.length; ci++) {
		var c = s.charCodeAt(ci);
		if (c < 128) {
			data[addr + i++] = c;
			continue;
		}
		if (c < 2048) {
			data[addr + i++] = c >> 6 | 192;
		} else {
			if (c > 0xd7ff && c < 0xdc00) {
				if (++ci >= s.length)
					throw new Error('UTF-8 encode: incomplete surrogate pair');
				var c2 = s.charCodeAt(ci);
				if (c2 < 0xdc00 || c2 > 0xdfff)
					throw new Error('UTF-8 encode: second surrogate character 0x' + c2.toString(16) + ' at index ' + ci + ' out of range');
				c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
				data[addr + i++] = c >> 18 | 240;
				data[addr + i++] = c >> 12 & 63 | 128;
			} else data[addr + i++] = c >> 12 | 224;
			data[addr + i++] = c >> 6 & 63 | 128;
		}
		data[addr + i++] = c & 63 | 128;
	}
	return instance.exports.sk_string_create(addr, i);
}


function decodeUTF8(bytes) {
	var i = 0, s = '';
	while (i < bytes.length) {
		var c = bytes[i++];
		if (c > 127) {
			if (c > 191 && c < 224) {
				if (i >= bytes.length)
					throw new Error('UTF-8 decode: incomplete 2-byte sequence');
				c = (c & 31) << 6 | bytes[i++] & 63;
			} else if (c > 223 && c < 240) {
				if (i + 1 >= bytes.length)
					throw new Error('UTF-8 decode: incomplete 3-byte sequence');
				c = (c & 15) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
			} else if (c > 239 && c < 248) {
				if (i + 2 >= bytes.length)
					throw new Error('UTF-8 decode: incomplete 4-byte sequence');
				c = (c & 7) << 18 | (bytes[i++] & 63) << 12 | (bytes[i++] & 63) << 6 | bytes[i++] & 63;
			} else throw new Error('UTF-8 decode: unknown multibyte start 0x' + c.toString(16) + ' at index ' + (i - 1));
		}
		if (c <= 0xffff) s += String.fromCharCode(c);
		else if (c <= 0x10ffff) {
			c -= 0x10000;
			s += String.fromCharCode(c >> 10 | 0xd800)
			s += String.fromCharCode(c & 0x3FF | 0xdc00)
		} else throw new Error('UTF-8 decode: code point 0x' + c.toString(16) + ' exceeds UTF-16 reach');
	}
	return s;
}

function wasmStringToJS(wasmPointer) {
  var data32 = new Uint32Array(instance.exports.memory.buffer);
  var size = instance.exports['SKIP_String_byteSize'](wasmPointer);
  var data = new Uint8Array(instance.exports.memory.buffer);

  return decodeUTF8(data.slice(wasmPointer, wasmPointer + size));
}

const env = {
  memoryBase: 0,
  tableBase: 0,
  memory: new WebAssembly.Memory({initial: 256}),
  table: new WebAssembly.Table({initial: 0, element: 'anyfunc'}),
  abort: function(err) {
    throw new Error('abort ' + err);
  },
  abortOnCannotGrowMemory: function(err) {
    throw new Error('abortOnCannotGrowMemory ' + err);
  },
  __cxa_throw: function(ptr, type, destructor) {
    throw ptr;
  },
  SKIP_etry: function(f, exn_handler) {
    try {
      return SKIP_call0(f);
    } catch(_) {
      return SKIP_call0(exn_handler);
    }
  },
  __setErrNo: function(err) {
    throw new Error('ErrNo ' + err);
  },
  SKIP_print_char: function(c) {
    throw new Error('SKIP_print_char not implemented');
  },
  printf: function(ptr) {
  },
  SKIP_print_error: function(str) {
    process.stderr.write(wasmStringToJS(str));
  },
  SKIP_read_line_fill: function() {
    throw new Error('SKIP_read_line_fill not implemented');
  },
  SKIP_read_line_get:function(i) {
    throw new Error('SKIP_read_line_get not implemented');
  },
  SKIP_getchar: function(i) {
    if(current_stdin >= stdin.length) {
      SKIP_throw_EndOfFile();
    }
    var result = stdin.charCodeAt(current_stdin);
    current_stdin++;
    return result;
  },
  SKIP_print_raw: function(str) {
    stdout.push(wasmStringToJS(str));
  },
  SKIP_getArgc: function(i) {
    return args.length;
  },
  SKIP_getArgN: function(n) {
    return encodeUTF8(args[n]);
  },
  SKIP_unix_open: function(wasmFilename) {
    var filename = wasmStringToJS(wasmFilename);
    if(fileDescrs[filename] !== undefined) {
      return fileDescrs[filename];
    }
    var fd = fileDescrNbr;
    files[fd] = new Array();
    fileDescrs[filename] = fd;
    fileDescrNbr++;
    return fd;
  },
  SKIP_write_to_file: function(fd, str) {
    files[fd].push(wasmStringToJS(str));
    changed_files[fd] = true;
  },
  SKIP_glock: function(){},
  SKIP_gunlock: function(){}
}


var typedArray = new Uint8Array(source);

function skdb(new_args, new_stdin) {
  args = new_args;
  stdin = new_stdin;
  stdout = new Array();
  current_stdin = 0;
  skipMain();
  return stdout.join('');
}

WebAssembly.instantiate(typedArray, {
  env: env
}).then(result => {
  SKIP_call0 = result.instance.exports['SKIP_call0'];
  instance = result.instance;
  result.instance.exports.SKIP_skfs_init();
  result.instance.exports.SKIP_initializeSkip();
  result.instance.exports.SKIP_skfs_end_of_init();
  skipMain = result.instance.exports.skip_main;
  skdb([], 'create table t1 (a INTEGER, b INTEGER);');
  skdb([], 'insert into t1 values (23, 45);');
  process.stdout.write(skdb([], 'select * from t1;'));
  skdb([], 'create virtual view v1 as select * from t1;');
  process.stdout.write(skdb(['--connect', 'v1', '--updates', '/tmp/file1'], []));
  skdb([], 'insert into t1 values (24, 45);');
  console.log(changed_files);
}).catch(e => {
  // error caught
  console.log(e);
});
