#version 300 es

in vec4 vPosition;
uniform float uCanvasWidth;
uniform float uCanvasHeight;


void main() {
    float translation_delta = -1.0;
    mat2 scale = mat2(
        2.0 / uCanvasWidth, 0.0,
        0.0, 2.0 / uCanvasHeight
    );
    gl_PointSize = 1.0;
    vec2 scaled_position =  scale * vPosition.xy;
    vec2 pos = scaled_position + translation_delta;
    gl_Position = vec4(pos.x, -pos.y, 0, 1.0);
}
