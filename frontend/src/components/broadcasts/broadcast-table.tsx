'use client';

import { Broadcast } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/common';
import { ConfirmDialog } from '@/components/common';
import { useState } from 'react';

interface BroadcastTableProps {
  broadcasts: Broadcast[];
  onStart: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG = {
  pending: { label: 'Pending', variant: 'secondary' as const, icon: Icons.pending },
  sending: { label: 'Sending', variant: 'default' as const, icon: Icons.spinner },
  completed: { label: 'Completed', variant: 'default' as const, icon: Icons.completed },
  failed: { label: 'Failed', variant: 'destructive' as const, icon: Icons.failed },
};

const MEDIA_ICONS = {
  image: Icons.image,
  video: Icons.video,
  audio: Icons.audio,
  file: Icons.file,
  none: Icons.none,
};

export function BroadcastTable({
  broadcasts,
  onStart,
  onCancel,
  onDelete,
}: BroadcastTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleStart = async (id: string) => {
    setActionLoading(id);
    try {
      await onStart(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await onCancel(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(deleteId);
    try {
      await onDelete(deleteId);
    } finally {
      setActionLoading(null);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string | null, maxLength: number) => {
    if (!text) return '-';
    const stripped = text.replace(/<[^>]*>/g, '');
    if (stripped.length <= maxLength) return stripped;
    return stripped.substring(0, maxLength) + '...';
  };

  const getProgress = (broadcast: Broadcast) => {
    if (broadcast.total_users === 0) return 0;
    return Math.round(
      ((broadcast.sent_count + broadcast.failed_count) / broadcast.total_users) * 100
    );
  };

  const getSuccessRate = (broadcast: Broadcast) => {
    const total = broadcast.sent_count + broadcast.failed_count;
    if (total === 0) return 0;
    return Math.round((broadcast.sent_count / total) * 100);
  };

  const getETA = (broadcast: Broadcast) => {
    if (broadcast.status !== 'sending') return null;
    const processed = broadcast.sent_count + broadcast.failed_count;
    const remaining = broadcast.total_users - processed;
    if (remaining <= 0) return null;
    const seconds = Math.ceil(remaining / 25);
    if (seconds < 60) return `~${seconds}s`;
    return `~${Math.ceil(seconds / 60)}m`;
  };

  const BroadcastActions = ({ broadcast }: { broadcast: Broadcast }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={actionLoading === broadcast.id}
        >
          {actionLoading === broadcast.id ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.more className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {broadcast.status === 'pending' && (
          <DropdownMenuItem onClick={() => handleStart(broadcast.id)}>
            <Icons.play className="mr-2 h-4 w-4" />
            Start Sending
          </DropdownMenuItem>
        )}
        {broadcast.status === 'sending' && (
          <DropdownMenuItem
            onClick={() => handleCancel(broadcast.id)}
            className="text-destructive"
          >
            <Icons.stop className="mr-2 h-4 w-4" />
            Cancel
          </DropdownMenuItem>
        )}
        {(broadcast.status === 'pending' ||
          broadcast.status === 'completed' ||
          broadcast.status === 'failed') && (
          <DropdownMenuItem
            onClick={() => setDeleteId(broadcast.id)}
            className="text-destructive"
          >
            <Icons.delete className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card view
  const MobileBroadcastCard = ({ broadcast }: { broadcast: Broadcast }) => {
    const StatusIcon = STATUS_CONFIG[broadcast.status].icon;
    const MediaIcon = MEDIA_ICONS[broadcast.media_type];
    const progress = getProgress(broadcast);
    const eta = getETA(broadcast);

    return (
      <Card className="mb-3">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {truncateText(broadcast.message_text, 40)}
              </p>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <MediaIcon className="h-3 w-3" />
                <span className="capitalize">{broadcast.media_type}</span>
                <span>•</span>
                <span>{formatDate(broadcast.created_at)}</span>
              </div>
            </div>
            <BroadcastActions broadcast={broadcast} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Badge variant={STATUS_CONFIG[broadcast.status].variant} className="text-xs">
              <StatusIcon
                className={`mr-1 h-3 w-3 ${broadcast.status === 'sending' ? 'animate-spin' : ''}`}
              />
              {STATUS_CONFIG[broadcast.status].label}
            </Badge>
            <div className="text-xs">
              <span className="text-green-600 font-medium">{broadcast.sent_count}</span>
              <span className="text-muted-foreground">/{broadcast.total_users}</span>
              {broadcast.failed_count > 0 && (
                <span className="text-destructive ml-1">({broadcast.failed_count} failed)</span>
              )}
            </div>
          </div>

          {broadcast.status === 'sending' && (
            <div className="mt-2">
              <div className="w-full bg-secondary rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{progress}%</span>
                {eta && <span>{eta} remaining</span>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (broadcasts.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
        No broadcasts yet. Create your first broadcast above.
      </div>
    );
  }

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden space-y-1">
        {broadcasts.map((broadcast) => (
          <MobileBroadcastCard key={broadcast.id} broadcast={broadcast} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Message</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[150px]">Progress</TableHead>
              <TableHead className="min-w-[120px]">Created</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {broadcasts.map((broadcast) => {
              const StatusIcon = STATUS_CONFIG[broadcast.status].icon;
              const MediaIcon = MEDIA_ICONS[broadcast.media_type];
              const progress = getProgress(broadcast);
              const successRate = getSuccessRate(broadcast);
              const eta = getETA(broadcast);

              return (
                <TableRow key={broadcast.id}>
                  <TableCell className="max-w-[300px]">
                    <div className="truncate" title={broadcast.message_text || ''}>
                      {truncateText(broadcast.message_text, 50)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MediaIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize text-sm">{broadcast.media_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_CONFIG[broadcast.status].variant}>
                      <StatusIcon
                        className={`mr-1 h-3 w-3 ${
                          broadcast.status === 'sending' ? 'animate-spin' : ''
                        }`}
                      />
                      {STATUS_CONFIG[broadcast.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[140px]">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">
                          {broadcast.sent_count.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          / {broadcast.total_users.toLocaleString()}
                        </span>
                      </div>
                      {broadcast.failed_count > 0 && (
                        <div className="text-xs text-destructive">
                          {broadcast.failed_count.toLocaleString()} failed
                        </div>
                      )}
                      {broadcast.status === 'sending' && (
                        <>
                          <div className="w-full bg-secondary rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progress}%</span>
                            {eta && <span>{eta}</span>}
                          </div>
                        </>
                      )}
                      {(broadcast.status === 'completed' || broadcast.status === 'failed') && (
                        <div className="text-xs text-muted-foreground">
                          {successRate}% success
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDate(broadcast.created_at)}</div>
                  </TableCell>
                  <TableCell>
                    <BroadcastActions broadcast={broadcast} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Broadcast"
        description="Are you sure you want to delete this broadcast? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={actionLoading === deleteId}
        variant="destructive"
      />
    </>
  );
}
