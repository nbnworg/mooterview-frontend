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
    chartData: object;
}

const PreparationChart: React.FC<chartProps> = ({ chartData }) => {
    const labels = Object.keys(chartData);
    const dataCount = Object.values(chartData);

    const data = {
        labels: labels,
        datasets: [
            {
                label: "Problems Solved",
                data: dataCount,
                backgroundColor: "rgba(66, 133, 244, 0.7)",
                borderColor: "rgba(66, 133, 244, 1)",
                borderWidth: 1,
            },
        ],
    };
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: "top" as const,
            },
            title: {
                display: true,
                text: "Problems Solved by Type",
                font: {
                    size: 18,
                },
            },
            tooltip: {
                enabled: true,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
            },
        },
    };
    return <>
        <Bar data={data} options={options} />
    </>;
};

export default PreparationChart;
