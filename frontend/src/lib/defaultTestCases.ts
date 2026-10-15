import { TestCaseItem } from '@/types/execution'

export const DEFAULT_TEST_CASES: Record<string, TestCaseItem[]> = {
  python: [
    {
      id: 'py-tc-1',
      name: 'Default Execution Verification',
      input: '',
      expected_output: 'Calculation Result: 30',
    },
    {
      id: 'py-tc-2',
      name: 'Arithmetic Correctness',
      input: '',
      expected_output: 'Calculation Result: 30',
    },
  ],
  javascript: [
    {
      id: 'js-tc-1',
      name: 'Fibonacci Sequence Output',
      input: '',
      expected_output: 'First 8 Fibonacci numbers: [ 0, 1, 1, 2, 3, 5, 8, 13 ]',
    },
  ],
  java: [
    {
      id: 'java-tc-1',
      name: 'Array Sum Check',
      input: '',
      expected_output: 'Sum of array: 100',
    },
  ],
  c: [
    {
      id: 'c-tc-1',
      name: 'Standard Arithmetic Check',
      input: '',
      expected_output: 'Sum: 40',
    },
  ],
  cpp: [
    {
      id: 'cpp-tc-1',
      name: 'Vector Accumulate Sum',
      input: '',
      expected_output: 'Accumulated total: 100',
    },
  ],
  typescript: [
    {
      id: 'ts-tc-1',
      name: 'Typed Calculation Verification',
      input: '',
      expected_output: 'Sum: 100',
    },
  ],
  go: [
    {
      id: 'go-tc-1',
      name: 'Total Sum Check',
      input: '',
      expected_output: 'Go Sandbox Output: Total Sum = 50',
    },
  ],
  rust: [
    {
      id: 'rust-tc-1',
      name: 'Rust Iterator Sum',
      input: '',
      expected_output: 'Hello from Rust! Total Sum: 100',
    },
  ],
}

export function getDefaultTestCases(language: string): TestCaseItem[] {
  const lang = language.toLowerCase()
  return (
    DEFAULT_TEST_CASES[lang] || [
      {
        id: `tc-gen-${Date.now()}`,
        name: `${language.toUpperCase()} Output Validation`,
        input: '',
        expected_output: '',
      },
    ]
  )
}
