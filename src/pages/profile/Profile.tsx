/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Navbar from "../../components/navbar/Navbar";
import { getUserStats, type UserStats } from "../../utils/handlers/getUserStats";
import "./profile.css";

const Profile = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const userId = userData.id;
    if (!userId) return;

    const fetchStats = async () => {
      try {
        const data = await getUserStats(userId);
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      <Navbar />
      <section className="profileSection">
        <h1>Profile</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : stats ? (
          <div className="profileMetrics">
            <div className="metricCard">
              <h2>Total Solved</h2>
              <p>{stats.totalSolved}</p>
            </div>
            <div className="metricCard">
              <h2>Total Sessions</h2>
              <p>{stats.totalSessions}</p>
            </div>
            <div className="metricCard">
              <h2>Avg. Solve Time</h2>
              <p>{stats.averageSolveTime} min</p>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
};

export default Profile;
