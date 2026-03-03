'use client';

import { Resource } from '@/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/common';
import { formatDistanceToNow } from 'date-fns';

interface ResourceTableProps {
  resources: Resource[];
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onToggleActive: (resource: Resource) => void;
}

const mediaTypeConfig = {
  image: { icon: Icons.image, label: 'Image' },
  video: { icon: Icons.video, label: 'Video' },
  file: { icon: Icons.file, label: 'File' },
  none: { icon: Icons.none, label: 'Text' },
};

export function ResourceTable({
  resources,
  onEdit,
  onDelete,
  onToggleActive,
}: ResourceTableProps) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="min-w-[80px]">Type</TableHead>
            <TableHead className="min-w-[90px]">Status</TableHead>
            <TableHead className="min-w-[120px]">Created</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => {
            const mediaConfig = mediaTypeConfig[resource.media_type];
            const MediaIcon = mediaConfig.icon;

            return (
              <TableRow key={resource.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <MediaIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{resource.title}</p>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {resource.description}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{mediaConfig.label}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={resource.is_active ? 'default' : 'secondary'}
                  >
                    {resource.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDistanceToNow(new Date(resource.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Icons.more className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(resource)}>
                        <Icons.edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onToggleActive(resource)}>
                        {resource.is_active ? (
                          <>
                            <Icons.hide className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Icons.view className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(resource)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Icons.delete className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
