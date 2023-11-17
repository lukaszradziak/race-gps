import Highcharts from "highcharts";

export function makeChart(
  elementId: string,
  series: object,
  yAxis: object,
  yAxisTickInterval: number,
): void {
  setTimeout(() => {
    // TODO: setTimeout to remove and fix problem bottom
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Highcharts.chart(elementId, {
      chart: {
        spacing: [40, 20, 15, 20],
      },
      title: {
        text: undefined,
      },
      yAxis,
      xAxis: {
        title: {
          text: undefined,
        },
        labels: {
          enabled: false,
        },
        gridLineWidth: 1,
        tickInterval: yAxisTickInterval,
        min: 0,
        startOnTick: false,
        endOnTick: false,
      },
      tooltip: {
        valueDecimals: 1,
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
