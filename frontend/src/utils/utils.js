export function downloadFile (str, name = '') {
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(str);
  hiddenElement.target = '_blank';
  hiddenElement.download = name || 'export.csv';
  hiddenElement.click();
}
