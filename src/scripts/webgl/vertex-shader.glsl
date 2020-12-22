attribute vec4 vPosition;
uniform float uCanvasWidth;

float scale_factor = 1.0 / 300.0;
float translation_delta = -1.0;

mat2 scale = mat2(
    scale_factor, 0.0,
    0.0, scale_factor
);

void main() {
    gl_PointSize = 1.0;
    vec2 scaled_position =  scale * vPosition.xy;
    gl_Position = vec4(scaled_position + translation_delta, 0, 1.0);
}
