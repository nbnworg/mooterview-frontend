/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "axios";
import { getPromptResponse } from "./handlers/getPromptResponse";
import { Actor } from "mooterview-client";

type EvaluationScore = "strong" | "mixed" | "weak";

export interface RubricResult {
  isCorrect: boolean;
  rubricScores: {
    correctness: EvaluationScore;
    edgeCases: EvaluationScore;
    performance: EvaluationScore;
    structureChoice: EvaluationScore;
    readability: EvaluationScore;
  };
  feedback: string;
}

export interface TestCase {
  input: any;
  expected: any;
  explanation?: string;
}

const JUDGE0_URL = "https://ce.judge0.com";
const PYTHON_ID = 109;

function extractFunctionName(problemTitle: string): string {
  return problemTitle.replace(/\s+/g, "_").toLowerCase();
}

async function executeCode(
  code: string,
  stdin: string,
  problemTitle: string
): Promise<string> {
  try {
    const functionName = extractFunctionName(problemTitle);
    if (!functionName) throw new Error("No function definition found in code.");

    /*const harness = `
import sys, json
data = json.loads(sys.stdin.read())
try:
  if isinstance(data, dict):
    result = ${functionName}(**data)  
  elif isinstance(data, list):
    result = ${functionName}(*data)    
  else:
    result = ${functionName}(data)     
except Exception as e:
    result = f"Error: {str(e)}"
print(result)
`.trim();

const harness = `
import sys, json

# ===== Data Structures =====
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# ===== Converters =====
def dict_to_listnode(d):
    if not d: return None
    return ListNode(d['val'], dict_to_listnode(d.get('next')))

def dict_to_treenode(d):
    if not d: return None
    return TreeNode(d['val'], dict_to_treenode(d.get('left')), dict_to_treenode(d.get('right')))

def convert_input(x):
    if isinstance(x, dict):
        if 'val' in x and 'next' in x:
            return dict_to_listnode(x)
        elif 'val' in x and ('left' in x or 'right' in x):
            return dict_to_treenode(x)
        else:
            return {k: convert_input(v) for k,v in x.items()}
    elif isinstance(x, list):
        return [convert_input(i) for i in x]
    else:
        return x

# ===== Serializer =====
def serialize(obj):
    if obj is None:
        return None
    if isinstance(obj, ListNode):
        return {"val": obj.val, "next": serialize(obj.next)}
    if isinstance(obj, TreeNode):
        return {"val": obj.val, "left": serialize(obj.left), "right": serialize(obj.right)}
    if isinstance(obj, (list, tuple, set)):
        return [serialize(x) for x in obj]
    if isinstance(obj, dict):
        return {k: serialize(v) for k,v in obj.items()}
    return obj

# ===== Load input =====
data = json.loads(sys.stdin.read())
data = convert_input(data)

# ===== Execute user function =====
try:
    if isinstance(data, dict):
        result = ${functionName}(**data)
    elif isinstance(data, list):
        result = ${functionName}(*data)
    else:
        result = ${functionName}(data)
except Exception as e:
    result = f"Error: {str(e)}"

# ===== Output =====
print(json.dumps(serialize(result)))
`.trim();
*/
const harness = `import sys, json
from collections import deque

# ===== Data Structures =====
class ListNode:
    def _init_(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def _init_(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# ===== Converters =====
def dict_to_listnode(d):
    """Convert dict {val, next} -> ListNode"""
    if not d: return None
    return ListNode(d['val'], dict_to_listnode(d.get('next')))

def list_to_treenode(arr):
    """Convert level-order list (with None for missing) to TreeNode"""
    if not arr: return None
    it = iter(arr)
    root_val = next(it)
    if root_val is None: return None
    root = TreeNode(root_val)
    q = deque([root])
    while q:
        node = q.popleft()
        try:
            left_val = next(it)
            if left_val is not None:
                node.left = TreeNode(left_val)
                q.append(node.left)
            right_val = next(it)
            if right_val is not None:
                node.right = TreeNode(right_val)
                q.append(node.right)
        except StopIteration:
            break
    return root

def convert_input(x):
    """Convert JSON-decoded input to Python objects."""
    if isinstance(x, dict):
        # Linked List
        if 'val' in x and 'next' in x:
            return dict_to_listnode(x)
        # Tree in dict form
        elif 'val' in x and ('left' in x or 'right' in x):
            return TreeNode(x['val'], convert_input(x.get('left')), convert_input(x.get('right')))
        else:
            # Graph or trie or generic dict — recursively convert inside
            return {k: convert_input(v) for k,v in x.items()}
    elif isinstance(x, list):
        # Only treat as tree if it contains at least one None and is primitives
        if any(i is None for i in x) and all(isinstance(i,(int,float,str,bool)) or i is None for i in x):
            return list_to_treenode(x)
        # Otherwise normal array-of-something
        return [convert_input(i) for i in x]
    else:
        # int, float, str, bool just pass through
        return x

# ===== Serializer =====
def serialize(obj):
    """Convert Python objects back to JSON-serializable."""
    if obj is None:
        return None
    if isinstance(obj, ListNode):
        return {"val": obj.val, "next": serialize(obj.next)}
    if isinstance(obj, TreeNode):
        # Serialize to level-order list
        out = []
        q = deque([obj])
        while q:
            node = q.popleft()
            if node is None:
                out.append(None)
            else:
                out.append(node.val)
                q.append(node.left)
                q.append(node.right)
        # trim trailing None
        while out and out[-1] is None:
            out.pop()
        return out
    if isinstance(obj, (list, tuple, set)):
        return [serialize(x) for x in obj]
    if isinstance(obj, dict):
        return {k: serialize(v) for k,v in obj.items()}
    return obj

# ===== Load input =====
data = json.loads(sys.stdin.read())
data = convert_input(data)

# ===== Execute user function =====
try:
    if isinstance(data, dict):
        result = ${functionName}(**data)
    elif isinstance(data, list):
        result = ${functionName}(*data)
    else:
        result = ${functionName}(data)
except Exception as e:
    result = f"Error: {str(e)}"

# ===== Output =====
print(json.dumps(serialize(result)))
`.trim();



    const completedCode = code + "\n" + harness;

    const submissionRes = await axios.post(
      `${JUDGE0_URL}/submissions/?base64_encoded=false&wait=false`,
      {
        source_code: completedCode,
        language_id: PYTHON_ID,
        stdin,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const token = submissionRes.data.token;
/*
    let result;
    while (true) {
      const res = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
      );
      await new Promise((r) => setTimeout(r, 1000));
      result = await res.data;

      if (result.status && result.status.id >= 3) break;
    }

    return (result.stdout || "").trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Judge0 API error:", error.response?.data);
      throw new Error(`Execution service unavailable: ${error.message}`);
    }
    throw error;
  }
}
*/
 let result;
    while (true) {
      const res = await axios.get(
        `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
      );
      await new Promise((r) => setTimeout(r, 1000));
      result = res.data;

      if (result.status && result.status.id >= 3) break;
    }

    return (result.stdout || "").trim();
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Judge0 API error:", error.response?.data);
      throw new Error(`Execution service unavailable: ${error.message}`);
    }
    throw error;
  }
}

export const evaluateSolutionWithRubric = async (
  code: string,
  testCases: TestCase[],
  problemTitle?: string,
  problemdescription?:any
): Promise<RubricResult> => {
  let passed = 0;
  const failedCases: string[] = [];

  const hasLoops = /\b(for|while)\b/.test(code);
 // const hasEdgeHandling = /if .*len|if .*==.*|return \[\]/.test(code);
  const isShort = code.length <= 600;


  const testResults: {
  input: any;
  expected: any;
  got: any;
}[] = [];

for (const t of testCases) {
  const stdin = JSON.stringify(t.input);
  const rawOutput = await executeCode(
    code,
    stdin,
    problemTitle || "solution"
  );

  let parsedOutput: any = rawOutput;
  try {
    parsedOutput = JSON.parse(rawOutput);
  } catch {
    try {
      parsedOutput = JSON.parse(rawOutput.trim());
    } catch {
      parsedOutput = rawOutput.trim();
    }
  }

  // just collect input/expected/got
  testResults.push({
    input: t.input,
    expected: t.expected,
    got: parsedOutput,
  });
}

const edgeCaseResults = testResults.slice(0, 3); // first two cases

console.log("test",testResults);

// after you’ve built testResults:
const response = await getPromptResponse({
  actor: Actor.AI,
  context: `
Problem Description: ${problemdescription}

Test Results:
${JSON.stringify(testResults, null, 2)}
  `,
  promptKey: "check-testcase",
  modelName: "gpt-4o",
});

const edgeresponse = await getPromptResponse({
  actor: Actor.AI,
  context: `
Problem Description: ${problemdescription}

Test Results:
${JSON.stringify(edgeCaseResults, null, 2)}
  `,
  promptKey: "check-testcase",
  modelName: "gpt-4o",
});

const edgecount = Number(edgeresponse.trim());

const passedCount = Number(response.trim());

console.log(passedCount);

  const correctness: EvaluationScore =
   passedCount >= testCases.length - 1? "strong" : passedCount >= 3 ? "mixed" : "weak";

   const hasEdgeHandling :EvaluationScore = edgecount == edgeCaseResults.length ?"strong" : edgecount >= 2 ? "mixed":"weak"; 

  const rubricScores: RubricResult["rubricScores"] = {
    correctness,
    edgeCases: hasEdgeHandling ,
    performance: hasLoops ? "strong" : "mixed",
    structureChoice: "mixed",
    readability: isShort ? "strong" : "mixed",
  };

  const isCorrect = correctness === "strong";

  const feedback = isCorrect
    ? `✅ All ${testCases.length} test cases passed. Great job!`
    : `Ran ${testCases.length} test cases: ${passed} passed.\n` +
      (failedCases.length > 0 ? failedCases.join("\n") : "");

  return {
    isCorrect,
    rubricScores,
    feedback,
  };
};
