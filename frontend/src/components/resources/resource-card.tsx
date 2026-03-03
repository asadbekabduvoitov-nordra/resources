'use client';

import { Resource } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ResourceCardProps {
  resource: Resource;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  onToggleActive: (resource: Resource) => void;
}

const mediaTypeConfig = {
  image: { icon: Icons.image, label: 'Image', color: 'bg-blue-500' },
  video: { icon: Icons.video, label: 'Video', color: 'bg-purple-500' },
  file: { icon: Icons.file, label: 'File', color: 'bg-orange-500' },
  none: { icon: Icons.none, label: 'Text', color: 'bg-gray-500' },
};

export function ResourceCard({
  resource,
  onEdit,
  onDelete,
  onToggleActive,
}: ResourceCardProps) {
  const mediaConfig = mediaTypeConfig[resource.media_type];
  const MediaIcon = mediaConfig.icon;

  return (
    <Card className="group relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${mediaConfig.color} text-white`}
            >
              <MediaIcon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base line-clamp-1">
                {resource.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(resource.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>

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
        </div>
      </CardHeader>

      <CardContent>
        {resource.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No description
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Badge variant={resource.is_active ? 'default' : 'secondary'}>
            {resource.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="outline">{mediaConfig.label}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
