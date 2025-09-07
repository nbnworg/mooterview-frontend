export const runPythonSandbox = (code: string): Promise<string> => {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("./pythonWorker.ts", import.meta.url));

    const timeout = setTimeout(() => {
      worker.terminate();
      resolve("Execution terminated: code exceeded 5-second limit.");
    }, 5000);

    worker.onmessage = (event: MessageEvent<{ result?: string; error?: string }>) => {
      clearTimeout(timeout);
      if (event.data.error) {
        resolve(event.data.error);
      } else {
        resolve(event.data.result ?? "");
      }
      worker.terminate();
    };

    worker.postMessage({ code });
  });
};
