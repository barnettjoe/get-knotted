'use strict';

function Contour(strand, drawing, group) {
	var theta = 1.5;
	var strokeWidth = config.knot.borderWidth;
	var prBezes = [];
	this.masks = [];

	for (var i = 0; i < strand.length; i++) {
		if (strand[i].pr) {
			prBezes.push({
				direction: strand[i].pr,
				out: (i - 1 >= 0 ? i - 1 : strand.length - 1),
				in: (i <= strand.length - 1 ? i : 0) 
			})
		}
	}

  function emptyRow() {
    var row = [];
    for (var point of strand) {
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
    equals.push(2 * strand[i].x);
    equals.push(2 * strand[i].y);
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
    if (strand[i].pr === "R") {
      angle = theta;
    } else if (strand[i].pr === "L") {
      angle = (2 * Math.PI - theta)
    }
    var row1 = condition(2 * i - 1, [1, -Math.cos(angle)]);
    var row2 = condition(2 * i, [Math.sin(angle)]);
    var row3 = condition(2 * i, [-Math.sin(angle)]);
    matrix.push(row1.concat(row2));
    matrix.push(row3.concat(row1));
    equals.push((1 - Math.cos(angle)) * strand[i].x + Math.sin(angle) * strand[i].y),
    equals.push((1 - Math.cos(angle)) * strand[i].y - Math.sin(angle) * strand[i].x);
  }

  var matrix = [];
  var equals = [];

  for (var i = 0; i < strand.length; i++) {
    setC2continuity(i);
    if (strand[i].pr) {
      setPRangle(i);
    } else {
      setC1continuity(i);
    }
  }

  var cntrlPoints = numeric.solve(matrix, equals);
  var xCntrlPoints = cntrlPoints.slice(0, cntrlPoints.length / 2);
  var yCntrlPoints = cntrlPoints.slice(cntrlPoints.length / 2);
  var polygons = [];

  for (var i = 0; i < strand.length; i++) {
    var bezPoints = [];
    bezPoints.push([strand[i].x, strand[i].y]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([xCntrlPoints.shift(), yCntrlPoints.shift()]);
    bezPoints.push([strand[knotUtils.nextCyclicalIdx(strand, i)].x, strand[knotUtils.nextCyclicalIdx(strand, i)].y]);
    
	var pr;
	var direction;
	if (strand[i].pr) {
		pr = "inbound";
		direction = strand[i].pr;
	} else if (strand[knotUtils.nextCyclicalIdx(strand, i)].pr) {
		pr = "outbound";
		direction = strand[knotUtils.nextCyclicalIdx(strand, i)].pr;
	} else {
		pr = false;
		direction = strand[i].direction;
	}
	
	var polygon = {
    	bezPoints: bezPoints,
    	pr: pr,
    	direction: direction
    };

    polygons.push(polygon);

	var bez = new Bezier(...polygon.bezPoints.reduce((arr, sub) => arr.concat(sub)));
	

	// getting crossover squares for masks

	// assign outgoing bezes for each point of strand

	if (strand[i].pr) {
		//strand[i].point.out = bez;
	} else {
		if (strand[i].direction === "R") {
			strand[i].point.overOut = bez;
		} else if (strand[i].direction === "L") {
			strand[i].point.underOut = bez;
		}
	}
	
	strand[i].bez = bez;
  }

	this.append = function(pathStr, exts) {
		for (var ext of exts) {
			pathStr += ` L${ext.x} ${ext.y}`;
		}
		var snp = drawing.surface.path(pathStr);
		group.add(snp);
		return this.hide(snp);
	};
	
	this.prepend = function(pathStr, exts) {
		var polyline = exts.slice().reverse().map(ext => `${ext.x} ${ext.y} L`).join("");
		var extendedPath = pathStr.split(/(?<=M)/)[0] + polyline + pathStr.split(/(?<=M)/)[1];
		var snp = drawing.surface.path(extendedPath);
		group.add(snp);
		return this.hide(snp);
 	};



	this.drawPROutline = function(i) {
		// first called for outbound bezier
		this.drawPRinners(i);
		this.drawPRouters(i);
	};


	this.draw = function() {
	  for (var i = 0; i < strand.length; i++) {
		var left = strand[i].bez.offset(-(config.knot.strokeWidth + config.knot.borderWidth)/2);
		var right = strand[i].bez.offset((config.knot.strokeWidth + config.knot.borderWidth)/2);	
		var next = strand[knotUtils.nextCyclicalIdx(strand, i)];

		if (strand[i].pr) {
			if (strand[i].pr === "L") {
				strand[i].point.innerInbound = left;
				strand[i].point.outerInbound = right;
			} else if (strand[i].pr === "R") {
				strand[i].point.innerInbound = right;
				strand[i].point.outerInbound = left;
			}
			if (strand[knotUtils.previousCyclicalIdx(strand, i)].direction === "R") {
				next.point.underInLeft = left;
				next.point.underInRight = right;
			} else if (strand[knotUtils.previousCyclicalIdx(strand, i)].direction === "L") {
				next.point.overInLeft = left;
				next.point.overInRight = right;
			}
		} else {
			if (strand[i].direction === "R") {
				strand[i].point.overOutLeft = left;
				strand[i].point.overOutRight = right;
				if (!next.pr) {
					next.point.underInLeft = left;
					next.point.underInRight = right;		
				} else {
					next.point.innerOutbound = left;
					next.point.outerOutbound = right;
				}
			} else if (strand[i].direction === "L") {
				strand[i].point.underOutLeft = left;
				strand[i].point.underOutRight = right;
				if (!next.pr) {
					next.point.overInLeft = left;
					next.point.overInRight = right;	
				} else {
					next.point.innerOutbound = right;
					next.point.outerOutbound = left;
				}
			}
		}

	  }

	  // PRs

	  for (var i = 0; i < strand.length; i++) {
		if (strand[i].pr) {
			// under segments are already dealt with...
			//debugger;
			if (strand[knotUtils.previousCyclicalIdx(strand, i)].direction === "R") {
			// i.e. if outbound PR is the over segment
				
			}
		}
	  }
	};
}
