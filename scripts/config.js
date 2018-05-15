var config = {
    graphRows: 4,
    graphCols: 4,
    squareHeight: 200,
    graphLine: {
        stroke: "black",
        strokeWidth: 20,
        strokeOpacity: 0.2
    },
    grid: {
        fill: "none",
        stroke: "#ff00ff",
        strokeWidth: 10,
        strokeOpacity: 0.5
    },
    offset: function() {
        return Math.max(config.grid.strokeWidth, config.graphLine.strokeWidth);
    }
};
