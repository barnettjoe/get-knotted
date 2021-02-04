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

algorithm-level performance ideas:

- forget about offsetting etc for now, draw the original middle-beziers and focus on optimizing the matrix calculations
- move more of contour.ts into wasm to avoid perf cost of copying data onto the wasm heap
- can we use cholesky decomposition instead? should be faster. If not possible with current set of
  constraints, maybe we need different set of constraints for building the matrix (and maybe
  drop C2 continuity at pointed-returns?). Or create more of a linear-programming type problem
  with an objective function etc?
- split large strands before constructing matrix/doing LU decomposition? e.g. by identifying straight-line
  areas to use for split-points?
- efficient updating of LU decomposition when points are moved? there seems to be a lot of literature on this
- use multi-threading with a thread per strand
- move more bezier stuff onto the gpu
