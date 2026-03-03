'use client';

import { useState } from 'react';
import { PageHeader, Loading } from '@/components/common';
import { BroadcastForm, BroadcastTable } from '@/components/broadcasts';
import { useBroadcasts } from '@/lib/hooks';
import { CreateBroadcastInput } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/common';

export default function BroadcastsPage() {
  const {
    broadcasts,
    isLoading,
    hasActiveBroadcast,
    activeBroadcasts,
    createBroadcast,
    startBroadcast,
    cancelBroadcast,
    deleteBroadcast,
  } = useBroadcasts();

  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = async (data: CreateBroadcastInput, file?: File) => {
    setIsCreating(true);
    try {
      await createBroadcast(data, file);
      setShowForm(false); // Hide form on mobile after creation
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  // Calculate totals from active broadcasts
  const activeTotals = activeBroadcasts.reduce(
    (acc, b) => ({
      total: acc.total + b.total_users,
      sent: acc.sent + b.sent_count,
      failed: acc.failed + b.failed_count,
    }),
    { total: 0, sent: 0, failed: 0 }
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Broadcasts"
        description="Send messages to all bot users"
      >
        {/* Mobile: Toggle form button */}
        <Button
          className="lg:hidden"
          onClick={() => setShowForm(!showForm)}
        >
          <Icons.add className="mr-2 h-4 w-4" />
          {showForm ? 'Hide Form' : 'New Broadcast'}
        </Button>
      </PageHeader>

      {/* Active Broadcast Banner */}
      {hasActiveBroadcast && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-3 sm:py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Icons.spinner className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
                <span className="font-medium text-sm sm:text-base">
                  {activeBroadcasts.length} broadcast{activeBroadcasts.length > 1 ? 's' : ''} sending
                </span>
              </div>
              <div className="flex-1" />
              <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium">{activeTotals.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-green-600">Sent: </span>
                  <span className="font-medium text-green-600">
                    {activeTotals.sent.toLocaleString()}
                  </span>
                </div>
                {activeTotals.failed > 0 && (
                  <div>
                    <span className="text-destructive">Failed: </span>
                    <span className="font-medium text-destructive">
                      {activeTotals.failed.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main content - Responsive grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
        {/* Create Form - Collapsible on mobile */}
        <div className={`${showForm ? 'block' : 'hidden'} lg:block`}>
          <BroadcastForm onSubmit={handleCreate} isLoading={isCreating} />
        </div>

        {/* Broadcasts Table */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-medium">Broadcast History</h3>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {broadcasts.length} total
            </span>
          </div>
          <BroadcastTable
            broadcasts={broadcasts}
            onStart={startBroadcast}
            onCancel={cancelBroadcast}
            onDelete={deleteBroadcast}
          />
        </div>
      </div>
    </div>
  );
}
