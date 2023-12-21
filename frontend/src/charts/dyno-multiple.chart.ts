import Highcharts from "highcharts";

export const dynoMultipleChart: Highcharts.Options = {
  chart: {
    spacing: [10, 0, 15, 0],
  },
  title: {
    text: undefined,
  },
  xAxis: {
    categories: [],
    gridLineWidth: 1,
    tickInterval: 500,
  },
  yAxis: [
    {
      title: {
        text: undefined,
      },
      labels: {
        distance: 5,
      },
      min: 0,
      minorTicks: true,
      minorTicksPerMajor: 2,
    },
  ],
  series: [],
  plotOptions: {
    series: {
      animation: false,
      marker: {
        enabled: false,
      },
    },
  },
  accessibility: {
    enabled: false,
  },
};
