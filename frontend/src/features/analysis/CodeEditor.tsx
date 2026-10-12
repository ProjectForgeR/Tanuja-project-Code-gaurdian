import React, { useRef, useEffect } from 'react'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { Finding } from '@/types/analysis'
import { useTheme } from '@/features/theme/ThemeContext'

interface CodeEditorProps {
  code: string
  language: string
  onChange: (value: string) => void
  findings?: Finding[]
  targetLine?: number | null
  height?: string
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
  findings = [],
  targetLine = null,
  height = '500px',
}) => {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure editor layout & theme
    editor.updateOptions({
      fontSize: 13,
      fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      lineNumbersMinChars: 3,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    })

    updateMarkers(editor, monaco, findings)
  }

  // Update Monaco markers (error & warning squigglies)
  const updateMarkers = (editor: any, monaco: Monaco, currentFindings: Finding[]) => {
    if (!editor || !monaco) return
    const model = editor.getModel()
    if (!model) return

    const markers = currentFindings.map((f) => {
      let severity = monaco.MarkerSeverity.Warning
      if (f.severity === 'Critical' || f.severity === 'High') {
        severity = monaco.MarkerSeverity.Error
      } else if (f.severity === 'Low' || f.severity === 'Informational') {
        severity = monaco.MarkerSeverity.Info
      }

      return {
        severity,
        startLineNumber: f.line_start || 1,
        startColumn: f.col_start || 1,
        endLineNumber: f.line_end || f.line_start || 1,
        endColumn: f.col_end || 100,
        message: `[${f.severity}] ${f.title}: ${f.explanation}`,
        source: f.detection_method,
      }
    })

    monaco.editor.setModelMarkers(model, 'codeguardian', markers)
  }

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateMarkers(editorRef.current, monacoRef.current, findings)
    }
  }, [findings])

  // Scroll to target line when clicked
  useEffect(() => {
    if (targetLine && editorRef.current) {
      editorRef.current.revealLineInCenter(targetLine)
      editorRef.current.setPosition({ lineNumber: targetLine, column: 1 })
      editorRef.current.focus()
    }
  }, [targetLine])

  const mapLanguage = (lang: string) => {
    const l = lang.toLowerCase()
    if (l === 'py') return 'python'
    if (l === 'js') return 'javascript'
    if (l === 'ts') return 'typescript'
    if (l === 'reactjs' || l === 'react') return 'javascript'
    if (l === 'reactts') return 'typescript'
    if (l === 'nodejs') return 'javascript'
    if (l === 'c++') return 'cpp'
    if (l === 'golang') return 'go'
    if (l === 'c') return 'c'
    if (l === 'java') return 'java'
    if (l === 'csharp' || l === 'cs') return 'csharp'
    if (l === 'php') return 'php'
    if (l === 'rust' || l === 'rs') return 'rust'
    if (l === 'kotlin' || l === 'kt') return 'kotlin'
    if (l === 'swift') return 'swift'
    if (l === 'ruby' || l === 'rb') return 'ruby'
    if (l === 'html') return 'html'
    if (l === 'css') return 'css'
    if (l === 'sql' || l === 'mysql' || l === 'postgresql' || l === 'plsql') return 'sql'
    if (l === 'bash' || l === 'sh' || l === 'shell') return 'shell'
    if (l === 'json') return 'json'
    if (l === 'yaml' || l === 'yml') return 'yaml'
    if (l === 'xml') return 'xml'
    if (l === 'markdown' || l === 'md') return 'markdown'
    return l
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
      <Editor
        height={height}
        language={mapLanguage(language)}
        value={code}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme={theme === 'light' ? 'light' : 'vs-dark'}
        options={{
          automaticLayout: true,
          tabSize: 4,
        }}
      />
    </div>
  )
}
