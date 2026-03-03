'use client';

import { useState } from 'react';
import { Resource, CreateResourceInput } from '@/types';
import { useResources } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  PageHeader,
  Icons,
  PageLoading,
  EmptyState,
  ConfirmDialog,
} from '@/components/common';
import {
  ResourceCard,
  ResourceForm,
  ResourceTable,
} from '@/components/resources';

export default function ResourcesPage() {
  const {
    resources,
    isLoading,
    createResource,
    updateResource,
    deleteResource,
    toggleActive,
  } = useResources();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    setEditingResource(null);
    setIsFormOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: CreateResourceInput, file?: File) => {
    setIsSubmitting(true);
    try {
      if (editingResource) {
        await updateResource(editingResource.id, data, file);
      } else {
        await createResource(data, file);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingResource) return;

    setIsSubmitting(true);
    try {
      await deleteResource(deletingResource.id);
      setDeletingResource(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (resource: Resource) => {
    await toggleActive(resource.id);
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Resources"
        description="Manage bot resources and content"
      >
        <Button onClick={handleCreate} size="sm">
          <Icons.add className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Add Resource</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </PageHeader>

      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Create your first resource to share with bot users."
          icon="resources"
          action={{
            label: 'Add Resource',
            onClick: handleCreate,
          }}
        />
      ) : (
        <Tabs defaultValue="grid" className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="grid" className="text-sm">Grid</TabsTrigger>
            <TabsTrigger value="table" className="text-sm">Table</TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onEdit={handleEdit}
                  onDelete={setDeletingResource}
                  onToggleActive={handleToggleActive}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <ResourceTable
              resources={resources}
              onEdit={handleEdit}
              onDelete={setDeletingResource}
              onToggleActive={handleToggleActive}
            />
          </TabsContent>
        </Tabs>
      )}

      <ResourceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        resource={editingResource}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
      />

      <ConfirmDialog
        open={!!deletingResource}
        onOpenChange={(open) => !open && setDeletingResource(null)}
        title="Delete Resource"
        description={`Are you sure you want to delete "${deletingResource?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={isSubmitting}
      />
    </div>
  );
}
