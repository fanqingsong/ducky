import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'

function MonacoEditor({ value, onChange, ...props }) {
  const editorRef = useRef(null)

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
  }

  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value || '')
      }
    }
  }, [value])

  return (
    <Editor
      {...props}
      value={value}
      onChange={(val) => {
        if (onChange) {
          onChange(val || '')
        }
      }}
      onMount={handleEditorDidMount}
    />
  )
}

export default MonacoEditor

