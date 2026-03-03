'use client';

import { useState, useRef } from 'react';
import { CreateBroadcastInput, MediaType } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/common';

interface BroadcastFormProps {
  onSubmit: (data: CreateBroadcastInput, file?: File) => Promise<void>;
  isLoading?: boolean;
}

const FORMATTING_HINTS = [
  { label: 'B', syntax: '<b>text</b>', title: 'Bold' },
  { label: 'I', syntax: '<i>text</i>', title: 'Italic' },
  { label: 'U', syntax: '<u>text</u>', title: 'Underline' },
  { label: 'S', syntax: '<s>text</s>', title: 'Strike' },
  { label: '<>', syntax: '<code>text</code>', title: 'Code' },
  { label: 'Link', syntax: '<a href="url">text</a>', title: 'Link' },
];

export function BroadcastForm({ onSubmit, isLoading }: BroadcastFormProps) {
  const [messageText, setMessageText] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('none');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText && !file) {
      return;
    }

    await onSubmit(
      {
        message_text: messageText || undefined,
        media_type: file ? detectMediaType(file) : mediaType,
      },
      file || undefined
    );

    // Reset form
    setMessageText('');
    setMediaType('none');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const detectMediaType = (f: File): MediaType => {
    if (f.type.startsWith('image/')) return 'image';
    if (f.type.startsWith('video/')) return 'video';
    if (f.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMediaType(detectMediaType(selectedFile));
    }
  };

  const clearFile = () => {
    setFile(null);
    setMediaType('none');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertFormatting = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = messageText.substring(start, end);

    const tagMatch = syntax.match(/<(\w+)(?:\s[^>]*)?>.*<\/\1>/);
    if (!tagMatch) return;

    const tag = tagMatch[1];
    let newText: string;
    let cursorPos: number;

    if (selectedText) {
      if (tag === 'a') {
        newText = messageText.substring(0, start) + `<a href="URL">${selectedText}</a>` + messageText.substring(end);
        cursorPos = start + 9;
      } else {
        newText = messageText.substring(0, start) + `<${tag}>${selectedText}</${tag}>` + messageText.substring(end);
        cursorPos = end + tag.length * 2 + 5;
      }
    } else {
      if (tag === 'a') {
        newText = messageText.substring(0, start) + '<a href="URL">text</a>' + messageText.substring(end);
        cursorPos = start + 9;
      } else {
        newText = messageText.substring(0, start) + `<${tag}></${tag}>` + messageText.substring(end);
        cursorPos = start + tag.length + 2;
      }
    }

    setMessageText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    }, 0);
  };

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">Create Broadcast</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Send a message to all active users
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Formatting buttons */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Formatting</Label>
            <div className="flex flex-wrap gap-1">
              {FORMATTING_HINTS.map((hint) => (
                <Button
                  key={hint.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs sm:h-8 sm:px-3 sm:text-sm"
                  onClick={() => insertFormatting(hint.syntax)}
                  title={hint.title}
                >
                  {hint.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Message text */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label htmlFor="message" className="text-xs sm:text-sm">Message</Label>
            <Textarea
              ref={textareaRef}
              id="message"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Enter your message..."
              rows={5}
              className="font-mono text-xs sm:text-sm"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              HTML: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;s&gt;, &lt;code&gt;, &lt;a href=&quot;&quot;&gt;
            </p>
          </div>

          {/* Media selection */}
          <div className="space-y-1.5 sm:space-y-2">
            <Label className="text-xs sm:text-sm">Media (optional)</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <Icons.upload className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                {file ? 'Change' : 'Attach'}
              </Button>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearFile}
                  className="h-8 w-8 sm:h-9 sm:w-9"
                >
                  <Icons.close className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground p-2 bg-muted rounded">
                {mediaType === 'image' && <Icons.image className="h-3 w-3 sm:h-4 sm:w-4" />}
                {mediaType === 'video' && <Icons.video className="h-3 w-3 sm:h-4 sm:w-4" />}
                {mediaType === 'audio' && <Icons.audio className="h-3 w-3 sm:h-4 sm:w-4" />}
                {mediaType === 'file' && <Icons.file className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span className="truncate flex-1">{file.name}</span>
                <span className="shrink-0">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
              </div>
            )}
          </div>

          {/* Content type selector (when no file) */}
          {!file && (
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-xs sm:text-sm">Content Type</Label>
              <Select
                value={mediaType}
                onValueChange={(value) => setMediaType(value as MediaType)}
              >
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Text Only</SelectItem>
                  <SelectItem value="image">Image (URL)</SelectItem>
                  <SelectItem value="video">Video (URL)</SelectItem>
                  <SelectItem value="audio">Audio (URL)</SelectItem>
                  <SelectItem value="file">File (URL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={isLoading || (!messageText && !file)}
            className="w-full h-9 sm:h-10 text-sm"
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Icons.broadcasts className="mr-2 h-4 w-4" />
                Create Broadcast
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
