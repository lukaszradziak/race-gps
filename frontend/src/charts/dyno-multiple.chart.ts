import Highcharts from "highcharts";

export const dynoMultipleChart: Highcharts.Options = {
  chart: {
    spacing: [10, 0, 15, 0],
    animation: false,
  },
  title: {
    text: undefined,
  },
  xAxis: {
    categories: [],
    gridLineWidth: 1,
    tickInterval: 250,
    min: 1250,
  },
  yAxis: [
    {
      title: {
        text: "Torque (Nm)",
      },
      labels: {
        distance: 5,
      },
      min: 0,
      tickInterval: 40,
      alignTicks: false,
      endOnTick: false,
    },
    {
      title: {
        text: "Power (HP)",
      },
      labels: {
        distance: 5,
      },
      min: 0,
      tickInterval: 40,
      opposite: true,
      alignTicks: false,
      endOnTick: false,
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
