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


export const persistChatSession = ({
  messages,
  stage,
  phase,
  approach,
  hasApproach,
  hasExplainedRef
}: {
  messages: any[];
  stage: any;
  phase: any;
  approach: any;
  hasApproach: any;
  hasExplainedRef: any;


}) => {
  localStorage.setItem("mtv-messages", JSON.stringify(messages));
  localStorage.setItem("mtv-stage", stage);
  localStorage.setItem("mtv-phase", phase);
  localStorage.setItem("mtv-approach", approach);
  localStorage.setItem("mtv-hasApproach", JSON.stringify(hasApproach));
  localStorage.setItem("mtv-hasExplainedRef", JSON.stringify(hasExplainedRef));
};

export const loadChatSession = () => {
  const messages = localStorage.getItem("mtv-messages");
  const stage = localStorage.getItem("mtv-stage");
  const phase = localStorage.getItem("mtv-phase");
  const approach = localStorage.getItem("mtv-approach");
  const hasApproach = localStorage.getItem("mtv-hasApproach");
  const hasproblemExplain = localStorage.getItem("mtv-hasExplainedRef");

  return {
    messages: messages ? JSON.parse(messages) : [],
    stage: stage ?? "",
    phase: phase ?? "",
    approach: approach ?? "",
    hasApproach: hasApproach ? JSON.parse(hasApproach) : false,
    hasproblemExplain: hasproblemExplain ? JSON.parse(hasproblemExplain) : false,
  };
};

export const clearChatSession = () => {
  localStorage.removeItem("mtv-messages");
  localStorage.removeItem("mtv-stage");
  localStorage.removeItem("mtv-phase");
  localStorage.removeItem("mtv-approach");
  localStorage.removeItem("mtv-hasApproach");
  localStorage.removeItem("mtv-hasExplainedRef");
  localStorage.removeItem("mtv-codeSnippet");
  localStorage.removeItem("mtv-problemId");
  localStorage.removeItem("mtv-timeLeft");
};
