export function actualTime() {
  return parseInt(
    new Date().toLocaleTimeString().split(":").join("") +
      "" +
      (new Date().getMilliseconds() / 10).toFixed(0).padStart(2, "0"),
  );
}
