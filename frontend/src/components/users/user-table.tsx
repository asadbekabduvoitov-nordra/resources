'use client';

import { User } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/common';
import { formatDistanceToNow } from 'date-fns';

interface UserTableProps {
  users: User[];
  onBlock: (user: User) => void;
  onUnblock: (user: User) => void;
  onSendMessage: (user: User) => void;
  onDelete: (user: User) => void;
}

export function UserTable({
  users,
  onBlock,
  onUnblock,
  onSendMessage,
  onDelete,
}: UserTableProps) {
  const getDisplayName = (user: User) => {
    const parts = [user.first_name, user.last_name].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Unknown';
  };

  const getStatusBadge = (user: User) => {
    if (user.is_blocked) {
      return <Badge variant="destructive">Blocked</Badge>;
    }
    if (user.is_active) {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  const UserActions = ({ user }: { user: User }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Icons.more className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onSendMessage(user)}
          disabled={user.is_blocked}
        >
          <Icons.broadcasts className="mr-2 h-4 w-4" />
          Send Message
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {user.is_blocked ? (
          <DropdownMenuItem onClick={() => onUnblock(user)}>
            <Icons.check className="mr-2 h-4 w-4" />
            Unblock User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onBlock(user)}>
            <Icons.close className="mr-2 h-4 w-4" />
            Block User
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onDelete(user)}
          className="text-destructive focus:text-destructive"
        >
          <Icons.delete className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Mobile card view
  const MobileUserCard = ({ user }: { user: User }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
              {user.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{getDisplayName(user)}</p>
              {user.username && (
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
              )}
            </div>
          </div>
          <UserActions user={user} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">ID: </span>
            <code className="text-xs">{user.telegram_id}</code>
          </div>
          <div className="text-right">
            {getStatusBadge(user)}
          </div>
          <div className="text-muted-foreground">
            <span>Last active: </span>
            {user.last_active_at
              ? formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })
              : 'Never'}
          </div>
          <div className="text-right text-muted-foreground">
            <span>Joined: </span>
            {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Mobile view */}
      <div className="md:hidden space-y-1">
        {users.map((user) => (
          <MobileUserCard key={user.id} user={user} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">User</TableHead>
              <TableHead className="min-w-[120px]">Telegram ID</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[130px]">Last Active</TableHead>
              <TableHead className="min-w-[130px]">Joined</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {user.first_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{getDisplayName(user)}</p>
                      {user.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code className="text-sm">{user.telegram_id}</code>
                </TableCell>
                <TableCell>
                  {getStatusBadge(user)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.last_active_at
                    ? formatDistanceToNow(new Date(user.last_active_at), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <UserActions user={user} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
