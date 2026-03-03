'use client';

import { useState } from 'react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icons } from '@/components/common';

interface SendMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSend: (userId: string, message: string) => Promise<void>;
  isLoading?: boolean;
}

export function SendMessageDialog({
  open,
  onOpenChange,
  user,
  onSend,
  isLoading,
}: SendMessageDialogProps) {
  const [message, setMessage] = useState('');

  const getDisplayName = (user: User) => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !message.trim()) return;

    await onSend(user.id, message);
    setMessage('');
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMessage('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a direct message to{' '}
            <span className="font-medium">
              {user ? getDisplayName(user) : 'user'}
            </span>
            {user?.username && (
              <span className="text-muted-foreground"> (@{user.username})</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message here..."
              rows={5}
              required
            />
            <p className="text-xs text-muted-foreground">
              You can use HTML formatting: &lt;b&gt;bold&lt;/b&gt;,
              &lt;i&gt;italic&lt;/i&gt;, &lt;code&gt;code&lt;/code&gt;
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !message.trim()}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Icons.broadcasts className="mr-2 h-4 w-4" />
              Send Message
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
