export default function initShaders(
  gl: WebGLRenderingContext,
  {
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,
  }: { vertexShader: string; fragmentShader: string }
) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  if (!vertexShader) {
    throw new Error("failed to create vertex shader");
  }
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    throw new Error(
      `failed to compile vertex shader: ${gl.getShaderInfoLog(vertexShader)}`
    );
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!fragmentShader) {
    throw new Error("failed to create fragment shader");
  }
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    throw new Error(
      `failed to compile fragment shader: ${gl.getShaderInfoLog(
        fragmentShader
      )}`
    );
  }

  const program = gl.createProgram();
  if (!program) {
    throw new Error("failed to create GLSL program");
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `GLSL program failed to link: ${gl.getProgramInfoLog(program)}`
    );
  }

  return program;
}
