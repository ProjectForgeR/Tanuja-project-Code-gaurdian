import React, { useRef, useEffect } from 'react'
import Editor, { Monaco, OnMount } from '@monaco-editor/react'
import { Finding } from '@/types/analysis'
import { useTheme } from '@/features/theme/ThemeContext'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'

export interface CodeEditorHandle {
  formatDocument: () => void
  focus: () => void
}

interface CodeEditorProps {
  code: string
  language: string
  onChange: (value: string) => void
  findings?: Finding[]
  targetLine?: number | null
  executionErrorLine?: number | null
  executionErrorMessage?: string | null
  height?: string
}

export const CodeEditor = React.forwardRef<CodeEditorHandle, CodeEditorProps>(({
  code,
  language,
  onChange,
  findings = [],
  targetLine = null,
  executionErrorLine = null,
  executionErrorMessage = null,
  height = '500px',
}, ref) => {
  const { theme } = useTheme()
  const editorRef = useRef<any>(null)
  const monacoRef = useRef<Monaco | null>(null)

  React.useImperativeHandle(ref, () => ({
    formatDocument: () => {
      try {
        if (editorRef.current) {
          editorRef.current.getAction('editor.action.formatDocument')?.run()
        }
      } catch (err) {
        console.warn('Format action failed:', err)
      }
    },
    focus: () => {
      try {
        editorRef.current?.focus()
      } catch (err) {
        console.warn('Focus action failed:', err)
      }
    },
  }))

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Configure editor layout & theme
    editor.updateOptions({
      fontSize: 15,
      fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      lineNumbersMinChars: 3,
      wordWrap: 'on',
      padding: { top: 12, bottom: 12 },
    })

    updateMarkers(editor, monaco, findings, executionErrorLine, executionErrorMessage)
  }

  // Update Monaco markers (error & warning squigglies) safely
  const updateMarkers = (
    editor: any,
    monaco: Monaco,
    currentFindings: Finding[],
    errLine: number | null,
    errMsg: string | null
  ) => {
    try {
      if (!editor || !monaco) return
      const model = editor.getModel()
      if (!model) return

      const markers: any[] = (currentFindings || []).map((f) => {
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

      // If an execution error occurred on a specific line, add an Error marker
      if (errLine && errLine > 0) {
        markers.push({
          severity: monaco.MarkerSeverity.Error,
          startLineNumber: errLine,
          startColumn: 1,
          endLineNumber: errLine,
          endColumn: 100,
          message: `[Compiler/Execution Error] ${errMsg || 'Syntax/runtime error on this line'}`,
          source: 'Execution Engine',
        })
      }

      monaco.editor.setModelMarkers(model, 'codeguardian', markers)
    } catch (err) {
      console.warn('Monaco marker update bypassed safely:', err)
    }
  }

  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      updateMarkers(editorRef.current, monacoRef.current, findings, executionErrorLine, executionErrorMessage)
    }
  }, [findings, executionErrorLine, executionErrorMessage])

  // Synchronize Monaco Editor theme dynamically when application theme changes
  useEffect(() => {
    try {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs')
      }
    } catch (err) {
      console.warn('Monaco theme switch bypassed:', err)
    }
  }, [theme])

  // Scroll to target line when clicked
  useEffect(() => {
    try {
      if (targetLine && editorRef.current) {
        editorRef.current.revealLineInCenter(targetLine)
        editorRef.current.setPosition({ lineNumber: targetLine, column: 1 })
        editorRef.current.focus()
      }
    } catch (err) {
      console.warn('Target line scroll bypassed:', err)
    }
  }, [targetLine])

  const mapLanguage = (lang: string = ''): string => {
    if (!lang) return 'plaintext'
    const l = lang.toLowerCase().trim()
    if (l === 'py') return 'python'
    if (l === 'js') return 'javascript'
    if (l === 'ts') return 'typescript'
    if (l === 'reactjs' || l === 'react' || l === 'jsx') return 'javascript'
    if (l === 'reactts' || l === 'tsx') return 'typescript'
    if (l === 'nodejs' || l === 'node') return 'javascript'
    if (l === 'c++') return 'cpp'
    if (l === 'golang') return 'go'
    if (l === 'c') return 'c'
    if (l === 'java') return 'java'
    if (l === 'csharp' || l === 'cs' || l === 'c#') return 'csharp'
    if (l === 'php') return 'php'
    if (l === 'rust' || l === 'rs') return 'rust'
    if (l === 'kotlin' || l === 'kt') return 'kotlin'
    if (l === 'swift') return 'swift'
    if (l === 'ruby' || l === 'rb') return 'ruby'
    if (l === 'html' || l === 'htm') return 'html'
    if (l === 'css') return 'css'
    if (l === 'sql' || l === 'mysql' || l === 'postgresql' || l === 'plsql') return 'sql'
    if (l === 'bash' || l === 'sh' || l === 'shell') return 'shell'
    if (l === 'json') return 'json'
    if (l === 'yaml' || l === 'yml') return 'yaml'
    if (l === 'xml') return 'xml'
    if (l === 'markdown' || l === 'md') return 'markdown'
    return l || 'plaintext'
  }

  return (
    <ErrorBoundary
      fallbackTitle="Code Editor Notice"
      fallbackMessage="The code editor encountered an issue during a language transition. Click below to reload."
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs">
        <Editor
          height={height}
          language={mapLanguage(language)}
          value={code}
          onChange={(val) => onChange(val ?? '')}
          onMount={handleEditorDidMount}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          loading={
            <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-950 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                <span>Initializing Monaco Editor...</span>
              </div>
            </div>
          }
          options={{
            automaticLayout: true,
            tabSize: 4,
            renderLineHighlight: 'all',
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            cursorBlinking: 'smooth',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            minimap: { enabled: true },
            folding: true,
          }}
        />
      </div>
    </ErrorBoundary>
  )
})

export default CodeEditor
