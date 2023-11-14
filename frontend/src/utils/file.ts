export function downloadFile(
  str: string,
  name: string = "",
  mime: string = "text/csv",
): void {
  const hiddenElement = document.createElement("a");
  hiddenElement.href = `data:${mime};charset=utf-8,${encodeURI(str)}`;
  hiddenElement.target = "_blank";
  hiddenElement.download = name || "export.csv";
  hiddenElement.click();
}
