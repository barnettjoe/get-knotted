import drawing from "./drawing";

interface Options {
  offsetContour: boolean;
}

export const options = {
  offsetContour: false,
};

export function setOptions(newOptions: Partial<Options>): void {
  Object.assign(options, newOptions);
  drawing.setDirty();
}
