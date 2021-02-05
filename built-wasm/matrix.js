
var Module = (function() {
  var _scriptDir = import.meta.url;
  
  return (
function(Module) {
  Module = Module || {};

var Module = typeof Module !== "undefined" ? Module : {};

var readyPromiseResolve, readyPromiseReject;

Module["ready"] = new Promise(function(resolve, reject) {
 readyPromiseResolve = resolve;
 readyPromiseReject = reject;
});

var moduleOverrides = {};

var key;

for (key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = function(status, toThrow) {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = true;

var ENVIRONMENT_IS_WORKER = false;

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document !== "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (_scriptDir) {
  scriptDirectory = _scriptDir;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 {
  read_ = function(url) {
   try {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    return xhr.responseText;
   } catch (err) {
    var data = tryParseAsDataURI(url);
    if (data) {
     return intArrayToString(data);
    }
    throw err;
   }
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = function(url) {
    try {
     var xhr = new XMLHttpRequest();
     xhr.open("GET", url, false);
     xhr.responseType = "arraybuffer";
     xhr.send(null);
     return new Uint8Array(xhr.response);
    } catch (err) {
     var data = tryParseAsDataURI(url);
     if (data) {
      return data;
     }
     throw err;
    }
   };
  }
  readAsync = function(url, onload, onerror) {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = function() {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    var data = tryParseAsDataURI(url);
    if (data) {
     onload(data.buffer);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = function(title) {
  document.title = title;
 };
} else {}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

for (key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}

moduleOverrides = null;

if (Module["arguments"]) arguments_ = Module["arguments"];

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

if (Module["quit"]) quit_ = Module["quit"];

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

var noExitRuntime;

if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];

if (typeof WebAssembly !== "object") {
 abort("no native wasm support detected");
}

function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];

 case "i8":
  return HEAP8[ptr >> 0];

 case "i16":
  return HEAP16[ptr >> 1];

 case "i32":
  return HEAP32[ptr >> 2];

 case "i64":
  return HEAP32[ptr >> 2];

 case "float":
  return HEAPF32[ptr >> 2];

 case "double":
  return HEAPF64[ptr >> 3];

 default:
  abort("invalid type for getValue: " + type);
 }
 return null;
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}

function getCFunc(ident) {
 var func = Module["_" + ident];
 assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
 return func;
}

function ccall(ident, returnType, argTypes, args, opts) {
 var toC = {
  "string": function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    var len = (str.length << 2) + 1;
    ret = stackAlloc(len);
    stringToUTF8(str, ret, len);
   }
   return ret;
  },
  "array": function(arr) {
   var ret = stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }
 };
 function convertReturnValue(ret) {
  if (returnType === "string") return UTF8ToString(ret);
  if (returnType === "boolean") return Boolean(ret);
  return ret;
 }
 var func = getCFunc(ident);
 var cArgs = [];
 var stack = 0;
 if (args) {
  for (var i = 0; i < args.length; i++) {
   var converter = toC[argTypes[i]];
   if (converter) {
    if (stack === 0) stack = stackSave();
    cArgs[i] = converter(args[i]);
   } else {
    cArgs[i] = args[i];
   }
  }
 }
 var ret = func.apply(null, cArgs);
 ret = convertReturnValue(ret);
 if (stack !== 0) stackRestore(stack);
 return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
 argTypes = argTypes || [];
 var numericArgs = argTypes.every(function(type) {
  return type === "number";
 });
 var numericRet = returnType !== "string";
 if (numericRet && numericArgs && !opts) {
  return getCFunc(ident);
 }
 return function() {
  return ccall(ident, returnType, argTypes, arguments, opts);
 };
}

var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heap, idx, maxBytesToRead) {
 var endIdx = idx + maxBytesToRead;
 var endPtr = idx;
 while (heap[endPtr] && !(endPtr >= endIdx)) ++endPtr;
 if (endPtr - idx > 16 && heap.subarray && UTF8Decoder) {
  return UTF8Decoder.decode(heap.subarray(idx, endPtr));
 } else {
  var str = "";
  while (idx < endPtr) {
   var u0 = heap[idx++];
   if (!(u0 & 128)) {
    str += String.fromCharCode(u0);
    continue;
   }
   var u1 = heap[idx++] & 63;
   if ((u0 & 224) == 192) {
    str += String.fromCharCode((u0 & 31) << 6 | u1);
    continue;
   }
   var u2 = heap[idx++] & 63;
   if ((u0 & 240) == 224) {
    u0 = (u0 & 15) << 12 | u1 << 6 | u2;
   } else {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heap[idx++] & 63;
   }
   if (u0 < 65536) {
    str += String.fromCharCode(u0);
   } else {
    var ch = u0 - 65536;
    str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
   }
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function writeArrayToMemory(array, buffer) {
 HEAP8.set(array, buffer);
}

var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

var wasmTable;

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

var runtimeExited = false;

__ATINIT__.push({
 func: function() {
  ___wasm_call_ctors();
 }
});

function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
 runtimeExited = true;
}

function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}

function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
}

function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}

Module["preloadedImages"] = {};

Module["preloadedAudios"] = {};

function abort(what) {
 if (Module["onAbort"]) {
  Module["onAbort"](what);
 }
 what += "";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 what = "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
 var e = new WebAssembly.RuntimeError(what);
 readyPromiseReject(e);
 throw e;
}

function hasPrefix(str, prefix) {
 return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix) === 0;
}

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return hasPrefix(filename, dataURIPrefix);
}

var wasmBinaryFile = "data:application/octet-stream;base64,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";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  var binary = tryParseAsDataURI(file);
  if (binary) {
   return binary;
  }
  if (readBinary) {
   return readBinary(file);
  } else {
   throw "both async and sync fetching of the wasm failed";
  }
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch === "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(wasmBinaryFile);
   });
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(wasmBinaryFile);
 });
}

function createWasm() {
 var info = {
  "a": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  wasmMemory = Module["asm"]["f"];
  updateGlobalBufferAndViews(wasmMemory.buffer);
  wasmTable = Module["asm"]["g"];
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 function receiveInstantiatedSource(output) {
  receiveInstance(output["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiatedSource, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     return instantiateArrayBuffer(receiveInstantiatedSource);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiatedSource);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync().catch(readyPromiseReject);
 return {};
}

var tempDouble;

var tempI64;

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback(Module);
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    wasmTable.get(func)();
   } else {
    wasmTable.get(func)(callback.arg);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("OOM");
}

function _emscripten_resize_heap(requestedSize) {
 requestedSize = requestedSize >>> 0;
 abortOnCannotGrowMemory(requestedSize);
}

function _exit(status) {
 exit(status);
}

var SYSCALLS = {
 mappings: {},
 buffers: [ null, [], [] ],
 printChar: function(stream, curr) {
  var buffer = SYSCALLS.buffers[stream];
  if (curr === 0 || curr === 10) {
   (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
   buffer.length = 0;
  } else {
   buffer.push(curr);
  }
 },
 varargs: undefined,
 get: function() {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 },
 get64: function(low, high) {
  return low;
 }
};

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = HEAP32[iov + i * 8 >> 2];
  var len = HEAP32[iov + (i * 8 + 4) >> 2];
  for (var j = 0; j < len; j++) {
   SYSCALLS.printChar(fd, HEAPU8[ptr + j]);
  }
  num += len;
 }
 HEAP32[pnum >> 2] = num;
 return 0;
}

function _pthread_create() {
 return 6;
}

var ASSERTIONS = false;

function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   if (ASSERTIONS) {
    assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   }
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}

var decodeBase64 = typeof atob === "function" ? atob : function(input) {
 var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var output = "";
 var chr1, chr2, chr3;
 var enc1, enc2, enc3, enc4;
 var i = 0;
 input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 do {
  enc1 = keyStr.indexOf(input.charAt(i++));
  enc2 = keyStr.indexOf(input.charAt(i++));
  enc3 = keyStr.indexOf(input.charAt(i++));
  enc4 = keyStr.indexOf(input.charAt(i++));
  chr1 = enc1 << 2 | enc2 >> 4;
  chr2 = (enc2 & 15) << 4 | enc3 >> 2;
  chr3 = (enc3 & 3) << 6 | enc4;
  output = output + String.fromCharCode(chr1);
  if (enc3 !== 64) {
   output = output + String.fromCharCode(chr2);
  }
  if (enc4 !== 64) {
   output = output + String.fromCharCode(chr3);
  }
 } while (i < input.length);
 return output;
};

function intArrayFromBase64(s) {
 try {
  var decoded = decodeBase64(s);
  var bytes = new Uint8Array(decoded.length);
  for (var i = 0; i < decoded.length; ++i) {
   bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
 } catch (_) {
  throw new Error("Converting base64 string to bytes failed.");
 }
}

function tryParseAsDataURI(filename) {
 if (!isDataURI(filename)) {
  return;
 }
 return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}

var asmLibraryArg = {
 "e": _emscripten_memcpy_big,
 "d": _emscripten_resize_heap,
 "a": _exit,
 "b": _fd_write,
 "c": _pthread_create
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
 return (___wasm_call_ctors = Module["___wasm_call_ctors"] = Module["asm"]["h"]).apply(null, arguments);
};

var _malloc = Module["_malloc"] = function() {
 return (_malloc = Module["_malloc"] = Module["asm"]["i"]).apply(null, arguments);
};

var _LUP_decomposition = Module["_LUP_decomposition"] = function() {
 return (_LUP_decomposition = Module["_LUP_decomposition"] = Module["asm"]["j"]).apply(null, arguments);
};

var _solve = Module["_solve"] = function() {
 return (_solve = Module["_solve"] = Module["asm"]["k"]).apply(null, arguments);
};

var _free = Module["_free"] = function() {
 return (_free = Module["_free"] = Module["asm"]["l"]).apply(null, arguments);
};

var stackSave = Module["stackSave"] = function() {
 return (stackSave = Module["stackSave"] = Module["asm"]["m"]).apply(null, arguments);
};

var stackRestore = Module["stackRestore"] = function() {
 return (stackRestore = Module["stackRestore"] = Module["asm"]["n"]).apply(null, arguments);
};

var stackAlloc = Module["stackAlloc"] = function() {
 return (stackAlloc = Module["stackAlloc"] = Module["asm"]["o"]).apply(null, arguments);
};

Module["cwrap"] = cwrap;

Module["setValue"] = setValue;

Module["getValue"] = getValue;

var calledRun;

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function run(args) {
 args = args || arguments_;
 if (runDependencies > 0) {
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 function doRun() {
  if (calledRun) return;
  calledRun = true;
  Module["calledRun"] = true;
  if (ABORT) return;
  initRuntime();
  preMain();
  readyPromiseResolve(Module);
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout(function() {
   setTimeout(function() {
    Module["setStatus"]("");
   }, 1);
   doRun();
  }, 1);
 } else {
  doRun();
 }
}

Module["run"] = run;

function exit(status, implicit) {
 if (implicit && noExitRuntime && status === 0) {
  return;
 }
 if (noExitRuntime) {} else {
  EXITSTATUS = status;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
  ABORT = true;
 }
 quit_(status, new ExitStatus(status));
}

if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}

noExitRuntime = true;

run();


  return Module.ready
}
);
})();
export default Module;