# useful articles which explain this setup
# https://surma.dev/things/c-to-webassembly/
# https://depth-first.com/articles/2019/10/16/compiling-c-to-webassembly-and-running-it-without-emscripten/

FROM debian:10.7
COPY wasm /source
WORKDIR /source
RUN apt-get update && apt-get -y install git make wget gnupg software-properties-common

# install llvm & clang
RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
RUN add-apt-repository "deb http://apt.llvm.org/buster/ llvm-toolchain-buster-11 main"
RUN apt-get update
RUN apt-get -y install clang-11 lldb-11 lld-11 clangd-11

# By default the names for the commands have the version appended e.g. clang-11
# To fix this make some symlinks without the version appended.
RUN ln -s /usr/bin/clang-11 /usr/bin/clang && ln -s /usr/bin/wasm-ld-11 /usr/bin/wasm-ld

# We use WASI to include libc. Clone the repo, then build with make, which creates a "sysroot" directory.
RUN git clone https://github.com/CraneStation/wasi-libc.git
RUN cd ./wasi-libc && make WASM_CC=$(which clang) WASM_AR=$(which llvm-ar-11) WASM_NM=$(which llvm-nm-11)

# This is a bit weird and annoying but apparently WASI is missing this one file.
# I have copied it from https://github.com/jedisct1/libclang_rt.builtins-wasm32.a
RUN target_dir=/usr/lib/llvm-11/lib/clang/11.1.0/lib/wasi && mkdir -p $target_dir && cp libclang_rt.builtins-wasm32.a $target_dir/libclang_rt.builtins-wasm32.a

# LLVM supports the wasm/wasi compile target, allowing us to compile C source files directly to wasm, provided that the environment
# supplies libc. We tell clang to look in the sysroot directory which we made above, when looking for libc.
RUN clang --target=wasm32-unknown-wasi --sysroot ./wasi-libc/sysroot -O2 -s -o add.wasm add.c
RUN cat add.wasm
