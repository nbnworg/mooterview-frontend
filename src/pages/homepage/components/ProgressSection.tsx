import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

interface LevelProgress {
  attempted: number;
  total: number;
}

interface ProgressData {
  easy: LevelProgress;
  medium: LevelProgress;
  hard: LevelProgress;
}

ChartJS.register(ArcElement, Tooltip, Legend);

const makePieData = (attempted: number, total: number, color: string) => ({
  datasets: [
    {
      data: [attempted, Math.max(total - attempted, 0)],
      backgroundColor: [color, "#e0e0e0"],
      borderWidth: 1,
    },
  ],
});

export default function ProgressSection({
  progressData,
}: {
  progressData: ProgressData;
}) {
  return (
    <div className="interviewDashboard">
      <h1>Here’s Your Progress So Far</h1>
      <div style={{ display: "flex", gap: "2vw" }}>
        <div className="graphContainer">
          <div className="pieGraphsContainer">
            <div className="pieGraph">
              <p>
                Easy: {progressData.easy.attempted} / {progressData.easy.total}
              </p>
              <Pie
                data={makePieData(
                  progressData.easy.attempted,
                  progressData.easy.total,
                  "#4caf50"
                )}
                width={120}
                height={120}
              />
            </div>
            <div className="pieGraph">
              <p>
                Medium: {progressData.medium.attempted} /{" "}
                {progressData.medium.total}
              </p>
              <Pie
                data={makePieData(
                  progressData.medium.attempted,
                  progressData.medium.total,
                  "#ff9800"
                )}
                width={120}
                height={120}
              />
            </div>
            <div className="pieGraph">
              <p>
                Hard: {progressData.hard.attempted} / {progressData.hard.total}
              </p>
              <Pie
                data={makePieData(
                  progressData.hard.attempted,
                  progressData.hard.total,
                  "#f44336"
                )}
                width={120}
                height={120}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
