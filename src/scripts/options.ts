import { makeAutoObservable } from "mobx";
import Drawing from "./drawing";
export default class Options {
  offsetContour = false;
  constructor(public drawing: Drawing) {
    makeAutoObservable(this);
  }
  set(newOptions: Partial<Options>): void {
    Object.assign(this, newOptions);
  }
}
