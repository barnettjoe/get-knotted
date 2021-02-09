what allows you to make progress in working on an application?
a good understanding of how that application is put together?

what gives you a good understanding of how your application is put together?
a solid conceptual model, which is in good alignment to the reality of the code, and is made explicit in the code

you need to find the best conceptual model for your code
to be good it has to be as simple as possible but no simpler (it should be an accurate reflection of the actual code)

a very general model, applicable to basically any program, is a data transformation pipeline. Thinking in terms of the data is good because the data transformations are what are relevant from a performance perspective (data-oriented design a la C++ etc).

that's what I use here

the application has some state, there is state at different stages of the pipeline

The first stage is the frame. This state is mutated more-or-less directly by the user interaction events.

The second stage is the strand. When the frame changes, it sets the strand to dirty, meaning the strand will be re-computed.

The contour is dependent on the strand, so changes to the strand will set the contour to dirty.

changes to the contour will set the offset state to dirty.

The final stage is the "primitive" which get rendered by webgl. These primitives are set to dirty whenever there are changes to something that gets drawn i.e. the strand, contour (in contour-only mode), or the offsets (in offset mode).

So you end up with a directed acyclic graph of dependencies. and the important thing is to make this graph explicit in the code.
It's important to not have any cycles in this graph (that would cause an infinite loop...). By design, we'll make it impossible to create dependency cycles.
