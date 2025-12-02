// Simple easing functions for preview
export const EASINGS = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

export const generateSVGPath = (path) => {
    if (path.length < 2) return '';
    return `M ${Math.round(path[0].x)} ${Math.round(path[0].y)} ` +
        path.slice(1).map(p => `L ${Math.round(p.x)} ${Math.round(p.y)}`).join(' ');
};

export const generateCSS = (path, config) => {
    const pathData = generateSVGPath(path);
    return `.element {
  offset-path: path(
    "${pathData}"
  );
  animation: move 2s ${config.easing} ${config.loop ? 'infinite' : 'forwards'};
}`;
};

export const getPathDistances = (pathPoints) => {
    if (pathPoints.length < 2) return [0];

    const distances = [0];
    let totalDist = 0;

    for (let i = 1; i < pathPoints.length; i++) {
        const dx = pathPoints[i].x - pathPoints[i - 1].x;
        const dy = pathPoints[i].y - pathPoints[i - 1].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        distances.push(totalDist);
    }

    return distances;
};

export const getInterpolatedPosition = (path, animationProgress, config) => {
    // 1. Safety Guard: If path is empty or has only 1 point
    if (!path || path.length < 2) {
        return path?.[0] || { x: 0, y: 0 };
    }

    // 2. Calculate cumulative distances along the path
    const distances = getPathDistances(path);
    const totalDistance = distances[distances.length - 1];

    if (totalDistance === 0) return path[0];

    // 3. Apply easing to get 0-1 progress
    const maxIdx = path.length - 1;
    const safeProgress = Math.min(animationProgress, maxIdx);
    const rawT = safeProgress / maxIdx;
    const easedT = EASINGS[config.easing](Math.min(Math.max(rawT, 0), 1));

    // 4. Convert eased progress to target distance
    const targetDistance = easedT * totalDistance;

    // 5. Find the two points that bracket this distance
    let segmentIndex = 0;
    for (let i = 0; i < distances.length - 1; i++) {
        if (targetDistance >= distances[i] && targetDistance <= distances[i + 1]) {
            segmentIndex = i;
            break;
        }
    }

    // 6. Boundary check
    if (segmentIndex >= path.length - 1) return path[path.length - 1];

    const start = path[segmentIndex];
    const end = path[segmentIndex + 1];

    if (!start || !end) return path[path.length - 1];

    // 7. Calculate fraction within this segment based on distance
    const segmentStartDist = distances[segmentIndex];
    const segmentEndDist = distances[segmentIndex + 1];
    const segmentLength = segmentEndDist - segmentStartDist;

    const fraction = segmentLength > 0
        ? (targetDistance - segmentStartDist) / segmentLength
        : 0;

    return {
        x: start.x + (end.x - start.x) * fraction,
        y: start.y + (end.y - start.y) * fraction
    };
};
