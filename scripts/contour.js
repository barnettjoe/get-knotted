'use strict';

function Contour(points, drawing) {
	var theta = 1.5;
	var strokeWidth = 30;
	var prBezes = [];
	var overToUnders = [];
	var underToOvers = [];

	for (var i = 0; i < points.length; i++) {
		if (points[i].pr) {
			prBezes.push({
				direction: points[i].pr,
				out: (i - 1 >= 0 ? i - 1 : points.length - 1),
				in: (i <= points.length - 1 ? i : 0) 
			})
		}
	}

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
    var bezPoints = [];
    bezPoints.push([points[i].x, points[i].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([points[nextPointIdx(i)].x, points[nextPointIdx(i)].y]);
    
	var pr;
	var direction;
	if (points[i].pr) {
		pr = "inbound";
		direction = points[i].pr;
	} else if (points[nextPointIdx(i)].pr) {
		pr = "outbound";
		direction = points[nextPointIdx(i)].pr;
	} else {
		pr = false;
		direction = points[i].direction;
	}

    polygons.push({
    	bezPoints: bezPoints,
    	pr: pr,
    	direction: direction
    });
  }

  this.bezArray = polygons.map(function(polygon) {
	return new Bezier(...polygon.bezPoints.reduce((arr, sub) => arr.concat(sub)));
  });
	

	this.format = function(snapObj) {
		snapObj.attr({
			stroke: "black",
			strokeWidth: 10,
			fill: "none"
		});
	};

	this.drawOutline = function(outline) {
	   for (var curve of outline) {
		var cntrls = curve.points.map(point => [point.x, point.y]);
		this.format(drawing.surface.path(bezString(...cntrls)));
	  }
	};

	this.collectionIntersect = function(innerOutbound, innerInbound) {
		for (var i = 0; i < innerOutbound.length; i++) {
			var outboundCurve = innerOutbound[i];
			for (var j = 0; j < innerInbound.length; j++) {
				var inboundCurve = innerInbound[j];
				var intersects = outboundCurve.intersects(inboundCurve);
				if (intersects.length > 0) {
					var tOut;
					var tIn;
					[tOut, tIn] = intersects[0].split("/").map(str => Number(str));
					return {
						tOut: tOut,
						tIn: tIn,
						outboundIdx: i,
						inboundIdx: j
					};
				}
			}
		}
	};

	this.clippedOutboundPath = function(intersection, outline) {
		var bezes = outline.slice(0, intersection.outboundIdx);
		bezes.push(outline[intersection.outboundIdx].split(intersection.tOut).left);
		return bezes;
	};

	this.clippedInboundPath = function(intersection, outline) {
		var bezes = [];
		bezes.push(outline[intersection.inboundIdx].split(intersection.tIn).right);
		bezes = bezes.concat(outline.slice(intersection.inboundIdx + 1));
		return bezes;
	};


	this.pomaxPath = function(bez) {
		return bez.points.map(point => [point.x, point.y]);
	};

	this.splice = function(bezArray) {
		var that = this;
		var pathStrs = bezArray.map(function(bez) {
			return bezString(...that.pomaxPath(bez));
		});
		var path = pathStrs[0];
		for (var str of pathStrs.slice(1)) {
			path = path + str.split(/(?=\sC)/)[1];
		}
		return path;
	};

	this.drawPRinners = function(i) {
		// get initial outbound bezier
		var middleOutbound = this.bezArray[i];
		// get bez of inner outbound
		var innerOutbound;
		if (polygons[i].direction === "L") {
			innerOutbound = middleOutbound.offset(-strokeWidth/2);
		} else if (polygons[i].direction === "R") {
			innerOutbound = middleOutbound.offset(strokeWidth/2);
		}
		// get next polygon (i.e. inbound)
		var middleInbound = this.bezArray[i + 1];
		// get bez of inner inbound
		var innerInbound;
		if (polygons[i].direction === "L") {
			innerInbound = middleInbound.offset(-strokeWidth/2);
		} else if (polygons[i].direction === "R") {
			innerInbound = middleInbound.offset(strokeWidth/2);
		}
		// get intersection of inner outbound with inner inbound
		var intersection = this.collectionIntersect(innerOutbound, innerInbound);
		// split at intersection point 
		// concatenate part of outbound inner from before intersection, 
		// with the part of inbound inner from after the intersection...
		var outClipped = this.clippedOutboundPath(intersection, innerOutbound);
		var inClipped = this.clippedInboundPath(intersection, innerInbound);			
		var prPath = this.splice(outClipped.concat(inClipped));
		// then draw this concatenated path
		this.format(drawing.surface.path(prPath));
	}

	this.append = function(pathStr, exts) {
		for (var ext of exts) {
			pathStr += ` L${ext.x} ${ext.y}`;
		}
		return this.hide(drawing.surface.path(pathStr));
	};
	
	this.prepend = function(pathStr, exts) {
		var polyline = exts.slice().reverse().map(ext => `${ext.x} ${ext.y} L`).join("");
		var extendedPath = pathStr.split(/(?<=M)/)[0] + polyline + pathStr.split(/(?<=M)/)[1];
		return this.hide(drawing.surface.path(extendedPath));
 	};

	this.drawPRouters = function(i) {
		// get initial outbound bezier
		var middleOutbound = this.bezArray[i];

		// get middle inbound bez 
		var middleInbound = this.bezArray[i + 1];

		// get collections for outers
		var d = (polygons[i].direction === "L") ? strokeWidth/2 : -strokeWidth/2; 
		var outerOutbound = middleOutbound.offset(d)
		var outerInbound = middleInbound.offset(d);

		// get pathstrs for outers
		var outerOutboundPathStr = this.splice(outerOutbound);
		var outerInboundPathStr = this.splice(outerInbound);
		var tOutbound = 1;
		var tInbound = 0;
		var tStep = 0.2;
		var outboundExtensions = [middleOutbound.offset(1, d)];
		var inboundExtensions = [middleInbound.offset(0, d)];
		var kld = kldIntersections;

		// build up polylines until they intersect
		while (true) {
			// prepare for extension
			tOutbound += tStep;
			tInbound -= tStep;
			outboundExtensions.push(middleOutbound.offset(tOutbound, d));
			inboundExtensions.unshift(middleInbound.offset(tInbound, d));
			var outboundPolyline = outboundExtensions.map(ext => new kld.Point2D(ext.x, ext.y));
			var inboundPolyline = inboundExtensions.map(ext => new kld.Point2D(ext.x, ext.y));
			var intersection = kld.Intersection.intersectPolylinePolyline(outboundPolyline, inboundPolyline);
			if (intersection.points.length > 0) {
				// remove overshooting extensions
				outboundExtensions.pop();
				inboundExtensions.shift();
				break;
			}
		}
		// append intersection point to outbound polyline
		outboundExtensions.push(intersection.points[0]);
		// concatenate inbound polyline 
		outboundExtensions = outboundExtensions.concat(inboundExtensions);
		var pathStr = outerOutboundPathStr;
		pathStr += outboundExtensions.map(point => ` L ${point.x} ${point.y}`).join("");
		pathStr += " " + outerInboundPathStr.split("M")[1];
		this.format(drawing.surface.path(pathStr));
	};

	this.drawPROutline = function(i) {
		// first called for outbound bezier
		this.drawPRinners(i);
		this.drawPRouters(i);
	};

function clipToFirstHalf(element) {
 		element.attr({
 			strokeDasharray:[(element.getTotalLength() / 2 + config.overlap), element.getTotalLength() / 2  - config.overlap],
 		});
 	}
 
 	function clipToSecondHalf(element) {
 	element.attr({
 		strokeDasharray:[(element.getTotalLength() / 2 + config.overlap), element.getTotalLength() / 2  - config.overlap],
 		strokeDashoffset: element.getTotalLength() / 2 + config.overlap,
 	});
 	}
 
 	function drawUnders() {
 		for (var pathStr of underToOvers) {
 			var section = drawing.surface.path(pathStr);
 			section.attr({
 				stroke: "pink",
 				strokeWidth: 20,
 				fill: "none"
 			});
 			clipToFirstHalf(section);
 		}
 
 		for (var pathStr of overToUnders) {
 			var section = drawing.surface.path(pathStr);
 			section.attr({
 				stroke: "pink",
 				strokeWidth: 20,
 				fill: "none"
 			});
 			clipToSecondHalf(section);
 		}	
 	}
 
 	function drawOvers() {
 		for (var pathStr of overToUnders) {
 			var section = drawing.surface.path(pathStr);
 			section.attr({
 				stroke: "pink",
 				strokeWidth: 20,
 				fill: "none"
 			});
 			clipToFirstHalf(section);
 		}
 
 		for (var pathStr of underToOvers) {
 			var section = drawing.surface.path(pathStr);
 			section.attr({
 				stroke: "pink",
 				strokeWidth: 20,
 				fill: "none"
 			});
 			clipToSecondHalf(section);
 		}
 	}


	this.draw = function() {
	  for (var i = 0; i < this.bezArray.length; i++) {
		if (polygons[i].pr === "outbound") {
			this.drawPROutline(i);
		} else if (polygons[i].pr === "inbound") {
			// do nothing -- inbounds are dealt with in same invocation as outbounds
		} else {
			this.drawOutline(this.bezArray[i].offset(strokeWidth/2));
			this.drawOutline(this.bezArray[i].offset(-strokeWidth/2));
			// draw middle 
			var p = bezString(...this.pomaxPath(this.bezArray[i]));
			if (polygons[i].direction === "R") {
				overToUnders.push(p);			
			} else if (polygons[i].direction === "L") {
				underToOvers.push(p);
			}
		}
	  }
	//drawUnders();
 	//drawOvers(); 
	};
	//debugger;
}



 


