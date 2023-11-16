export function actualTime(): string {
  const hours = String(new Date().getHours()).padStart(2, "0");
  const minutes = String(new Date().getMinutes()).padStart(2, "0");
  const seconds = String(new Date().getSeconds()).padStart(2, "0");
  const milliseconds = String(
    Math.floor(new Date().getMilliseconds() / 10),
  ).padStart(2, "0");

  return hours + minutes + seconds + milliseconds;
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

export function parseToTime(value: string, previousValue?: string): number {
  if (value.length > 8) {
    throw new Error(`Wrong value of time: "${value}"`);
  }
  value = String(value).padStart(8, '0');

  const date = new Date();

  date.setHours(
    parseInt(value.slice(0, 2)),
    parseInt(value.slice(2, 4)),
    parseInt(value.slice(4, 6)),
    parseInt(value.slice(6, 8)) * 10,
  );

  if (
    previousValue &&
    previousValue.slice(0, 2) === "23" &&
    value.slice(0, 2) === "00"
  ) {
    date.setTime(date.getTime() + 86400000);
  }

  return date.getTime() / 10;
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
