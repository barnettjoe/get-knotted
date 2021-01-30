- [ ] improve setup of testing and compiling environments
- [ ] research which compiler flags I should be using for strictest/most helpful errors...
- [ ] write tests in jest for matrix lib in c?
- [ ] take stock of types.ts...there is probably a load of old crap and duplicated stuff in there...especially check optional properties etc...
- [ ] fully switch to model/primitives/drawloop
- [ ] draw beziers with width (offset on the gpu?!)
- [ ] add color buffers to allow color drawing...
- [ ] tidy up webgl code
- [ ] fix debug tools
- [ ] analyze webpack bundle size

performance ideas:

- do LU-decomp in wasm - https://becominghuman.ai/passing-and-returning-webassembly-array-parameters-a0f572c65d97
- move more onto the gpu
- split large strands before constructing matrix/doing LU decomposition?
- use pthreads?
