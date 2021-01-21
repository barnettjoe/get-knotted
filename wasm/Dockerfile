# useful articles which explain similar setups
# https://surma.dev/things/c-to-webassembly/
# https://depth-first.com/articles/2019/10/16/compiling-c-to-webassembly-and-running-it-without-emscripten/

FROM debian:10.7
COPY wasm /builder
WORKDIR /builder
RUN apt-get update && apt-get -y install git python3
RUN git clone --depth 1 --branch 2.0.12 https://github.com/emscripten-core/emsdk.git
RUN ./emsdk/emsdk install 2.0.9
RUN ./emsdk/emsdk activate 2.0.9
RUN /bin/bash -c 'source ./emsdk/emsdk_env.sh'

CMD rm -rf /wasm-output/* && \
  cd emsdk/upstream/emscripten && \
  ./emcc /source/add.c \
  # the .mjs extension makes emscripten output in ESM format, rather than a plain ol' JS script
  -o /wasm-output/add.mjs \
  # The SINGLE_FILE option means we'll emit the wasm embedded as a base64 string within a JS file, along with all the glue JS.
  # This means webpack will just build everything into the bundle - it saves us from having to serve the wasm files separately.
  -s SINGLE_FILE=1 \
  # We want the add function to be accessible from the compiled wasm (everything else might be removed if the compiiler can't see it being used).
  # N.B. the underscore prefix is added by the compiler as part of the calling convention.
  -s EXPORTED_FUNCTIONS='["_add"]' \
  # We want to use the cwrap function in our JS to interface with the wasm
  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
  -s ENVIRONMENT='web' \
  # We don't particularly want the mjs extension
  && mv /wasm-output/add.mjs /wasm-output/add.js
