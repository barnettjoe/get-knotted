#version 300 es

in vec4 vPosition;
uniform float uCanvasWidth;

float scale_factor = 1.0 / 300.0;
float translation_delta = -1.0;

void main() {
    mat2 scale = mat2(
        scale_factor, 0.0,
        0.0, scale_factor
    );
    gl_PointSize = 1.0;
    vec2 scaled_position =  scale * vPosition.xy;
    vec2 pos = scaled_position + translation_delta;
    gl_Position = vec4(pos.x, -pos.y, 0, 1.0);
}
