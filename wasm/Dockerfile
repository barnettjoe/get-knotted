# useful articles which explain similar setups
# https://surma.dev/things/c-to-webassembly/
# https://depth-first.com/articles/2019/10/16/compiling-c-to-webassembly-and-running-it-without-emscripten/

FROM debian:10.7
COPY wasm /builder
COPY src/c /source
WORKDIR /builder
RUN apt-get update && apt-get -y install git python3
RUN git clone https://github.com/emscripten-core/emsdk.git
RUN cd emsdk && git pull
RUN ./emsdk/emsdk install 2.0.9
RUN ./emsdk/emsdk activate 2.0.9
RUN /bin/bash -c 'source ./emsdk/emsdk_env.sh'
CMD rm -rf /wasm-output/* && cd emsdk/upstream/emscripten && ./emcc /source/add.c -o /wasm-output/add.html