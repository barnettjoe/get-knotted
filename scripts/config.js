var config = {
    graphRows: 6,
    graphCols: 6,
    squareHeight: 130,
    graphLine: {
        stroke: 'darkgray',
        strokeWidth: 5,
        strokeOpacity: 1
    },
    frame: {
        fill: 'none',
        stroke: '#ff00ff',
        strokeWidth: 15,
        strokeOpacity: 0.2
    },

    maxStrokeWidth: function() {
		return Math.max(config.graphLine.strokeWidth, config.frame.strokeWidth);
    },

    minStrokeWidth: function() {
		return Math.min(config.graphLine.strokeWidth, config.frame.strokeWidth);
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
