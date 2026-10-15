export interface StarterTemplate {
  language: string
  code: string
  filename: string
  description: string
}

export const STARTER_TEMPLATES: Record<string, StarterTemplate> = {
  python: {
    language: 'python',
    filename: 'main.py',
    description: 'Standard Python starter template with entry point.',
    code: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
  },
  java: {
    language: 'java',
    filename: 'Main.java',
    description: 'Standard Java main class starter template.',
    code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
  },
  c: {
    language: 'c',
    filename: 'main.c',
    description: 'Standard C main function starter template.',
    code: `#include <stdio.h>

int main(void) {
    printf("Hello, World!\\n");
    return 0;
}
`,
  },
  cpp: {
    language: 'cpp',
    filename: 'main.cpp',
    description: 'Modern C++ starter template with standard I/O.',
    code: `#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`,
  },
  javascript: {
    language: 'javascript',
    filename: 'main.js',
    description: 'Standard JavaScript console output starter template.',
    code: `console.log("Hello, World!");
`,
  },
  typescript: {
    language: 'typescript',
    filename: 'main.ts',
    description: 'Typed TypeScript function and console output.',
    code: `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet("World"));
`,
  },
  html: {
    language: 'html',
    filename: 'index.html',
    description: 'HTML5 semantic starter template ready for live preview.',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Page</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>
`,
  },
  css: {
    language: 'css',
    filename: 'styles.css',
    description: 'CSS stylesheet starter template for interactive preview.',
    code: `/* Interactive CSS Stylesheet */
body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  margin: 0;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}
`,
  },
  reactjs: {
    language: 'reactjs',
    filename: 'App.jsx',
    description: 'React JSX component starter template with live preview.',
    code: `import React, { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#38bdf8' }}>React JS Component</h1>
      <p style={{ color: '#94a3b8' }}>Count: {count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
    </div>
  );
}
`,
  },
  reactts: {
    language: 'reactts',
    filename: 'App.tsx',
    description: 'Typed React TSX component with props interface.',
    code: `import React, { useState } from 'react';

interface AppProps {
  initialCount?: number;
}

export function App({ initialCount = 0 }: AppProps) {
  const [count, setCount] = useState<number>(initialCount);

  return (
    <div style={{ textAlign: 'center', padding: '30px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#38bdf8' }}>React TypeScript Component</h1>
      <p style={{ color: '#94a3b8' }}>Count: {count}</p>
      <button
        onClick={() => setCount((prev) => prev + 1)}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        Increment
      </button>
    </div>
  );
}
`,
  },
  nodejs: {
    language: 'nodejs',
    filename: 'server.js',
    description: 'Node.js runtime starter template with platform stats.',
    code: `const os = require('os');

console.log("Hello, World from Node.js runtime!");
console.log(\`Platform: \${os.platform()} | Architecture: \${os.arch()}\`);
`,
  },
  sql: {
    language: 'sql',
    filename: 'query.sql',
    description: 'Relational SQLite query and schema starter template.',
    code: `-- SQLite / Relational Query Template
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL
);

INSERT INTO users (name, role) VALUES ('Alice', 'Admin'), ('Bob', 'Developer');

SELECT * FROM users;
`,
  },
  csharp: {
    language: 'csharp',
    filename: 'Program.cs',
    description: 'Standard C# console starter template.',
    code: `using System;

public class Program {
    public static void Main() {
        Console.WriteLine("Hello, World!");
    }
}
`,
  },
  php: {
    language: 'php',
    filename: 'index.php',
    description: 'PHP script starter template.',
    code: `<?php
echo "Hello, World!\\n";
?>
`,
  },
  go: {
    language: 'go',
    filename: 'main.go',
    description: 'Go main package starter template.',
    code: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
  },
  rust: {
    language: 'rust',
    filename: 'main.rs',
    description: 'Rust main function starter template.',
    code: `fn main() {
    println!("Hello, World!");
}
`,
  },
  kotlin: {
    language: 'kotlin',
    filename: 'Main.kt',
    description: 'Kotlin main function starter template.',
    code: `fun main() {
    println("Hello, World!")
}
`,
  },
  swift: {
    language: 'swift',
    filename: 'main.swift',
    description: 'Swift script starter template.',
    code: `import Foundation

print("Hello, World!")
`,
  },
  ruby: {
    language: 'ruby',
    filename: 'main.rb',
    description: 'Ruby script starter template.',
    code: `puts "Hello, World!"
`,
  },
  bash: {
    language: 'bash',
    filename: 'script.sh',
    description: 'Bash shell script starter template.',
    code: `#!/usr/bin/env bash
echo "Hello, World!"
`,
  },
}

export function getStarterTemplate(lang: string): StarterTemplate {
  const key = (lang || 'python').toLowerCase().trim()
  if (STARTER_TEMPLATES[key]) {
    return STARTER_TEMPLATES[key]
  }

  // Fallbacks for common aliases
  if (key === 'py') return STARTER_TEMPLATES.python
  if (key === 'js') return STARTER_TEMPLATES.javascript
  if (key === 'ts') return STARTER_TEMPLATES.typescript
  if (key === 'c++') return STARTER_TEMPLATES.cpp
  if (key === 'cs' || key === 'c#') return STARTER_TEMPLATES.csharp
  if (key === 'sh' || key === 'shell') return STARTER_TEMPLATES.bash
  if (key === 'mysql' || key === 'postgresql' || key === 'plsql' || key === 'sqlite') return STARTER_TEMPLATES.sql
  if (key === 'jsx' || key === 'react') return STARTER_TEMPLATES.reactjs
  if (key === 'tsx') return STARTER_TEMPLATES.reactts
  if (key === 'node') return STARTER_TEMPLATES.nodejs

  return {
    language: key,
    filename: `main.${key}`,
    description: `${key} starter template`,
    code: `// ${key} starter code\n`,
  }
}
