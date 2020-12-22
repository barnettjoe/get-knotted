// wildcard module declaration to make TS happy with
// importing shaders as strings via raw-loader
declare module "*\.glsl" {
  const content: string;
  export default content;
}
