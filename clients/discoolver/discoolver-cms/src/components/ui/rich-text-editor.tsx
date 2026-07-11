"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Code,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
  Unlink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Textarea } from "./textarea";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  placeholder,
}: RichTextEditorProps) {
  const [isCodeView, setIsCodeView] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlValue(html);
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 prose dark:prose-invert max-w-none",
          className,
        ),
      },
    },
  });

  // Synchronize with external value changes
  // Use false as second arg to prevent onUpdate from firing (avoids form → editor → form loop)
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !isCodeView) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor, isCodeView]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setHtmlValue(newValue);
    onChange(newValue);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center flex-wrap gap-1 p-1 border rounded-md bg-muted/50">
        <Toggle
          size="sm"
          pressed={isCodeView}
          onPressedChange={setIsCodeView}
          aria-label="Toggle code view"
          className="mr-2"
        >
          <Code className="h-4 w-4" />
          <span className="ml-2 text-xs">Código HTML</span>
        </Toggle>

        {!isCodeView && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />

            <Toggle
              size="sm"
              pressed={editor.isActive("bold")}
              onPressedChange={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive("italic")}
              onPressedChange={() =>
                editor.chain().focus().toggleItalic().run()
              }
            >
              <Italic className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive("underline")}
              onPressedChange={() =>
                editor.chain().focus().toggleUnderline().run()
              }
            >
              <UnderlineIcon className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Toggle
              size="sm"
              pressed={editor.isActive("bulletList")}
              onPressedChange={() =>
                editor.chain().focus().toggleBulletList().run()
              }
            >
              <List className="h-4 w-4" />
            </Toggle>

            <Toggle
              size="sm"
              pressed={editor.isActive("orderedList")}
              onPressedChange={() =>
                editor.chain().focus().toggleOrderedList().run()
              }
            >
              <ListOrdered className="h-4 w-4" />
            </Toggle>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive("link") && "bg-accent",
              )}
              onClick={toggleLink}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={!editor.isActive("link")}
            >
              <Unlink className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {isCodeView ? (
        <Textarea
          value={htmlValue}
          onChange={handleCodeChange}
          className={cn("min-h-[150px] font-mono text-xs", className)}
          placeholder={placeholder}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}
