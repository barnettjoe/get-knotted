import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import ChartJS from "chart.js";
import "../../../src/style.css";
import NavBar from "../../../src/core/navbar";
import computeContours from "../../../src/core/contour/contour";
import strands from "./test-data/10by6strands.json";
import { setup as setupWasm } from "../../../src/core/wasm-interface";
import { Strand } from "../../../src/core/types";
import { assertNotNullable } from "../../../src/core/general-utils";

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

type ChartData = { label: string; value: number }[];

const Chart: React.FC<{ data: ChartData }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
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
    const context = canvasRef.current?.getContext("2d");
    assertNotNullable(context);
    ctx.current = context;
    new ChartJS(context, {
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
  }, [data]);
  return (
    <div style={{ height: "calc(100vh - 40px)" }}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

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

function LoadingMessage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        height: "100vh",
        textAlign: "center",
        fontSize: "2rem",
      }}
    >
      <p>running contour perf tests, please wait...</p>
    </div>
  );
}

function Harness() {
  const [data, setData] = useState<ChartData | null>(null);
  async function setup() {
    await setupWasm();
    setData(await runStrategies());
  }

  useEffect(() => {
    setup();
  }, []);

  return (
    <>
      <NavBar />
      {data ? <Chart data={data} /> : <LoadingMessage />}
    </>
  );
}

const root = document.getElementById("root");
ReactDOM.render(<Harness />, root);
