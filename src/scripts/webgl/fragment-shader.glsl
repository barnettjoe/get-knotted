#version 300 es

// Each invocation of the vertex shader outputs a vertex, which then goes through primitive
// assembly and clipping before reaching the rasteriser. The rasteriser outputs fragments for
// each primitive inside the clipping volume. Each fragment invokes an execution of the fragment shader.

// At a minimum, each execution of the fragment shader must output a color for the fragment unless the fragment
// is to be discarded.

// This is the minimal GLSL fragment shader. All it does it assign a four-dimensional RGBA color to each fragment
// through the built-in variable gl_FragColor.

precision highp float;

out vec4 outColor;
void
main()
{
    outColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}
