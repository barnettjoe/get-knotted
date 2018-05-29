'use strict';

function Frame(initialBox, finalBox, drawing) {
    this.nodes = [];
    this.adjacencyList = [];
    this.lines = [];
    var leftmost   = Math.min(initialBox[0], finalBox[0]);
    var topmost    = Math.min(initialBox[1], finalBox[1]);
    var rightmost  = Math.max(initialBox[0], finalBox[0]);
    var bottommost = Math.max(initialBox[1], finalBox[1]);

    Grid.call(this, {
        drawing: drawing,
        startCol: leftmost,
        startRow: topmost,
        cols: rightmost - leftmost + 1,
        rows: bottommost - topmost + 1,
        style: config.frame
    });


	this.showCrossingPoints = function() {
        for(var line of this.lines) {
         line.drawCrossingPoints();
        };
    };

    this.setNodes = function() {
        for (var x = leftmost; x <= rightmost + 1; x++) {
            for (var y = topmost; y <= bottommost + 1; y++) {
                this.nodes.push(new Node({
                	x: x,
                	y: y,
                	gridSystem: "square",
                	drawing: drawing
                }));
            }
        }
    };

    this.setNodes();

    this.showNodes = function() {
        for(var node of this.nodes) {
			node.draw();
        };
    };

    this.setLines = function() {
      for(var firstNode of this.nodes) {
        this.adjacencyList.push([]);
        // push indices of adjacent this.nodes to this new subarray
        for(var j = 0; j < this.nodes.length; j++) {
            var secondNode = this.nodes[j];
            var xDiff = Math.abs(secondNode.gridX - firstNode.gridX);
            var yDiff = Math.abs(secondNode.gridY - firstNode.gridY);
            var diffs = [xDiff, yDiff];
            // if the two this.nodes are adjacent, then difference in grid values is 1 in one dimension,
            // and zero in the other
            if (diffs.includes(1) && diffs.includes(0)) {
              this.adjacencyList[this.adjacencyList.length - 1].push(j);
            };
        };
      };
    };

    this.drawLines = function() {
        for (var i = 0; i < this.nodes.length; i++) {
            for (var j of this.adjacencyList[i]) {
               if (i < j) { // avoid drawing each line twice
                    this.lines.push(new Line({
                    	startNode: this.nodes[i],
                    	endNode: this.nodes[j],
						style: config.frame,
						drawing: drawing
                    }));
                };
            };
        };
    };

    this.linesOutFrom = function(node) {
		return this.lines.filter(function(line) {
			return line.startNode.sameNode(node) || line.endNode.sameNode(node);		
		});
	};

	this.setLines();

	this.draw = function() {
		this.drawLines();
		this.showNodes();
	};
};

Frame.prototype = Grid.prototype;

function Node(options) {
	if (options.gridSystem === "square") {
		this.gridX = options.x;
		this.gridY = options.y;
		var x;
		var y;
		[x, y] = Mouse.pixelCoords([this.gridX, this.gridY]);
		this.x = x;
		this.y = y;
	} else if (options.gridSystem === "freeform") {
		this.x = options.x;
		this.y = options.y;
	}

	this.sameNode = function(otherNode) {
		return this.x === otherNode.x && this.y === otherNode.y;
	}

	this.findHTMLobj = function() {
		var that = this;
		return Array.from(document.getElementsByClassName("node")).find(function(obj) {
			return obj.cx.baseVal.value === that.x && obj.cy.baseVal.value === that.y; 
		});
	};

	this.draw = function() {
	    this.snapObject = options.drawing.surface.circle(this.x, this.y, config.nodeStyle.radius).attr(config.nodeStyle);
		this.snapObject.addClass("node");
		this.HTMLobj = this.findHTMLobj();
	};

	this.remove = function() {
		if (this.snapObject) this.snapObject.remove();	
	};

}