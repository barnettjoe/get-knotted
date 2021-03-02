# TODO

- it feels a bit like we have two models at the moment...there is the drawing, which makes changes to the model...
  and then there is the actual model. We should clarify the roles of each of these. Maybe we should turn the drawing
  into the actual model.
- The first step might be to make the frame a property of the drawing instead of having it on the model.
- Then, turn the frame into a computed property - this should allow us to remove some of the reactions from the drawing
- [ ] GRADUALLY introduce mobx and remove explicit "updating" code between interaction and drawing
- [ ] then repeat for drawing <--> frame connection?
- [ ] reorganize model, frame, strand, knot, drawing, interaction etc into a shape that would make sense with mobx
- [ ] fix the offset button
- [ ] build a test harness for measuring performance of different contouring algorithms

The navbar offset option is currently broken. The fundamental problem is that the data pipeline is not being set to dirty in the right places.
Currently, we only have a concept of setting the drawing to dirty. But this is just the final stage of our pipeline.

But we need to think about the overall data transformation pipeline:

- user interactions
- frame
- strand
- contour
- (offset) knot
- drawing primitives
- rendered pixels

We should have a consistent concept of being able to set any stage of the pipeline as "dirty", and needing re-running. We could try and provide a nice consistent API for this. There would be a waterfall effect whereby any stage being set to dirty would, cause it to change its state, thus setting the next stage to dirty etc etc.

so what happened was...I realized the state was not updating in the right places when toggling this option - and I realized it would be fairly easy at that point to wire it up to work...but there would likely be other places cropping up where I would have the same problem...so I dug down...really tried to investigate what would be a better way of organizing it - reallyrealized that my program was best thought of as a kind of data pipeline - you can sort of see all programs this way. and...at this point I had never really worked with reactive programming before but I sort of ended up reinventing some ideas from reactive programming myself - and I went to some effort to implement them myself (talk about topx here) -- and then eventually went and figured out the proper names for these things and which libraries implemented them - I was really happy to find out that a lot of what I wanted was implemented in mobx - and it also does a lot which I hadn't implemented - the kind of magic way mobx rewires your dependency graph at runtime...it's pretty cool. talk about reactive programming and topological sort, the "glitch" problem here...at the end of the day I wanted to get on with my project - and I thought it was better not to reinvent the wheel so I am just using mobx.

- [ ] create test harness for playing with different options/contour algorithms
- [ ] setup issues in github
- [ ] create performance test-suite with dashboard to show results
- [ ] try "splitting" idea for contouring performance
- [ ] tidy up data-oriented stuff
- [ ] do some research on lu-decomposition - is there a better algo?
- [ ] research which compiler flags I should be using for strictest/most helpful errors...
- [ ] take stock of types.ts...there is probably a load of old crap and duplicated stuff in there...especially check optional properties etc...
- [ ] fully switch to model/primitives/drawloop
- [ ] draw beziers with width (offset on the gpu?!)
- [ ] add color buffers to allow color drawing...
- [ ] tidy up webgl code
- [ ] fix debug tools
- [ ] analyze webpack bundle size
- [ ] add project glossary?

the ridiculous state of the javascript module system

The bezier.js package.json has a `main` field pointing to the commonjs version of the library, and an `exports` field pointing to the ESM bezier-js source code. Ideally, I would like to use the ESM version. Whichever way I get it working, I need to satisfy both webpack (so my code actually builds correctly), and typescript (for typechecking & intellisense). Webpack 5 uses the exports field, so builds from ESM. But typescript doesn't yet support the exports field. It only looks at `main`. I could point TS to the ESM source code, but this would be pointless since the actual type declarations (from definitely-typed) are for the commonjs version. I could just set up a webpack alias to force it to use the commonjs version, because webpack supports bundling of commonjs modules, right? Well yes, it does...but not if the package.json includes `"type": "module"`, which unfortunately the bezierjs one does. So when we try to bundle the commonjs doesn't get correctly transformed and we see a runtime error: `exports is not defined`...

so can't I just use commonjs as far as TS is concerned and ESM as far as webpack is concerned...? That should just work...right 🥺...?
Nope. It doesn't...because the commonjs and ESM versions don't have the same structure. The commonjs module (or rather the declaration files in @types/bezier-js, since that's all we care about from the TS side of things) has a "default" type export (i.e. it reassigns the exports object to the Bezier constructor). Whereas in the actual ESM code we'll be bundling, the Bezier constructor is exported as a named export, and there is no default export.

Soon typescript should support the `exports` package.json field and this whole saga will be over. https://github.com/microsoft/TypeScript/issues/33079
Well, not quite over because actually the types will need updating. Maybe I'll submit a PR to definitely-typed at that point. In the meantime, I will make a copy of the commonjs version (without the pesky package.json with `type: module`), and just point webpack to that via an alias, and point typescript to it via `paths`...and copy the types from @types/bezier-js, fixing their exports to match the actual bezier-js module. This is not ideal - it means bezier-js won't get tree-shaken.

algorithm-level performance ideas:

### "splitting" idea

When creating a strand, we already look at how the angle of the lines changes in order to determine whether we should use a pointed return. Let k be some odd number. We could keep track of the last k angles as we traverse the frame. If the variance in the last k angles was under some threshold, we say we will split the strand at the middle of the k points. A strand is cyclic so in order to actually break it up, we'll need to find two of these splitting points.

Our strand was originally cyclic, but having split it, we now have a number of linear segments.

Say our strand is formed of the points A-H

Point A is attached to B, which is attached to C etc etc, and H is attached back to A

When splitting, we might find that the line-to-line angles in sections E-F-G and A-B-C have low variance, so we decide to split at the middle of each i.e. at F and at B.

This means our new segments will be:

B-C-D-E-F and F-G-H-A-B

note that each section includes the split-points at either end

For each segment, at each non-splitting-point, we'll apply the normal constraints. We'll take our first segment as example:

at B-C-D we have c1 and c2 continuity
at C-D-E we have c1 and c2 continuity

but so far this is an underdetermined set of equations...

Our extra constraints will be to set the angle of the beziers at the splitting-point, **relative to the line-angles there**, to be equal to the same at the neighbouring points.

- forget about offsetting etc for now, draw the original middle-beziers and focus on optimizing the matrix calculations
- move more of contour.ts into wasm to avoid perf cost of copying data onto the wasm heap
- can we use cholesky decomposition instead? should be faster. If not possible with current set of
  constraints, maybe we need different set of constraints for building the matrix (and maybe
  drop C2 continuity at pointed-returns?). Or create more of a linear-programming type problem
  with an objective function etc?
- split large strands before constructing matrix/doing LU decomposition? e.g. by identifying straight-line
  areas to use for split-points?
- we're currently setting C2 constriants at the pointed returns, basically just to make the numbers up, to get a fully-determined set of equations...but are these constraints actually useful? If not, we could look into keeping the system under-determined, and seeing it as an LP-type optimization problem, to be solved e.g. by the simplex method. The objective function might be based on minimizing deviation from C3 continuity at crossing points?
- efficient updating of LU decomposition when points are moved? there seems to be a lot of literature on this
- is my LUP-decomp algo optimized for sparse matrices?
- use multi-threading with a thread per strand
- do rendering of beziers in webgl
