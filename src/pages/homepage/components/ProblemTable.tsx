import type { ProblemSummary } from "mooterview-client";
import { levelColor } from "../../../utils/constants";
import ConfirmationModal from "../../../components/Confirmationmodal/Confirmationmodal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type ConfirmationModalData = {
  text1: string;
  text2: string;
  btn1Text: string;
  btn2Text: string;
  btn1Handler: () => void;
  btn2Handler: () => void;
};

export default function ProblemTable({
  problems,
}: {
  problems: ProblemSummary[];
  solvedIds: string[];
}) {
  const [confirmationModal, setConfirmationModal] =
    useState<ConfirmationModalData | null>(null);
  const navigate = useNavigate();

  return (
    <>
      <div className="problemTableWrapper">
        <table className="problemTable">
          <thead>
            <tr>
              <th>Interview Questions</th>
              <th>Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr className="tableRow" key={problem.problemId}>
                <td className="tableProblemTitle">{problem.title}</td>
                <td>
                  <span
                    className="tableProblemLevel"
                    style={{
                      color:
                        levelColor[problem.level as keyof typeof levelColor],
                    }}
                  >
                    {problem.level}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setConfirmationModal({
                        text1: "Are you sure you want to start the interview?",
                        text2: `Problem: "${problem.title}"`,
                        btn1Text: "Start Interview",
                        btn2Text: "Cancel",
                        btn1Handler: () => {
                          const userData = JSON.parse(
                            localStorage.getItem("userData") || "{}"
                          );
                          navigate(
                            `/problem/${encodeURIComponent(
                              problem.title ?? ""
                            )}`,
                            {
                              state: {
                                problemId: problem.problemId,
                                userId: userData.id,
                              },
                            }
                          );
                          setConfirmationModal(null);
                        },
                        btn2Handler: () => setConfirmationModal(null),
                      });
                    }}
                    className="startInterviewButton"
                  >
                    Start
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}
