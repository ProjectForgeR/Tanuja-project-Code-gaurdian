export interface LanguageConfig {
  id: string
  label: string
  icon: string
  monacoLang: string
  extensions: string[]
  color: string
  group: 'Core' | 'Web' | 'Database' | 'Other'
}

export interface LanguageGroup {
  name: 'Core' | 'Web' | 'Database' | 'Other'
  languages: LanguageConfig[]
}

export const LANGUAGE_CONFIG: Record<string, LanguageConfig> = {
  // Core Languages
  python: {
    id: 'python',
    label: 'Python',
    icon: '🐍',
    monacoLang: 'python',
    extensions: ['.py', '.pyw'],
    color: '#3776AB',
    group: 'Core',
  },
  java: {
    id: 'java',
    label: 'Java',
    icon: '☕',
    monacoLang: 'java',
    extensions: ['.java'],
    color: '#ED8B00',
    group: 'Core',
  },
  csharp: {
    id: 'csharp',
    label: 'C#',
    icon: '🎯',
    monacoLang: 'csharp',
    extensions: ['.cs'],
    color: '#9B4993',
    group: 'Core',
  },
  php: {
    id: 'php',
    label: 'PHP',
    icon: '🐘',
    monacoLang: 'php',
    extensions: ['.php'],
    color: '#777BB4',
    group: 'Core',
  },
  go: {
    id: 'go',
    label: 'Go',
    icon: '🐹',
    monacoLang: 'go',
    extensions: ['.go'],
    color: '#00ADD8',
    group: 'Core',
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    icon: '🦀',
    monacoLang: 'rust',
    extensions: ['.rs'],
    color: '#DEA584',
    group: 'Core',
  },
  kotlin: {
    id: 'kotlin',
    label: 'Kotlin',
    icon: '🟣',
    monacoLang: 'kotlin',
    extensions: ['.kt', '.kts'],
    color: '#7F52FF',
    group: 'Core',
  },
  swift: {
    id: 'swift',
    label: 'Swift',
    icon: '🦅',
    monacoLang: 'swift',
    extensions: ['.swift'],
    color: '#F05138',
    group: 'Core',
  },
  ruby: {
    id: 'ruby',
    label: 'Ruby',
    icon: '💎',
    monacoLang: 'ruby',
    extensions: ['.rb'],
    color: '#CC342D',
    group: 'Core',
  },
  c: {
    id: 'c',
    label: 'C',
    icon: '🔹',
    monacoLang: 'c',
    extensions: ['.c', '.h'],
    color: '#555555',
    group: 'Core',
  },
  cpp: {
    id: 'cpp',
    label: 'C++',
    icon: '⚙️',
    monacoLang: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
    color: '#00599C',
    group: 'Core',
  },

  // Web Languages
  html: {
    id: 'html',
    label: 'HTML',
    icon: '🌐',
    monacoLang: 'html',
    extensions: ['.html', '.htm'],
    color: '#E34F26',
    group: 'Web',
  },
  css: {
    id: 'css',
    label: 'CSS',
    icon: '🎨',
    monacoLang: 'css',
    extensions: ['.css'],
    color: '#1572B6',
    group: 'Web',
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    icon: '⚡',
    monacoLang: 'javascript',
    extensions: ['.js', '.mjs', '.cjs'],
    color: '#F7DF1E',
    group: 'Web',
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    icon: '🔷',
    monacoLang: 'typescript',
    extensions: ['.ts'],
    color: '#3178C6',
    group: 'Web',
  },
  reactjs: {
    id: 'reactjs',
    label: 'React JS',
    icon: '⚛️',
    monacoLang: 'javascript',
    extensions: ['.jsx', '.js'],
    color: '#61DAFB',
    group: 'Web',
  },
  reactts: {
    id: 'reactts',
    label: 'React TS',
    icon: '⚛️',
    monacoLang: 'typescript',
    extensions: ['.tsx'],
    color: '#61DAFB',
    group: 'Web',
  },
  nodejs: {
    id: 'nodejs',
    label: 'Node.js',
    icon: '🟢',
    monacoLang: 'javascript',
    extensions: ['.js', '.cjs'],
    color: '#339933',
    group: 'Web',
  },

  // Database Languages
  sql: {
    id: 'sql',
    label: 'SQL',
    icon: '🗄️',
    monacoLang: 'sql',
    extensions: ['.sql'],
    color: '#336791',
    group: 'Database',
  },
  mysql: {
    id: 'mysql',
    label: 'MySQL',
    icon: '🐬',
    monacoLang: 'sql',
    extensions: ['.sql'],
    color: '#4479A1',
    group: 'Database',
  },
  postgresql: {
    id: 'postgresql',
    label: 'PostgreSQL',
    icon: '🐘',
    monacoLang: 'sql',
    extensions: ['.sql'],
    color: '#336791',
    group: 'Database',
  },
  plsql: {
    id: 'plsql',
    label: 'PL/SQL',
    icon: '📜',
    monacoLang: 'sql',
    extensions: ['.sql', '.pls', '.plb'],
    color: '#F80000',
    group: 'Database',
  },

  // Other Languages
  bash: {
    id: 'bash',
    label: 'Bash / Shell',
    icon: '🐚',
    monacoLang: 'shell',
    extensions: ['.sh', '.bash'],
    color: '#4EAA25',
    group: 'Other',
  },
  json: {
    id: 'json',
    label: 'JSON',
    icon: '📋',
    monacoLang: 'json',
    extensions: ['.json'],
    color: '#CBCB41',
    group: 'Other',
  },
  yaml: {
    id: 'yaml',
    label: 'YAML',
    icon: '📑',
    monacoLang: 'yaml',
    extensions: ['.yaml', '.yml'],
    color: '#CB171E',
    group: 'Other',
  },
  xml: {
    id: 'xml',
    label: 'XML',
    icon: '📰',
    monacoLang: 'xml',
    extensions: ['.xml'],
    color: '#0060AC',
    group: 'Other',
  },
  markdown: {
    id: 'markdown',
    label: 'Markdown',
    icon: '📝',
    monacoLang: 'markdown',
    extensions: ['.md', '.markdown'],
    color: '#083FA1',
    group: 'Other',
  },
}

export const ALL_LANGUAGES: LanguageConfig[] = Object.values(LANGUAGE_CONFIG)

export const LANGUAGE_GROUPS: LanguageGroup[] = [
  {
    name: 'Core',
    languages: [
      LANGUAGE_CONFIG.python,
      LANGUAGE_CONFIG.java,
      LANGUAGE_CONFIG.csharp,
      LANGUAGE_CONFIG.php,
      LANGUAGE_CONFIG.go,
      LANGUAGE_CONFIG.rust,
      LANGUAGE_CONFIG.kotlin,
      LANGUAGE_CONFIG.swift,
      LANGUAGE_CONFIG.ruby,
      LANGUAGE_CONFIG.c,
      LANGUAGE_CONFIG.cpp,
    ],
  },
  {
    name: 'Web',
    languages: [
      LANGUAGE_CONFIG.html,
      LANGUAGE_CONFIG.css,
      LANGUAGE_CONFIG.javascript,
      LANGUAGE_CONFIG.typescript,
      LANGUAGE_CONFIG.reactjs,
      LANGUAGE_CONFIG.reactts,
      LANGUAGE_CONFIG.nodejs,
    ],
  },
  {
    name: 'Database',
    languages: [
      LANGUAGE_CONFIG.sql,
      LANGUAGE_CONFIG.mysql,
      LANGUAGE_CONFIG.postgresql,
      LANGUAGE_CONFIG.plsql,
    ],
  },
  {
    name: 'Other',
    languages: [
      LANGUAGE_CONFIG.bash,
      LANGUAGE_CONFIG.json,
      LANGUAGE_CONFIG.yaml,
      LANGUAGE_CONFIG.xml,
      LANGUAGE_CONFIG.markdown,
    ],
  },
]
