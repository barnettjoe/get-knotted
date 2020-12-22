import { OnscreenWebglContext } from "../types";
import initShaders from "./init-shaders";
import fragmentShader from "./fragment-shader.glsl";
import vertexShader from "./vertex-shader.glsl";

let gl: OnscreenWebglContext;
let program: WebGLProgram;
let vertexBuffer;

function setCanvasSize() {
  const canvas = gl.canvas;
  const cssToRealPixels = window.devicePixelRatio || 1;
  // lookup the size the browser is displaying the canvas in CSS pixels
  // and compute a size needed to make our drawingbuffer match it in device pixels

  // N.B. this calculation does mean we'll be drawing a lot more pixels for some devices
  // (devicePixelRatio can be up to 5) - later we may want to render fewer pixels if we
  // encounter performance issues...
  const displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);
  const displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
  // check if the canvas is not the same height
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
  // tell webgl how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

export function addGridLine() {}

export function drawGrid() {}

const lines: number[][] = [];

function drawLoop() {
  setCanvasSize();
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (lines.length > 0) {
    gl.drawArrays(gl.LINES, 0, lines.length * 2);
  }
  drawGrid();
  requestAnimationFrame(drawLoop);
}

function flatten(arr: number[][]) {
  const result: number[] = [];
  arr.forEach((subArray) => {
    result.push(...subArray);
  });
  return new Float32Array(result);
}

export function addLine(
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  lines.push([startX, startY, endX, endY]);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(lines), gl.STATIC_DRAW);
}

export function start(context: OnscreenWebglContext) {
  gl = context;
  program = initShaders(gl, { vertexShader, fragmentShader });
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.useProgram(program);

  // Load the data into the GPU
  vertexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Associate our shader variables with our data buffer
  const vPosition = gl.getAttribLocation(program, "vPosition");
  gl.enableVertexAttribArray(vPosition);
  // Describe the form of the data in the vertex array.
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  drawLoop();
}
