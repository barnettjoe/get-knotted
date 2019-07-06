export function main() {
}

interface IPoint {
  x: number;
  y: number;
}

module Drawing {
  export class Bounds implements IBounds {
    public Location: IPoint = new Point(0, 0);
    private _height: number = 0;
    private _width: number = 0;
    public Size() {
      return this.Height * this.Width;
    }

    get Height(): number {
      return this._height;
    }

    set Height(value: number) {
      this._height = (value > 0 ? value : 0);
    }

    get Width(): number {
      return this._width;
    }

    set Width(value: number) {
      this._width = (value > 0 ? value : 0);
    }
  }

  export class Point implements IPoint {
    public x: number;
    public y: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
    }
  }

  function GetEnumValue(): number {
    return Date.now();
  }

  interface IBounds {
    Location: IPoint;
    Height: number;
    Width: number;
    Size(): number;
  }
}

module Shapes {
  import Bounds = Drawing.Bounds;
  const origin: IPoint = new Point(0, 0);
  export enum ShapeType {
    Rectangle = 3,
    Circle,
    Line,
    Freehand,
    Random = GetEnumValue(),
  }
  export interface IShape {
    Type: ShapeType;
    Bounds: IBounds;
  }
  export class Shape implements IShape {
    public Type: ShapeType = ShapeType.Rectangle;
    public Bounds: IBounds = new Bounds();
  }
}

const shape = new Shapes.Shape();
shape.Type = Shapes.ShapeType.Circle;

module Animals {
  export module Reptiles {
    export const snake = 'snake';
  }
}

module Animals.Mammals {
  export const monkey = 'monkey';
}

interface ITask {
  Id: number;
  Execute(): boolean;
  Error: string;
}

function ProcessTasks<T extends ITask>(tasks: T[]): T {
  for (var i = 0; i < tasks.length; i++) {
    if (tasks[i].Execute() === false) {
      return tasks[i];
    }
  }
  return null;
}

function identity<T>(arg: T): T {
  return arg;
}

const output = identity("myString");

let isDone: boolean = false;

let decimal: number = 6;

let hex: number = 0xf00d;

let color: string = 'blue';

color = 'red';

let fullName: string = 'Bob Bobbington';

let age: number = 37;

let sentence: string = 'Hello, my name is ${fullName}'

let list: number[] = [1, 2, 3];

let list: Array<number> = [1, 2, 3];

let x: [string, number] = ['hello', 10];

