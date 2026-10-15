export interface ExecutableSample {
  id: string
  name: string
  language: string
  code: string
  description: string
  sampleStdin?: string
}

export const EXECUTABLE_SAMPLES: Record<string, ExecutableSample> = {
  python: {
    id: 'python-calc',
    name: 'Python — Calculation & Formatted Output',
    language: 'python',
    code: `a = 10\nb = 20\nprint("Calculation Result:", a + b)\n`,
    description: 'Calculates the sum of two integers and prints the result.',
  },
  javascript: {
    id: 'js-fib',
    name: 'JavaScript — Fibonacci Sequence',
    language: 'javascript',
    code: `function fibonacci(n) {\n  let seq = [0, 1];\n  for (let i = 2; i < n; i++) {\n    seq.push(seq[i - 1] + seq[i - 2]);\n  }\n  return seq;\n}\n\nconsole.log("First 8 Fibonacci numbers:", fibonacci(8));\n`,
    description: 'Generates and logs an array of Fibonacci numbers in Node.js.',
  },
  java: {
    id: 'java-main',
    name: 'Java — Standard Class & Array Sum',
    language: 'java',
    code: `public class Main {\n    public static void main(String[] args) {\n        int[] numbers = {10, 20, 30, 40};\n        int sum = 0;\n        for (int num : numbers) {\n            sum += num;\n        }\n        System.out.println("Sum of array: " + sum);\n    }\n}\n`,
    description: 'Calculates the sum of an array in standard Java main class.',
  },
  c: {
    id: 'c-main',
    name: 'C — Standard I/O & Arithmetic',
    language: 'c',
    code: `#include <stdio.h>\n\nint main() {\n    int a = 15;\n    int b = 25;\n    printf("Sum: %d\\n", a + b);\n    return 0;\n}\n`,
    description: 'Standard C program with formatted output.',
  },
  cpp: {
    id: 'cpp-vector',
    name: 'C++ — Vector & Range-based Loop',
    language: 'cpp',
    code: `#include <iostream>\n#include <vector>\n#include <numeric>\n\nint main() {\n    std::vector<int> values = {10, 20, 30, 40};\n    int total = std::accumulate(values.begin(), values.end(), 0);\n    std::cout << "Accumulated total: " << total << std::endl;\n    return 0;\n}\n`,
    description: 'Modern C++ using standard vector and algorithm accumulation.',
  },
  typescript: {
    id: 'ts-calc',
    name: 'TypeScript — Typed Calculator',
    language: 'typescript',
    code: `interface Result {\n  operation: string;\n  value: number;\n}\n\nfunction calculate(a: number, b: number): Result {\n  return { operation: "Sum", value: a + b };\n}\n\nconst res: Result = calculate(25, 75);\nconsole.log(\`\${res.operation}: \${res.value}\`);\n`,
    description: 'TypeScript program with interface typing and execution.',
  },
  csharp: {
    id: 'cs-main',
    name: 'C# — Hello World & Computation',
    language: 'csharp',
    code: `using System;\n\npublic class Program {\n    public static void Main() {\n        int x = 40;\n        int y = 2;\n        Console.WriteLine($"Computed Result: {x + y}");\n    }\n}\n`,
    description: 'Standard C# console program using Mono runtime.',
  },
  php: {
    id: 'php-main',
    name: 'PHP — Script Execution',
    language: 'php',
    code: `<?php\n$items = ["CodeGuardian", "AI", "Compiler"];\necho "Executing PHP 8.3 sandbox\\n";\necho "Items: " . implode(" -> ", $items) . "\\n";\n$sum = 100 + 250;\necho "Calculated Total: " . $sum . "\\n";\n`,
    description: 'PHP CLI script with string formatting and math calculation.',
  },
  go: {
    id: 'go-main',
    name: 'Go — Goroutines & Concurrency',
    language: 'go',
    code: `package main\n\nimport "fmt"\n\nfunc main() {\n    nums := []int{5, 10, 15, 20}\n    total := 0\n    for _, n := range nums {\n        total += n\n    }\n    fmt.Printf("Go Sandbox Output: Total Sum = %d\\n", total)\n}\n`,
    description: 'Standard Go program compiling and executing via Go 1.23.',
  },
  rust: {
    id: 'rust-main',
    name: 'Rust — Safe Systems Code',
    language: 'rust',
    code: `fn main() {\n    let greeting = "Hello from Rust!";\n    let numbers = [10, 20, 30, 40];\n    let sum: i32 = numbers.iter().sum();\n    println!("{} Total Sum: {}", greeting, sum);\n}\n`,
    description: 'Rust application using standard iterator summing.',
  },
  kotlin: {
    id: 'kotlin-main',
    name: 'Kotlin — High-Level Functional Code',
    language: 'kotlin',
    code: `fun main() {\n    val items = listOf("Security", "Accuracy", "Performance")\n    println("Kotlin 2.1 Online Sandbox:")\n    items.forEachIndexed { i, item ->\n        println("  \${i + 1}. \${item}")\n    }\n}\n`,
    description: 'Kotlin program running with JVM collection transformations.',
  },
  ruby: {
    id: 'ruby-main',
    name: 'Ruby — Dynamic Programming',
    language: 'ruby',
    code: `languages = ["Ruby", "Python", "Rust", "Go"]\nputs "Supported Sandbox Languages:"\nlanguages.each_with_index do |lang, idx|\n  puts "  #{idx + 1}. #{lang}"\nend\nputs "Result: #{15 * 6}"\n`,
    description: 'Ruby script iterating over collections and computing values.',
  },
  swift: {
    id: 'swift-main',
    name: 'Swift — Modern Safety & Standard Library',
    language: 'swift',
    code: `import Foundation\n\nlet greeting = "Hello from Swift!"\nlet scores = [85, 92, 78, 95]\nlet average = Double(scores.reduce(0, +)) / Double(scores.count)\nprint("\\(greeting) Average Score: \\(average)")\n`,
    description: 'Swift script with collections and formatted printing.',
  },
  bash: {
    id: 'bash-main',
    name: 'Bash — Shell Scripting',
    language: 'bash',
    code: `#!/usr/bin/env bash\nNAME="CodeGuardian AI"\necho "Running in isolated shell environment"\necho "Target: $NAME"\nfor i in 1 2 3; do\n  echo "Step $i: OK"\ndone\n`,
    description: 'Bash shell script running in secure isolated sandbox.',
  },
  sql: {
    id: 'sql-main',
    name: 'SQL (SQLite) — Query Execution',
    language: 'sql',
    code: `CREATE TABLE audit_log (id INTEGER PRIMARY KEY, action TEXT, score INTEGER);\nINSERT INTO audit_log (action, score) VALUES ('Scan Repository', 98);\nINSERT INTO audit_log (action, score) VALUES ('AI Error Detection', 95);\nSELECT * FROM audit_log;\n`,
    description: 'SQL script creating a temporary schema and querying records.',
  },
  html: {
    id: 'html-preview',
    name: 'HTML/CSS/JS — Interactive Preview',
    language: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 420px; margin: 40px auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    h2 { color: #38bdf8; margin-top: 0; }
    button { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    button:hover { background: #2563eb; transform: scale(1.05); }
    #msg { color: #4ade80; font-weight: 600; margin-top: 16px; min-height: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>CodeGuardian AI Live Preview</h2>
    <p>Real-time Browser Rendering & Execution</p>
    <button onclick="document.getElementById('msg').innerText = 'Interactive JavaScript Works! (Clicked at ' + new Date().toLocaleTimeString() + ')'">Click Me</button>
    <p id="msg"></p>
  </div>
</body>
</html>
`,
    description: 'Interactive HTML, CSS, and JavaScript with browser preview.',
  },
  css: {
    id: 'css-preview',
    name: 'CSS — Interactive Styling',
    language: 'css',
    code: `/* Interactive CSS Styling */
body {
  font-family: system-ui, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
}
.preview-card {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border: 2px solid #3b82f6;
  border-radius: 16px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
}
.badge {
  background: #3b82f6;
  color: white;
  padding: 6px 16px;
  border-radius: 9999px;
  font-weight: 600;
  display: inline-block;
}
`,
    description: 'CSS rules rendered live in the browser preview viewport.',
  },
  nodejs: {
    id: 'node-main',
    name: 'Node.js — System Info & Output',
    language: 'nodejs',
    code: `const os = require('os');\n\nconsole.log("=== Node.js Runtime Environment ===");\nconsole.log("Platform:", os.platform());\nconsole.log("Architecture:", os.arch());\nconst items = ['Security Audit', 'Compiler Sandbox', 'AI Remediation'];\nconsole.log("Engine Services:", items.join(' | '));\n`,
    description: 'Node.js script executing in sandbox.',
  },
  reactjs: {
    id: 'reactjs-main',
    name: 'React JS — Interactive Counter Component',
    language: 'reactjs',
    code: `import React, { useState } from 'react';

export function CounterApp() {
  const [count, setCount] = useState(0);

  return (
    <div className="card" style={{ maxWidth: '380px', margin: '20px auto', textAlign: 'center' }}>
      <h2 style={{ color: '#38bdf8', marginBottom: '8px' }}>React JS Live Component</h2>
      <p style={{ color: '#94a3b8', fontSize: '13px' }}>Real-time JSX Virtual DOM Rendering</p>
      <div style={{ fontSize: '36px', fontWeight: 'bold', margin: '16px 0', color: '#4ade80' }}>
        {count}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button onClick={() => setCount(count + 1)}>Increment +</button>
        <button onClick={() => setCount(count - 1)} style={{ background: '#64748b' }}>Decrement -</button>
        <button onClick={() => setCount(0)} style={{ background: '#dc2626' }}>Reset</button>
      </div>
    </div>
  );
}
`,
    description: 'Interactive React JSX counter component running in browser preview.',
  },
  reactts: {
    id: 'reactts-main',
    name: 'React TS — Typed Security Badge Component',
    language: 'reactts',
    code: `import React, { useState } from 'react';

interface AuditItem {
  id: number;
  label: string;
  passed: boolean;
}

export function App() {
  const [items, setItems] = useState<AuditItem[]>([
    { id: 1, label: 'XSS Prevention Rules', passed: true },
    { id: 2, label: 'SQL Injection Guards', passed: true },
    { id: 3, label: 'Content Security Policy (CSP)', passed: true }
  ]);

  return (
    <div className="card" style={{ maxWidth: '420px', margin: '20px auto' }}>
      <h2 style={{ color: '#38bdf8', margin: '0 0 8px 0' }}>React TypeScript Live Component</h2>
      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 16px 0' }}>Full TypeScript Interface Typing & React Hooks</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
        {items.map(item => (
          <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #334155' }}>
            <span>{item.label}</span>
            <span style={{ color: item.passed ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
              {item.passed ? '✓ PASSED' : '✗ FAILED'}
            </span>
          </li>
        ))}
      </ul>
      <button onClick={() => console.log('Audit Verified at:', new Date().toLocaleTimeString())}>
        Log Verification to Console
      </button>
    </div>
  );
}
`,
    description: 'Typed React TSX component running in browser preview.',
  },
  mysql: {
    id: 'mysql-main',
    name: 'MySQL — Tables & Relational Queries',
    language: 'mysql',
    code: `CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT);\nINSERT INTO users (username, role) VALUES ('alice', 'admin'), ('bob', 'developer');\nCREATE TABLE audit (id INTEGER PRIMARY KEY, user_id INTEGER, action TEXT);\nINSERT INTO audit (user_id, action) VALUES (1, 'Scan Project'), (2, 'Deploy Fix');\nSELECT u.username, u.role, a.action FROM users u JOIN audit a ON u.id = a.user_id;\n`,
    description: 'Relational database schema and join execution.',
  },
  postgresql: {
    id: 'postgres-main',
    name: 'PostgreSQL — Performance Metrics',
    language: 'postgresql',
    code: `CREATE TABLE api_logs (endpoint TEXT, latency_ms INTEGER, status_code INTEGER);\nINSERT INTO api_logs VALUES ('/api/compiler', 85, 200), ('/api/analyze', 120, 200), ('/api/auth', 45, 200);\nSELECT endpoint, AVG(latency_ms) AS avg_latency FROM api_logs GROUP BY endpoint;\n`,
    description: 'PostgreSQL analytics table and aggregate query.',
  },
  plsql: {
    id: 'plsql-main',
    name: 'PL/SQL — Security Audit Log',
    language: 'plsql',
    code: `CREATE TABLE event_log (id INTEGER PRIMARY KEY, title TEXT, severity TEXT);\nINSERT INTO event_log VALUES (1, 'SQL Injection Prevented', 'Critical'), (2, 'Missing CSP Header', 'Medium');\nSELECT title, severity FROM event_log WHERE severity = 'Critical';\n`,
    description: 'PL/SQL schema creation and severity filter query.',
  },
  json: {
    id: 'json-main',
    name: 'JSON — Valid Application Configuration',
    language: 'json',
    code: `{\n  "project": "CodeGuardian AI",\n  "version": "2.0.0",\n  "domains": ["Core", "Web", "Database", "Other"],\n  "status": "Operational"\n}\n`,
    description: 'Valid JSON configuration structure.',
  },
  yaml: {
    id: 'yaml-main',
    name: 'YAML — Service Configuration',
    language: 'yaml',
    code: `version: "3.9"\nservices:\n  codeguardian-backend:\n    image: python:3.11-slim\n    ports:\n      - "8000:8000"\n    environment:\n      - ENVIRONMENT=production\n`,
    description: 'Validated YAML service configuration.',
  },
  xml: {
    id: 'xml-main',
    name: 'XML — Safe Document Schema',
    language: 'xml',
    code: `<?xml version="1.0" encoding="UTF-8"?>\n<configuration>\n  <appSettings>\n    <add key="AppMode" value="Secure"/>\n    <add key="MaxRetries" value="3"/>\n  </appSettings>\n</configuration>\n`,
    description: 'Standard XML configuration structure.',
  },
  markdown: {
    id: 'markdown-main',
    name: 'Markdown — Documentation',
    language: 'markdown',
    code: `# CodeGuardian AI Workspace\n\nMulti-language coding & error resolution platform.\n\n- Multi-Language Editor\n- Instant Compilation Sandbox\n- AI Error Remediation\n`,
    description: 'Markdown formatted documentation.',
  },
}

