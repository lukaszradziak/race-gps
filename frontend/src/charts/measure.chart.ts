import Highcharts from "highcharts";

export const measureChart: Highcharts.Options = {
  chart: {
    spacing: [40, 0, 15, 0],
  },
  title: {
    text: undefined,
  },
  yAxis: [
    {
      title: {
        text: "Speed (km/h)",
        align: "high",
        offset: -40,
        y: -20,
        rotation: 0,
      },
    },
    {
      opposite: true,
      title: {
        text: "Alt (m)",
        align: "high",
        offset: 0,
        y: -20,
        rotation: 0,
      },
      min: -16,
      max: 16,
    },
  ],
  xAxis: [
    {
      title: {
        text: undefined,
      },
      labels: {
        enabled: false,
      },
      gridLineWidth: 1,
      tickInterval: 1,
      min: 0,
      startOnTick: false,
      endOnTick: false,
    },
  ],
  tooltip: {
    valueDecimals: 1,
  },
  series: [
    {
      showInLegend: false,
      name: "Alt",
      yAxis: 1,
      data: [],
      opacity: 0.6,
      color: "red",
      lineWidth: 3,
      type: "line",
    },
    {
      showInLegend: false,
      name: "Speed",
      data: [],
      lineWidth: 3,
      type: "line",
    },
  ],
  plotOptions: {
    series: {
      marker: {
        enabled: false,
      },
    },
  },
  accessibility: {
    enabled: false,
  },
};
