'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, Icons } from '@/components/common';
import { useStats } from '@/lib/hooks';

function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs sm:text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
        ) : (
          <div className="text-xl sm:text-2xl font-bold">{value.toLocaleString()}</div>
        )}
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { stats, isLoading, error, refetch } = useStats();

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your bot statistics"
      >
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          <span className="hidden sm:inline">Refresh</span>
          <Icons.spinner className={`sm:hidden h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 sm:p-4 text-destructive">
          <p className="text-xs sm:text-sm">Failed to load statistics: {error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Resources"
          value={stats?.totalResources ?? 0}
          description={`${stats?.activeResources ?? 0} active`}
          icon={Icons.resources}
          isLoading={isLoading}
        />

        <StatsCard
          title="Users"
          value={stats?.totalUsers ?? 0}
          description="Total registered"
          icon={Icons.users}
          isLoading={isLoading}
        />

        <StatsCard
          title="Active"
          value={stats?.activeUsers ?? 0}
          description={`${stats?.recentUsers ?? 0} this week`}
          icon={Icons.check}
          isLoading={isLoading}
        />

        <StatsCard
          title="Broadcasts"
          value={stats?.totalBroadcasts ?? 0}
          description="Total sent"
          icon={Icons.broadcasts}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start h-9 sm:h-10 text-sm" asChild>
              <a href="/resources">
                <Icons.add className="mr-2 h-4 w-4" />
                Add Resource
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-9 sm:h-10 text-sm" asChild>
              <a href="/users">
                <Icons.users className="mr-2 h-4 w-4" />
                View Users
              </a>
            </Button>
            <Button variant="outline" className="justify-start h-9 sm:h-10 text-sm" asChild>
              <a href="/broadcasts">
                <Icons.broadcasts className="mr-2 h-4 w-4" />
                Send Broadcast
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">Bot Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Channel</span>
              <span className="font-medium">@ANORAMAHKAMOVA1</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">API</span>
              <span className={`font-medium ${error ? 'text-red-600' : 'text-green-600'}`}>
                {error ? 'Disconnected' : 'Connected'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
