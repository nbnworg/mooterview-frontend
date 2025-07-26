const LOCAL_STORAGE_KEY = "preparationReport";
const TIME_TO_EXPIRE = 2 * 24 * 60 * 60 * 1000;


export const getCachedReport = () => {
  const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const now = Date.now();

    if (now - parsed.cachedAt > TIME_TO_EXPIRE) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

export const saveReportToCache = (sessionId: string | any, report: any) => {
  const payload = {
    latestSessionId: sessionId,
    cachedAt: Date.now(),
    report,
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
};

export const clearCachedReport = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
};
  