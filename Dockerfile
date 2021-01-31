FROM debian:10.7
COPY wasm /builder
WORKDIR /builder
RUN apt-get update && apt-get -y install git python3 build-essential
RUN git clone --depth 1 --branch 2.0.12 https://github.com/emscripten-core/emsdk.git
RUN ./emsdk/emsdk install 2.0.12
RUN ./emsdk/emsdk activate 2.0.12
RUN /bin/bash -c 'source ./emsdk/emsdk_env.sh'