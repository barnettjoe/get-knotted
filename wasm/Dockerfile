FROM debian:10.7
COPY wasm /source
WORKDIR /source
RUN apt-get update
RUN apt-get -y install git make wget gnupg software-properties-common
RUN wget -O - https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
RUN add-apt-repository "deb http://apt.llvm.org/buster/ llvm-toolchain-buster-11 main"
RUN apt-get update
RUN apt-get -y install clang-11 lldb-11 lld-11 clangd-11
RUN ln -s /usr/bin/clang-11 /usr/bin/clang
RUN ln -s /usr/bin/wasm-ld-11 /usr/bin/wasm-ld
RUN git clone https://github.com/CraneStation/wasi-libc.git
RUN cd ./wasi-libc && make WASM_CC=$(which clang) WASM_AR=$(which llvm-ar-11) WASM_NM=$(which llvm-nm-11)
RUN target_dir=/usr/lib/llvm-11/lib/clang/11.1.0/lib/wasi && mkdir -p $target_dir && cp libclang_rt.builtins-wasm32.a $target_dir/libclang_rt.builtins-wasm32.a
RUN clang --target=wasm32-unknown-wasi --sysroot ./wasi-libc/sysroot -O2 -s -o add.wasm add.c
RUN cat add.wasm
