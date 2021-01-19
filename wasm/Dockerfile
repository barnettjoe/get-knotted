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

# The SINGLE_FLAG option means we'll emit the wasm embedded as a base64 string within a JS file, along with all the glue JS.
# This means webpack will just build everything into the bundle - it saves us from having to serve the wasm files separately.
CMD rm -rf /wasm-output/* && cd emsdk/upstream/emscripten && ./emcc /source/add.c -o /wasm-output/add.mjs -s SINGLE_FILE=1