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

working on a personal project vs working at work.

whenever you're at work there are two opposing forces that need to balanced; the need to get things done, and the need to delve, to yak shave...
and the ideal position of equilibrium - the ideal place of balance is different for personal projects and for work - it depends on why you're doing what you're doing

at work we have a certain set of goals

you know there's this idea that sometimes there's a tension between the project managers/higher ups to want to ship features
the idea of tech deby
devs want to work in a nice environment, codebase wise - both for their own sanity and because taking time to clear up tech debt, have things well organized etc makes you go faster in the long run: "slow is smooth and smooth is fast" - "you've gotta go slow to go fast"

but the great thing about personal projects...if you have the time and the inclination to sit on your computer when you're not at work...is that you can go as slowly as you want.

because the goal for me, with this project, is not to actually ship any features...it's really to learn stuff...

so when I feel like yak shaving I can do that as much as I would like - I don't immediately have to go for the easy fix. At work I wouldn't always have to go for the easy fix either, as I say there is alwasys this balance it's just that it's in a different position for personal projects.

and its fun to switch between the two modes as you see fit

If something doesn't work I can delve into it as much as I like

I can pop things onto the "yak stack"

e.g. I can take a week out learning about something in the js ecosystem - I can change my setup to use a different framework or a different language, even...explore new langauge features...wasm, webgl etc etc, explore different algorithms etc

of course, getting things done is fun too...and when I feel like getting things done, I can do that...

// reinventing the observer pattern
