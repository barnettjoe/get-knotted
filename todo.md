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

the ridiculous state of the javascript module system

The bezier.js package.json has a `main` field pointing to the commonjs version of the library, and an `exports` field pointing to the ESM bezier-js source code. Ideally, I would like to use the ESM version. Whichever way I get it working, I need to satisfy both webpack (so my code actually builds correctly), and typescript (for typechecking & intellisense). Webpack 5 uses the exports field, so builds from ESM. But typescript doesn't yet support the exports field. It only looks at `main`. I could point TS to the ESM source code, but this would be pointless since the actual type declarations (from definitely-typed) are for the commonjs version. I could just set up a webpack alias to force it to use the commonjs version, because webpack supports bundling of commonjs modules, right? Well yes, it does...but not if the package.json includes `"type": "module"`, which unfortunately the bezierjs one does. So when we try to bundle the commonjs doesn't get correctly transformed and we see a runtime error: `exports is not defined`...

so can't I just use commonjs as far as TS is concerned and ESM as far as webpack is concerned...? That should just work...right 🥺...?
Nope. It doesn't...because the commonjs and ESM versions don't have the same structure. The commonjs module (or rather the declaration files in @types/bezier-js, since that's all we care about from the TS side of things) has a "default" type export (i.e. it reassigns the exports object to the Bezier constructor). Whereas in the actual ESM code we'll be bundling, the Bezier constructor is exported as a named export, and there is no default export.

Soon typescript should support the `exports` package.json field and this whole saga will be over. https://github.com/microsoft/TypeScript/issues/33079
Well, not quite over because actually the types will need updating. Maybe I'll submit a PR to definitely-typed at that point. In the meantime, I will make a copy of the commonjs version (without the pesky package.json with `type: module`), and just point webpack to that via an alias, and point typescript to it via `paths`

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
