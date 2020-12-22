attribute vec4 vPosition;

float scale_factor = 1.0 / 1000.0;
mat3 scale = mat3(scale_factor, 0.0, 0.0, 0.0, scale_factor, 0.0, 0.0, 0.0, 1.0);

void main()
{
    gl_PointSize = 1.0;
    vec3 position = scale * vPosition.xyz;
    gl_Position = vec4(position, 1.0);
}
