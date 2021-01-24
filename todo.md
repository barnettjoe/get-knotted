- [ ] set up environment for testing c code without wasm
- [ ] set up language server/formatting, linting? for writing c
- [ ] take stock of types.ts...there is probably a load of old crap and duplicated stuff in there...especially check optional properties etc...
- [ ] fully switch to model/primitives/drawloop
- [ ] draw beziers with width (offset on the gpu?!)
- [ ] add color buffers to allow color drawing...
- [ ] tidy up webgl code
- [ ] fix debug tools
- [ ] why are there 2 eslint config files?
- [ ] analyze webpack bundle size

performance ideas:

- do LU-decomp in wasm - https://becominghuman.ai/passing-and-returning-webassembly-array-parameters-a0f572c65d97
- move more onto the gpu
- split large strands before constructing matrix/doing LU decomposition?
- use pthreads?
