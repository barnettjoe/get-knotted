import { makeObservable, action, observable } from "mobx";
import { identicalObjects } from "./general-utils";
import type { Model } from "./model";
export default class Drawing {
  dragStart: [number, number] | null = null;
  dragEnd: [number, number] | null = null;
  model: Model;
  constructor(model: Model) {
    this.model = model;
    makeObservable(this, {
      dragStart: observable,
      dragEnd: observable,
      startDragging: action.bound,
      drag: action.bound,
    });
    this.addMouseListeners();
  }

  startDragging(event: MouseEvent) {
    this.dragStart = this.model.mouse.rowAndCol(event);
    this.dragEnd = this.dragStart;
  }

  drag(event: MouseEvent) {
    // model.mouseTracker = relativeCoords(e);
    // const previousBox = this.dragEnd;
    this.dragEnd = this.model.mouse.rowAndCol(event);
    // if (!identicalObjects(previousBox, this.dragEnd)) {
    //   doIfInGraph(this.dragEnd, () => {
    //     const currentFrame = model.frame;
    //     if (currentFrame) {
    //       model.updateFrameLines([]);
    //     }
    //     model.updateFrame(fromExtrema(dragStart, dragEnd));
    //   });
    // }
  }
  addMouseListeners() {
    const wrapper = document.getElementById("webgl-surface");
    if (wrapper) {
      wrapper.addEventListener("mousedown", this.startDragging, false);
      wrapper.addEventListener("mousemove", this.drag, false);
    }
  }
}
