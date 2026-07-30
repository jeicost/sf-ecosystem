'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useCallback, useState } from 'react'
import { Bold, Italic, Code, Heading1, Heading2, List, ListOrdered, ImageIcon } from 'lucide-react'
import { ImagePicker } from '@/components/media/ImagePicker'
import { cn } from '@/lib/cn'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  projectId?: string
}

export function RichTextEditor({ value, onChange, placeholder, projectId }: RichTextEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
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
    return <div className="rounded-lg border border-slate-300 px-4 py-8 text-center text-sm text-slate-400">Loading editor…</div>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 p-2">
        <ToolbarButton onClick={toggleBold} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleItalic} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleCode} active={editor.isActive('code')} title="Code">
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={toggleH1} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleH2} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={toggleBulletList} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={toggleOrderedList} active={editor.isActive('orderedList')} title="Ordered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        {projectId && (
          <>
            <Divider />
            <ToolbarButton onClick={() => setPickerOpen(true)} active={false} title="Insert image">
              <ImageIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
          </>
        )}
      </div>

      {projectId && (
        <ImagePicker
          projectId={projectId}
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(url, alt) => {
            editor.chain().focus().setImage({ src: url, alt: alt || '' }).run()
          }}
        />
      )}

      {/* Editor */}
      <EditorContent editor={editor} className="max-h-[600px] min-h-[300px] overflow-auto p-4 leading-relaxed" />

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
          background: #f1f5f9;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
        }

        .tiptap a {
          color: #4f46e5;
          text-decoration: underline;
          cursor: pointer;
        }

        .tiptap pre {
          background: #f1f5f9;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 0.5em 0;
        }

        .tiptap blockquote {
          border-left: 4px solid #cbd5e1;
          padding-left: 1em;
          margin: 0.5em 0;
          opacity: 0.7;
        }

        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
        }
      `}</style>
    </div>
  )
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-slate-200" />
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
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex h-8 min-w-8 items-center justify-center rounded-md border text-sm font-medium transition-colors',
        active
          ? 'border-accent-600 bg-accent-600 text-white'
          : 'border-transparent text-slate-600 hover:bg-slate-200/60'
      )}
    >
      {children}
    </button>
  )
}
