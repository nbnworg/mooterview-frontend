import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface chartProps {
  typeToProblems: { [key: string]: string[] };
}

const PreparationChart: React.FC<chartProps> = ({ typeToProblems }) => {
  const labels = Object.keys(typeToProblems);

  const problemNames = Array.from(
    new Set(Object.values(typeToProblems).flat())
  );

  const datasets = problemNames.map((problem, i) => ({
    label: problem,
    data: labels.map((type) =>
      typeToProblems[type].includes(problem) ? 1 : 0
    ),
    backgroundColor: `hsl(${(i * 47) % 360}, 70%, 60%)`,
  }));

  const data = {
    labels,
    datasets,
  };

  const options = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Problems Solved by Type",
        font: {
          size: 23,
        },
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
      y: {
        stacked: true,
      },
    },
  };

  return <Bar data={data} options={options} />;
};

export default PreparationChart;
