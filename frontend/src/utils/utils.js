export function downloadFile (str, name = '', mime = 'text/csv') {
  const hiddenElement = document.createElement('a');
  hiddenElement.href = `data:${mime};charset=utf-8,${encodeURI(str)}`;
  hiddenElement.target = '_blank';
  hiddenElement.download = name || 'export.csv';
  hiddenElement.click();
}
