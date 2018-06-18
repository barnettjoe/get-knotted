'use strict';

function Contour(points, drawing) {
  var theta = 1.5;

	function bezString(p0, p1, p2, p3) {
	  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
	}

  function nextPointIdx(i) {
    if (i === points.length - 1) {
      return 0;
    } else {
      return (i + 1);
    }
  }

  function emptyRow() {
    var row = [];
    for (var point of points) {
      row = row.concat([0, 0]);
    };
    return row;
  }

  function condition(startIdx, entries) {
    var row = emptyRow();
    for (var x of entries) {
      if (startIdx > row.length - 1) {
        row[startIdx % row.length] = x;
      } else if (startIdx >= 0) {
        row[startIdx] = x;
      } else {
        row[row.length + startIdx] = x;
      };
      startIdx++
    };
    return row;
  }

  function setC1continuity(i) {
    var row = condition(2 * i - 1, [1, 1]);
    matrix.push(row.concat(emptyRow()));
    matrix.push(emptyRow().concat(row));
    equals.push(2 * points[i].x);
    equals.push(2 * points[i].y);
  }

  function setC2continuity(i) {
    var row = condition(2 * i, [1, -2, 2, -1]);
    matrix.push(row.concat(emptyRow()));
    matrix.push(emptyRow().concat(row));
    equals.push(0);
    equals.push(0);
  }

  function setPRangle(i) {
    var angle;
    if (points[i].pr === "R") {
      angle = theta;
    } else if (points[i].pr === "L") {
      angle = (2 * Math.PI - theta)
    }
    var row1 = condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = condition(2 * i, [Math.sin(angle)]);
    var row3 = condition(2 * i, [-Math.sin(angle)]);
    matrix.push(row1.concat(row2));
    matrix.push(row3.concat(row1));
    equals.push((1 - Math.cos(angle)) * points[i].x + Math.sin(angle) * points[i].y),
    equals.push((1 - Math.cos(angle)) * points[i].y - Math.sin(angle) * points[i].x);
  }

  var matrix = [];
  var equals = [];

  for (var i = 0; i < points.length; i++) {
    setC2continuity(i);
    if (points[i].pr) {
      setPRangle(i);
    } else {
      setC1continuity(i);
    }
  }

  var cntrlPoints = numeric.solve(matrix, equals);
  var xCntrlPoints = cntrlPoints.slice(0, cntrlPoints.length / 2);
  var yCntrlPoints = cntrlPoints.slice(cntrlPoints.length / 2);
  var polygons = [];

  for (var i = 0; i < points.length; i++) {
    var bez = [];
    bez.push([points[i].x, points[i].y]);
    bez.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bez.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bez.push([points[nextPointIdx(i)].x, points[nextPointIdx(i)].y]);
    polygons.push(bez);
  }

  this.draw = function() {
    for (var polygon of polygons) {

      var pathString = bezString(...polygon);
      var bez = drawing.surface.path(pathString);

      bez.attr({
        stroke: "red",
        strokeWidth: 20,
        fill: "none"
      });

    }
  };
}