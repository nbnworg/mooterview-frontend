import { useState, useEffect } from "react";
import { getUserById } from "../utils/handlers/getUserInfoById";
import { getTokenData } from "../utils/constants";
import type { GetUserByIdOutput } from "mooterview-client";

export const useStreak = () => {
    const [streak, setStreak] = useState<GetUserByIdOutput | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const userData = await getUserById(getTokenData().id);
                setStreak(userData);
            } catch (error) {
                console.error(error);
            }
        };

        fetchData();
    }, []);

    return { streak };
}