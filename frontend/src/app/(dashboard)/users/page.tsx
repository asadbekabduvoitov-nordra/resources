'use client';

import { useState, useCallback } from 'react';
import { User, UserStatus } from '@/types';
import { useUsers } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PageHeader,
  Icons,
  PageLoading,
  EmptyState,
  ConfirmDialog,
  Pagination,
} from '@/components/common';
import { UserTable, SendMessageDialog } from '@/components/users';
import { useDebounce } from '@/lib/hooks/use-debounce';

export default function UsersPage() {
  const {
    users,
    pagination,
    stats,
    isLoading,
    queryParams,
    goToPage,
    setSearch,
    setStatus,
    setLimit,
    refetch,
    blockUser,
    unblockUser,
    sendMessage,
    deleteUser,
  } = useUsers();

  const [searchInput, setSearchInput] = useState('');
  const [messageUser, setMessageUser] = useState<User | null>(null);
  const [blockingUser, setBlockingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce search
  const debouncedSearch = useCallback(
    (value: string) => {
      setSearch(value);
    },
    [setSearch]
  );

  useDebounce(searchInput, 300, debouncedSearch);

  const handleBlock = async () => {
    if (!blockingUser) return;

    setIsSubmitting(true);
    try {
      if (blockingUser.is_blocked) {
        await unblockUser(blockingUser.id);
      } else {
        await blockUser(blockingUser.id);
      }
      setBlockingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (userId: string, message: string) => {
    setIsSubmitting(true);
    try {
      await sendMessage(userId, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    setIsSubmitting(true);
    try {
      await deleteUser(deletingUser.id);
      setDeletingUser(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && users.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Users"
        description="Manage your bot users"
      >
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading}>
          {isLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.spinner className="mr-2 h-4 w-4" />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
            <div className="text-xl sm:text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">Active</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.active.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">Blocked</div>
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {stats.blocked.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="text-xs sm:text-sm text-muted-foreground">Inactive</div>
            <div className="text-xl sm:text-2xl font-bold text-muted-foreground">
              {stats.inactive.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.total === 0 ? (
        <EmptyState
          title="No users yet"
          description="Users will appear here when they start using your bot."
          icon="users"
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="relative flex-1">
              <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={queryParams.status || 'all'}
              onValueChange={(value) => setStatus(value as UserStatus)}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading overlay for subsequent loads */}
          <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
            {/* Table */}
            {users.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 sm:p-8 text-center">
                <p className="text-muted-foreground">
                  No users match your filters.
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                    setStatus('all');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <UserTable
                  users={users}
                  onBlock={setBlockingUser}
                  onUnblock={setBlockingUser}
                  onSendMessage={setMessageUser}
                  onDelete={setDeletingUser}
                />

                {/* Pagination */}
                <div className="mt-4">
                  <Pagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                    hasNext={pagination.hasNext}
                    hasPrev={pagination.hasPrev}
                    onPageChange={goToPage}
                    onLimitChange={setLimit}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Send Message Dialog */}
      <SendMessageDialog
        open={!!messageUser}
        onOpenChange={(open) => !open && setMessageUser(null)}
        user={messageUser}
        onSend={handleSendMessage}
        isLoading={isSubmitting}
      />

      {/* Block/Unblock Confirmation */}
      <ConfirmDialog
        open={!!blockingUser}
        onOpenChange={(open) => !open && setBlockingUser(null)}
        title={blockingUser?.is_blocked ? 'Unblock User' : 'Block User'}
        description={
          blockingUser?.is_blocked
            ? `Are you sure you want to unblock ${blockingUser?.first_name || 'this user'}?`
            : `Are you sure you want to block ${blockingUser?.first_name || 'this user'}?`
        }
        confirmLabel={blockingUser?.is_blocked ? 'Unblock' : 'Block'}
        variant={blockingUser?.is_blocked ? 'default' : 'destructive'}
        onConfirm={handleBlock}
        isLoading={isSubmitting}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deletingUser?.first_name || 'this user'}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
