import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProblemSummary } from "mooterview-client";
import type { ConfirmationModalData } from "./ProblemTable";
import ConfirmationModal from "../../../components/Confirmationmodal/Confirmationmodal";
import "./randomizer.css";

export default function Randomizer({
    problems,
}: {
    problems: ProblemSummary[];
}) {
    const [confirmationModal, setConfirmationModal] =
        useState<ConfirmationModalData | null>(null);

    const navigate = useNavigate();

    function getRandomProblem(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const handleClick = async (e: React.FormEvent) => {
        e.preventDefault();
        const problemInde = getRandomProblem(0, problems.length - 1);

        setConfirmationModal({
            text1: "Are you sure you want to start the interview with this random problem?",
            text2: `Random Problem: "${problems[problemInde].title}"`,
            btn1Text: "Start Interview",
            btn2Text: "Cancel",
            btn1Handler: () => {
                const userData = JSON.parse(
                    localStorage.getItem("userData") || "{}"
                );
                navigate(
                    `/problem/${encodeURIComponent(
                        problems[problemInde].title ?? ""
                    )}`,
                    {
                        state: {
                            problemId: problems[problemInde].problemId,
                            userId: userData.id,
                        },
                    }
                );
                setConfirmationModal(null);
            },
            btn2Handler: () => setConfirmationModal(null),
        });
    };

    return (
        <>
            <div className="randomize" onClick={handleClick}>
                Select Random Problem
            </div>
            {confirmationModal && (
                <ConfirmationModal modalData={confirmationModal} />
            )}
        </>
    );
}
