"use strict";

function Shape() {}

function KnotShape() {}
// KnotShape inherits from Shape
KnotShape.prototype = Shape.prototype;

function GridShape() {}
// GridShape inherits from Shape
GridShape.prototype = Shape.prototype;

function GridRectangle() {}
// inherits from GridShape
GridRectangle.prototype = GridShape.prototype;

function GraphLine() {}
// GraphLine inherits from Shape
GraphLine.prototype = Shape.prototype;

function HorizontalGraphLine() {}
// HorizontalGraphLine inherits from GraphLine
HorizontalGraphLine.prototype = GraphLine.prototype;

function VerticalGraphLine() {}
// VerticalGraphLine inherits from GraphLine
VerticalGraphLine.prototype = GraphLine.prototype;

function Node() {}
// Node inherits from Shape
Node.prototype = Shape.prototype;

var grid = {};
// grid HAS number of GridShapes

var graph = {};
// graph has number of GraphLines

var knot = {};
// knot has a number of KnotShapes

var drawing = {};
// drawing has a knot, a grid, and a graph