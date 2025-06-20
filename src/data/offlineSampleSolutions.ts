import type { SolutionSnippet } from "./sampleSolutions";

export const offlineSampleSolutions: Record<string, SolutionSnippet[]> = {
  "two-sum": [
    {
      language: "Python",
      code: `def two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n`,
    },
    {
      language: "JavaScript",
      code: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const diff = target - nums[i];\n    if (map.has(diff)) return [map.get(diff), i];\n    map.set(nums[i], i);\n  }\n}\n`,
    },
  ],
  "reverse-string": [
    {
      language: "Python",
      code: `def reverse_string(s: str) -> str:\n    return s[::-1]\n`,
    },
    {
      language: "JavaScript",
      code: `function reverseString(str) {\n  return [...str].reverse().join('');\n}\n`,
    },
  ],
};
