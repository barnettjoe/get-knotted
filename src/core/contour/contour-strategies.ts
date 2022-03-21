import matrixSolution from "./matrix-solution";
import matrixSolutionWithSplitting from "./matrix-solution-with-splitting";
import { ContouringStrategyName, ContouringStrategy } from "../types";

const strategies: Record<ContouringStrategyName, ContouringStrategy> = {
  fullMatrixSolution: matrixSolution,
  splitMatrixSolution: matrixSolutionWithSplitting,
};

export default strategies;
