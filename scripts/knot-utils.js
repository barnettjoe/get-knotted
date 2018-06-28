window.knotUtils = (function() { 
    function collectionIntersect(collectionA, collectionB) {
		for (var i = 0; i < collectionA.length; i++) {
			var curveA = collectionA[i];
			for (var j = 0; j < collectionB.length; j++) {
				var curveB = collectionB[j];
				var intersects = curveA.intersects(curveB);
				if (intersects.length > 0) {
					var tA;
					var tB;
					[tA, tB] = intersects[0].split("/").map(str => Number(str));
					return {
						tA: tA,
						tB: tB,
						idxA: i,
						idxB: j
					};
				}
			}
		}
	}

	function bezString(p0, p1, p2, p3) {
	  return `M${p0[0]} ${p0[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${p3[0]} ${p3[1]}`;
	}

	function nextCyclicalIdx(arr, i) {
		if (i === arr.length - 1) {
			return 0;
		} else {
			return (i + 1);
		}
	}

	function previousCyclicalIdx(arr, i) {
		if (i === 0) {
			return arr.length - 1;
		} else {
			return (i - 1);
		}
	}

    return {
      nextCyclicalIdx: nextCyclicalIdx,
      previousCyclicalIdx: previousCyclicalIdx,
      collectionIntersect: collectionIntersect,
      bezString: bezString
    };
})();