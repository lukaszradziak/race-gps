import Highcharts from "highcharts";

export const dynoChart: Highcharts.Options = {
  chart: {
    renderTo: "chart",
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
  tooltip: {
    formatter(this: Highcharts.TooltipFormatterContextObject): string {
      if (this.x === undefined || !Array.isArray(this.points)) {
        return "";
      }

      return `<table>
        <tr>
          <td>Engine:</td>
          <td>${Math.floor(Number(this.x))} rpm</td>
        </tr>
        <tr>
          <td>Speed:</td>
          <td>${Math.floor(Number(this.points[4].y))} km/h</td>
        </tr>
        <tr>
          <td>Power:</td>
          <td><b>${Math.floor(Number(this.points[0].y))} HP</b></td>
        </tr>
        <tr>
          <td>Torque:</td>
          <td><b>${Math.floor(Number(this.points[1].y))} Nm</b></td>
        </tr>
        <tr>
          <td>Loss:</td>
          <td>${Math.floor(Number(this.points[3].y))} HP</td>
        </tr>
      </table>`;
    },
    shared: true,
    useHTML: true,
    valueDecimals: 2,
  },
  series: [
    {
      name: "Power Avg (HP)",
      type: "line",
      data: [],
      color: "red",
      opacity: 1,
      lineWidth: 3,
    },
    {
      // yAxis: 1,
      name: "Torque Avg (Nm)",
      type: "line",
      data: [],
      color: "blue",
      opacity: 1,
      lineWidth: 3,
    },
    {
      name: "Power (HP)",
      type: "line",
      data: [],
      color: "red",
      opacity: 0.1,
    },
    {
      name: "Loss (HP)",
      type: "line",
      data: [],
      color: "orange",
      opacity: 0.6,
    },
    {
      name: "Speed (km/h)",
      type: "line",
      data: [],
      color: "green",
      opacity: 0.5,
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
