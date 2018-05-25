var config = {
	gap: 2,
	overlap: 20,
	knot: {
		stroke: "black",
		strokeWidth: 50,
		fill: "none"
	},
	mask: {
		stroke: "white",
		strokeWidth: 50,
		fill: "none"
	},
	bezierDistance: 100,
    graphRows: 4,
    graphCols: 4,
    squareHeight: 200,
    graphLine: {
        stroke: 'darkgray',
        strokeWidth: 5,
        strokeOpacity: 1
    },
    frame: {
        fill: 'none',
        stroke: '#ff00ff',
        strokeWidth: 20,
        strokeOpacity: 0.2
    },

    maxStrokeWidth: function() {
		return Math.max(config.graphLine.strokeWidth, config.frame.strokeWidth);
    },

    minStrokeWidth: function() {
		return Math.min(config.graphLine.strokeWidth, config.frame.strokeWidth);
	},

	nodeStyle: {
		fill: "blue",
		stroke: "none",
		strokeWidth: 2,
		fillOpacity: 0.6,
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
