'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { useCallback } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  const toggleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor])
  const toggleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor])
  const toggleCode = useCallback(() => editor?.chain().focus().toggleCode().run(), [editor])
  const toggleH1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor])
  const toggleH2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor])
  const toggleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor])
  const toggleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor])

  if (!editor) {
    return <div>Loading editor...</div>
  }

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.5rem',
        backgroundColor: '#f9f9f9',
        borderBottom: '1px solid #ddd',
        flexWrap: 'wrap',
      }}>
        <ToolbarButton
          onClick={toggleBold}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleItalic}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleCode}
          active={editor.isActive('code')}
          title="Code"
        >
          <code style={{ fontSize: '0.75rem' }}>code</code>
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0.25rem 0' }} />

        <ToolbarButton
          onClick={toggleH1}
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleH2}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>

        <div style={{ width: '1px', backgroundColor: '#ddd', margin: '0.25rem 0' }} />

        <ToolbarButton
          onClick={toggleBulletList}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleOrderedList}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          1. List
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        style={{
          padding: '1rem',
          minHeight: '300px',
          maxHeight: '600px',
          overflow: 'auto',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '1.6',
        }}
      />

      <style>{`
        .tiptap {
          outline: none;
        }

        .tiptap h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        .tiptap h2 { font-size: 1.5em; font-weight: bold; margin: 0.4em 0; }
        .tiptap h3 { font-size: 1.25em; font-weight: bold; margin: 0.3em 0; }

        .tiptap p { margin: 0.5em 0; }

        .tiptap ul, .tiptap ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .tiptap code {
          background: #f0f0f0;
          padding: 0.2em 0.4em;
          border-radius: 2px;
          font-size: 0.9em;
          font-family: 'Courier New', monospace;
        }

        .tiptap a {
          color: #0070f3;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap pre {
          background: #f0f0f0;
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0.5em 0;
        }

        .tiptap blockquote {
          border-left: 4px solid #ddd;
          padding-left: 1em;
          margin: 0.5em 0;
          opacity: 0.6;
        }
      `}</style>
    </div>
  )
}

interface ToolbarButtonProps {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '0.4rem 0.6rem',
        minWidth: '32px',
        backgroundColor: active ? '#0070f3' : '#fff',
        color: active ? '#fff' : '#333',
        border: active ? '1px solid #0070f3' : '1px solid #ddd',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '500',
        transition: 'all 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#f5f5f5'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = '#fff'
        }
      }}
    >
      {children}
    </button>
  )
}
