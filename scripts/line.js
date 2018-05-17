'use strict';

function Line(startCol, startRow, endCol, endRow, style, drawing) {
	var startX;
	var endX;
	var startY;
	var endY;

	if (startCol === endCol) { // i.e. if line is vertical
		startX = endX = startCol * config.squareHeight + config.maxStrokeWidth() / 2;
		startY = startRow * config.squareHeight;
		startY += config.shiftFactor(style);
		endY = startY + (endRow - startRow) * config.squareHeight;
		endY += style.strokeWidth;
	} else { // if line is horizontal 
		startY = endY = startRow * config.squareHeight + config.maxStrokeWidth() / 2;
		startX = startCol * config.squareHeight;
		startX += config.shiftFactor(style);
		endX = startX + (endCol - startCol) * config.squareHeight;
		endX += style.strokeWidth;
	}

	this.snapObj = drawing.surface.line(startX, startY, endX, endY).attr(style);

	this.crossingPointBoxCoords = function() {
		var start;
		var end;
        var constant;

		if (startCol === endCol) { // i.e. if line is vertical
			start = startRow;
			end = endRow;
		} else { // if line is horizontal
			start = startCol;
			end = endCol;
		}
		
		var arr = [];
		for(var i = start + 0.5; i < end; i++) {
            if (startCol === endCol) { // i.e. if line is vertical
                arr.push([startCol, i]);
            } else { // if line is horizontal
                arr.push([i, startRow]);
            }
		}
		return arr;
	};

	this.drawCrossingPoints = function() {
	    var arr = this.crossingPointBoxCoords();
	    for(var i = 0; i < arr.length; i++) {
            new CrossingPoint(arr[i], drawing);  
        };
	};
}


function CrossingPoint(center, drawing) {
    // first line
    var start = [center[0] - 20, center[1] - 20];
    
    drawing.surface.circle(...Mouse.pixelCoords(center), 5);
}