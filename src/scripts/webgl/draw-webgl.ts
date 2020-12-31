import { OnscreenWebglContext, Primitives } from "../types";
import config from "../config";
import initShaders from "./init-shaders";
import fragmentShader from "./fragment-shader.glsl";
import vertexShader from "./vertex-shader.glsl";
import getPrimitives from "../primitives";

let gl: OnscreenWebglContext;
let program: WebGLProgram;
let singlePixelLinesBuffer: WebGLBuffer;
let linesBuffer: WebGLBuffer;
let circlesBuffer: WebGLBuffer;
let linesVAO: WebGLVertexArrayObject;
let trianglesVAO: WebGLVertexArrayObject;
let circlesVAO: WebGLVertexArrayObject;

const arrayElementsPerVertex = 2;

const singlePixelLines: number[][] = [];
const lines: number[][] = [];
const circles: number[][] = [];

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

export function draw() {
  setCanvasSize();
  gl.clear(gl.COLOR_BUFFER_BIT);
  const { singlePixelLines, lines, circles } = getPrimitives();
  if (singlePixelLines.length > 0) {
    gl.bindVertexArray(linesVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, singlePixelLinesBuffer);
    const data = flatten(singlePixelLines);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, data.length / arrayElementsPerVertex);
  }
  if (lines.length > 0) {
    gl.bindVertexArray(trianglesVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);
    const data = flatten(lines);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / arrayElementsPerVertex);
  }
  if (circles.length > 0) {
    gl.bindVertexArray(circlesVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, circlesBuffer);
    const data = flatten(circles);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / arrayElementsPerVertex);
  }
  drawGrid();
}

function flatten(arr: number[][]) {
  const result: number[] = [];
  arr.forEach((subArray) => {
    result.push(...subArray);
  });
  return new Float32Array(result);
}

export function addCircle(x: number, y: number, radius: number) {
  const points = Array(config.webgl.circleSides)
    .fill(0)
    .map((_, idx) => {
      const theta = (idx / config.webgl.circleSides) * 2 * Math.PI;
      return [x + radius * Math.cos(theta), y + radius * Math.sin(theta)];
    });
  points.forEach((point, idx) => {
    circles.push([x, y], point, points[idx - 1] || points[points.length - 1]);
  });
}

export function addPolyline(polyline: number[]) {
  for (let i = 0; i < polyline.length - 4; i += 2) {
    singlePixelLines.push(polyline.slice(i, i + 4));
  }
}

function createVAO(context: OnscreenWebglContext): WebGLVertexArrayObject {
  const maybeVAO = context.createVertexArray();
  if (maybeVAO === null) {
    throw new Error("failed to create vertex array object");
  }
  return maybeVAO;
}

function createBuffer(context: OnscreenWebglContext): WebGLBuffer {
  const maybeBuffer = context.createBuffer();
  if (maybeBuffer === null) {
    throw new Error("failed to create buffer");
  }
  return maybeBuffer;
}

function setupAttribute(
  context: OnscreenWebglContext,
  program: WebGLProgram,
  shaderVariableName: string,
  vao: WebGLVertexArrayObject,
  buffer: WebGLBuffer,
  arrayElementsPerVertex: number,
  dataType: number,
  normalized = false,
  stride = 0,
  offset = 0
) {
  const attributeLocation = context.getAttribLocation(
    program,
    shaderVariableName
  );
  context.bindVertexArray(vao);
  context.bindBuffer(context.ARRAY_BUFFER, buffer);
  context.enableVertexAttribArray(attributeLocation);
  context.vertexAttribPointer(
    attributeLocation,
    arrayElementsPerVertex,
    dataType,
    normalized,
    stride,
    offset
  );
}

export function start(context: OnscreenWebglContext) {
  gl = context;
  program = initShaders(gl, { vertexShader, fragmentShader });
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.useProgram(program);
  linesVAO = createVAO(gl);
  trianglesVAO = createVAO(gl);
  circlesVAO = createVAO(gl);
  linesBuffer = createBuffer(gl);
  singlePixelLinesBuffer = createBuffer(gl);
  circlesBuffer = createBuffer(gl);
  // We have two separate VAOs for drawing the single-pixel grid lines and the
  // frame lines, which have some width. Both VAOs use the same shader attribute
  // vPosition, but in each VAO the attribute is bound to a different buffer.
  setupAttribute(
    gl,
    program,
    "vPosition",
    linesVAO,
    singlePixelLinesBuffer,
    2,
    gl.FLOAT
  );
  setupAttribute(
    gl,
    program,
    "vPosition",
    trianglesVAO,
    linesBuffer,
    2,
    gl.FLOAT
  );
  setupAttribute(
    gl,
    program,
    "vPosition",
    circlesVAO,
    circlesBuffer,
    2,
    gl.FLOAT
  );
}
