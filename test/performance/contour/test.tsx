import Chart from "chart.js";
import "../../../src/style.css";
import computeContours from "../../../src/scripts/contour";
import strands from "./test-data/10by6strands.json";
import { setup as setupWasm } from "../../../src/scripts/wasm-interface";
import { Strand } from "../../../src/scripts/types";
import { assertNotNullable } from "../../../src/scripts/general-utils";

const root = document.getElementById("root");
root.style.height = "100vh";
const canvas = document.createElement("canvas");
root.appendChild(canvas);
const ctx = canvas.getContext("2d");

const colorPalette = [
  "255, 99, 132",
  "54, 162, 235",
  "255, 206, 86",
  "75, 192, 192",
  "153, 102, 255",
  "255, 159, 64",
];

const backgroundColors = colorPalette.map((color) => `rgba(${color}, 0.2)`);
const borderColors = colorPalette.map((color) => `rgba(${color}, 1)`);

function showChart(data: { label: string; value: number }[]) {
  const chartData = {
    labels: data.map((datum) => datum.label),
    datasets: [
      {
        data: data.map((datum) => datum.value),
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 1,
      },
    ],
  };
  assertNotNullable(ctx);
  new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      tooltips: {
        enabled: false,
      },
      maintainAspectRatio: false,
      legend: {
        display: false,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
        yAxes: [
          {
            scaleLabel: {
              display: true,
              fontSize: 16,
              labelString: "time / ms",
            },
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    },
  });
}

const strategies = [
  {
    name: "WASM with LUP decomp",
    compute: () => {
      return computeContours(strands as Strand[]);
    },
  },
];

function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function runStrategies() {
  const result = [];
  for (const strategy of strategies) {
    // make sure there is enough time for any GC etc
    await wait(1000);
    const { name, compute } = strategy;
    const start = performance.now();
    compute();
    const time = performance.now() - start;
    result.push({
      label: name,
      value: time,
    });
  }
  return result;
}

function showLoading() {
  const loading = document.createElement("div");
  loading.id = "loading";
  loading.innerText = "running contour perf tests, please wait...";
  loading.style.height = "100vh";
  loading.style.textAlign = "center";
  loading.style.fontSize = "2rem";
  assertNotNullable(root);
  root.appendChild(loading);
}

function hideLoading() {
  const node = document.getElementById("loading");
  assertNotNullable(node);
  assertNotNullable(node.parentElement);
  node.parentElement.removeChild(node);
}

async function main() {
  showLoading();
  await setupWasm();
  const data = await runStrategies();
  hideLoading();
  showChart(data);
}

main();
