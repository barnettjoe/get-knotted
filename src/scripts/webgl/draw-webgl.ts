import { OnscreenWebglContext } from "../types";
import { normal, lineVector, addVectors, scaleVector } from "../general-utils";
import initShaders from "./init-shaders";
import fragmentShader from "./fragment-shader.glsl";
import vertexShader from "./vertex-shader.glsl";

let gl: OnscreenWebglContext;
let program: WebGLProgram;
let singlePixelLinesBuffer: WebGLBuffer;
let linesBuffer: WebGLBuffer;
let linesVAO: WebGLVertexArrayObject;
let trianglesVAO: WebGLVertexArrayObject;
// let uCanvasWidth: WebGLUniformLocation;

const singlePixelLines: number[][] = [];
let lines: number[] = [];

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
  if (singlePixelLines.length > 0) {
    gl.bindVertexArray(linesVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, singlePixelLinesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(singlePixelLines), gl.STATIC_DRAW);
    gl.drawArrays(gl.LINES, 0, singlePixelLines.length * 2);
  }
  if (lines.length > 0) {
    gl.bindVertexArray(trianglesVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lines), gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, lines.length / 2);
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

export function addSinglePixelLine(
  startX: number,
  startY: number,
  endX: number,
  endY: number
) {
  singlePixelLines.push([startX, startY, endX, endY]);
}

export function addLine({
  startX,
  startY,
  endX,
  endY,
}: {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}) {
  const width = 5;
  const norm = normal(lineVector([startX, startY], [endX, endY]));
  // if it's worth it we could later move part of this calculation into the vertex shader
  lines.push(
    ...addVectors([startX, startY], scaleVector(norm, width / 2)),
    ...addVectors([endX, endY], scaleVector(norm, -width / 2)),
    ...addVectors([startX, startY], scaleVector(norm, -width / 2)),
    ...addVectors([startX, startY], scaleVector(norm, width / 2)),
    ...addVectors([endX, endY], scaleVector(norm, width / 2)),
    ...addVectors([endX, endY], scaleVector(norm, -width / 2))
  );
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
  vertexSize: number,
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
    vertexSize,
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
  linesBuffer = createBuffer(gl);
  singlePixelLinesBuffer = createBuffer(gl);
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
  // const vPosition = gl.getAttribLocation(program, "vPosition");
  // singlePixelLinesBuffer = createBuffer(gl);
  // gl.bindBuffer(gl.ARRAY_BUFFER, singlePixelLinesBuffer);
  // gl.bindVertexArray(linesVAO);
  // // Load the data into the GPU
  // // Associate our shader variables with our data buffer
  // gl.enableVertexAttribArray(vPosition);
  // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  // const vPosition = gl.getAttribLocation(program, "vPosition");
  // gl.bindBuffer(gl.ARRAY_BUFFER, linesBuffer);
  // gl.bindVertexArray(trianglesVAO);
  // gl.enableVertexAttribArray(vPosition);
  // gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
}
