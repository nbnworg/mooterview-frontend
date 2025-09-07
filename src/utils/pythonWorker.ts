/// <reference lib="webworker" />

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");

type PyodideInstance = {
  runPythonAsync: (code: string) => Promise<unknown>;
};

type PyodideGlobal = DedicatedWorkerGlobalScope & {
  loadPyodide: (opts: { indexURL: string }) => Promise<PyodideInstance>;
};

const ctx = self as unknown as PyodideGlobal;

const pyodideReady = ctx.loadPyodide({
  indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
});

self.onmessage = async (
  event: MessageEvent<{ code: string }>
): Promise<void> => {
  const pyodide = await pyodideReady;
  try {
    const result = await pyodide.runPythonAsync(event.data.code);
    ctx.postMessage({ result: String(result) });
  } catch (error) {
    ctx.postMessage({ error: (error as Error).message });
  }
};
