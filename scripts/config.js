var config = {
	gap: 2,
	overlap: 20,
	knot: {
		stroke: "black",
		strokeWidth: 20,
		fill: "none"
	},
	mask: {
		stroke: "white",
		strokeWidth: 24,
		fill: "none"
	},
	bezierDistance: 200,
    graphRows: 6,
    graphCols: 6,
    squareHeight: 150,
    graphLine: {
        stroke: 'gray',
        strokeWidth: 1,
        strokeOpacity: 1
    },
    frame: {
        fill: 'none',
        stroke: 'red',
        strokeWidth: 2,
        strokeOpacity: 1
    },

    maxStrokeWidth: function() {
		return Math.max(config.graphLine.strokeWidth, config.frame.strokeWidth);
    },

    minStrokeWidth: function() {
		return Math.min(config.graphLine.strokeWidth, config.frame.strokeWidth);
	},

	nodeStyle: {
		fill: "blue",
		stroke: "white",
		strokeWidth: 2,
		fillOpacity: 1,
		radius: 7
	},

	// necessary to ensure that frame and graph are properly...
	// aligned even when either one has greater strokeWidth
	shiftFactor: function(style) {
        if (style.strokeWidth === config.maxStrokeWidth()) {
            return 0;
        } else {
            return 0.5 * (this.maxStrokeWidth() - this.minStrokeWidth());
        }  
	}
};
