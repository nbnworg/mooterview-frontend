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
  hasExplainedRef,
  rubricResult,
}: {
  messages: any[];
  stage: any;
  phase: any;
  approach: any;
  hasApproach: boolean;
  hasExplainedRef: any;
  rubricResult: any;
}) => {
  sessionStorage.setItem("mtv-messages", JSON.stringify(messages));
  sessionStorage.setItem("mtv-stage", stage);
  sessionStorage.setItem("mtv-phase", phase);
  sessionStorage.setItem("mtv-approach", approach);
  sessionStorage.setItem("mtv-rubricResult", JSON.stringify(rubricResult));
  sessionStorage.setItem("mtv-hasApproach", String(hasApproach));
  sessionStorage.setItem("mtv-hasExplainedRef", JSON.stringify(hasExplainedRef));
  window.dispatchEvent(new Event("storage"));

};

export const loadChatSession = () => {
  const messages = sessionStorage.getItem("mtv-messages");
  const stage = sessionStorage.getItem("mtv-stage");
  const phase = sessionStorage.getItem("mtv-phase");
  const approach = sessionStorage.getItem("mtv-approach");
  const hasApproach = sessionStorage.getItem("mtv-hasApproach");
  const hasproblemExplain = sessionStorage.getItem("mtv-hasExplainedRef");
  const rubricResult = sessionStorage.getItem("mtv-rubricResult");

  return {
    messages: messages ? JSON.parse(messages) : [],
    stage: stage ?? "",
    phase: phase ?? "",
    approach: approach ?? "",
    hasApproach: hasApproach ? JSON.parse(hasApproach) : false,
    hasproblemExplain: hasproblemExplain ? JSON.parse(hasproblemExplain) : false,
    rubricResult: rubricResult ?? "",
  };
};

export const clearChatSession = () => {
  sessionStorage.removeItem("mtv-messages");
  sessionStorage.removeItem("mtv-stage");
  sessionStorage.removeItem("mtv-phase");
  sessionStorage.removeItem("mtv-approach");
  sessionStorage.removeItem("mtv-hasApproach");
  sessionStorage.removeItem("mtv-hasExplainedRef");

  sessionStorage.removeItem("mtv-codeSnippet");
  sessionStorage.removeItem("mtv-problemId");
  sessionStorage.removeItem("mtv-timeLeft");
  sessionStorage.removeItem("mtv-rubricResult");
};