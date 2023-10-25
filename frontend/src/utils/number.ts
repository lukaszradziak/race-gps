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
