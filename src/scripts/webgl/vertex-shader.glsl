// This is about as simple as a vertex shader can get.
// all it does is pass the vertices straight through untouched to the rasterizer.

// In general, a vertex shader will transform the representation of a vertex location
// from the coordinate system in which it is specified to a representation in clip coordinates
// for the rasteriser. We specified the values in our application in clip coordinates, so our shader
// doesn't have to make any changes to the values - it can just pass them straight through.

attribute vec4 vPosition;

void
main()
{
    gl_PointSize = 1.0;
    // gl_Position is a special built-in variable - by assigning to it, we determine what gets passed into the rasteriser.
    // gl_Position must be output by every vertex shader
    gl_Position = vPosition;
}
