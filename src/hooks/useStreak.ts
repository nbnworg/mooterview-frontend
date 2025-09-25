import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getUserById } from "../utils/handlers/getUserInfoById";
import { getTokenData } from "../utils/constants";
import type { GetUserByIdOutput } from "mooterview-client";

export const useStreak = () => {
    const [streak, setStreak] = useState<GetUserByIdOutput | null>(null);
    const location = useLocation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const tokenData = getTokenData();
                if (tokenData && tokenData.id) {
                    const userData = await getUserById(tokenData.id);
                    setStreak(userData);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, [location.pathname]);

    return { streak };
}