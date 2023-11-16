export function actualTime() {
  return parseInt(
    new Date().toLocaleTimeString().split(":").join("") +
    "" +
    (new Date().getMilliseconds() / 10).toFixed(0).padStart(2, "0"),
  );
}

export function averageValues(
  values: number[],
  index: number,
  offset: number = 8,
) {
  return (
    values
      .filter((_value, filterIndex) => {
        return index - offset <= filterIndex && index + offset >= filterIndex;
      })
      .reduce((previousValue, value) => {
        return previousValue + value;
      }, 0) /
    (offset * 2 + 1)
  );
}

export function weightedAverageValues(
  values: number[],
  index: number,
  matrix = [
    { idx: -2, w: 0.4 },
    { idx: -1, w: 0.6 },
    { idx: 0, w: 1 },
    { idx: 1, w: 0.6 },
    { idx: 2, w: 0.4 }
  ]
) {
  let pointsSum = 0;
  let pointsDiv = 0;
  matrix.forEach(avgPoint => {
    if (index + avgPoint.idx >= 0 && index + avgPoint.idx < values.length) {
      pointsSum += values[index + avgPoint.idx] * avgPoint.w;
      pointsDiv += avgPoint.w;
    }
  });
  return pointsSum / (pointsDiv > 0 ? pointsDiv : 1);
}
