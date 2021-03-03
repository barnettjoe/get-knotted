import Drawing from "./drawing";

interface Options {
  offsetContour: boolean;
}

export const options = {
  offsetContour: false,
};

export function setOptions(
  newOptions: Partial<Options>,
  drawing: Drawing
): void {
  Object.assign(options, newOptions);
  drawing.dirty = true;
}
