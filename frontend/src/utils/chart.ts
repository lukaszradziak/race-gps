import Highcharts from "highcharts";

export function makeChart(
  elementId: string,
  series: object,
  yAxis: object,
): void {
  setTimeout(() => {
    // TODO: setTimeout to remove and fix problem bottom
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Highcharts.chart(elementId, {
      title: {
        text: null,
      },
      yAxis,
      xAxis: {
        title: false,
        labels: {
          enabled: false,
        },
      },
      series: series,
      plotOptions: {
        series: {
          marker: {
            enabled: false,
          },
        },
      },
    });
  }, 100);
}
