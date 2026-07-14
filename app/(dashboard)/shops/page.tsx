'use client';

import { useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageLoader } from '@/components/ui/PageLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useShops, useCreateShop, useUpdateShop } from '@/lib/hooks/useShops';
import { useAuth } from '@/lib/hooks/useAuth';
import { Store } from 'lucide-react';
import type { Shop } from '@/shared/types/shop';

export default function ShopsPage() {
  const { isAdmin } = useAuth();
  const { data: shops, isLoading, error, refetch } = useShops();
  const createShop = useCreateShop();
  const updateShop = useUpdateShop();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Shop | null>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');

  const openAdd = () => {
    setEditing(null);
    setName('');
    setLocation('');
    setDialogOpen(true);
  };

  const openEdit = (shop: Shop) => {
    setEditing(shop);
    setName(shop.name);
    setLocation(shop.location ?? '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateShop.mutateAsync({
          id: editing.id,
          data: { name, location: location || undefined },
        });
        toast.success('Shop updated');
      } else {
        await createShop.mutateAsync({
          name,
          location: location || undefined,
        });
        toast.success('Shop created');
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save shop');
    }
  };

  const toggleActive = async (shop: Shop) => {
    try {
      await updateShop.mutateAsync({
        id: shop.id,
        data: { isActive: !shop.isActive },
      });
      toast.success(shop.isActive ? 'Shop deactivated' : 'Shop activated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update shop');
    }
  };

  return (
    <div>
      <PageHeader title="Shops">
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Shop
          </Button>
        )}
      </PageHeader>

      {isLoading ? (
        <PageLoader />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-danger mb-4">Failed to load shops</p>
          <Button onClick={() => refetch()}>Retry</Button>
        </div>
      ) : !shops?.length ? (
        <EmptyState
          icon={Store}
          title="No shops yet"
          description="Add shop locations to dispatch stock to."
          action={
            isAdmin ? (
              <Button onClick={openAdd}>Add Shop</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shops.map((shop) => (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell className="text-foreground-secondary">
                    {shop.location ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={shop.isActive ? 'success' : 'default'}>
                      {shop.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(shop)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(shop)}
                      >
                        {shop.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Shop' : 'Add Shop'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shop-name">Name *</Label>
              <Input
                id="shop-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shop-location">Location</Label>
              <Input
                id="shop-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name || createShop.isPending || updateShop.isPending}
            >
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
