
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import type { Branch } from "@/lib/types";
import { getBranchesAction, addBranchAction, updateBranchAction, deleteBranchAction } from './actions';
import { type ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const fetchBranches = async () => {
    setIsLoadingData(true);
    try {
      const fetchedBranches = await getBranchesAction();
      setBranches(fetchedBranches);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      toast({ title: "Error", description: "Could not fetch branches.", variant: "destructive" });
      setBranches([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddBranch = (branchData: Omit<Branch, 'id'>) => {
    startTransition(async () => {
      const result = await addBranchAction(branchData);
      if ('error' in result) {
        toast({ title: "Error Adding Branch", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Branch Added", description: `${result.name} has been added.` });
        setBranches(prev => [result, ...prev]); // Optimistically update or re-fetch
        setIsDialogOpen(false);
      }
    });
  };

  const handleEditBranch = (branch: Branch) => {
    const { id, ...branchData } = branch;
    startTransition(async () => {
      const result = await updateBranchAction(id, branchData);
      if ('error' in result) {
        toast({ title: "Error Updating Branch", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Branch Updated", description: `${result.name} has been updated.` });
        setBranches(prev => prev.map(b => b.id === result.id ? result : b));
        setEditingBranch(null);
        setIsDialogOpen(false);
      }
    });
  };
  
  const handleDeleteBranch = (branchId: string) => {
    const branchName = branches.find(b => b.id === branchId)?.name;
    startTransition(async () => {
      const result = await deleteBranchAction(branchId);
      if (!result.success) {
        toast({ title: "Error Deleting Branch", description: result.error || "Could not delete branch.", variant: "destructive" });
      } else {
        toast({ title: "Branch Deleted", description: `${branchName || 'Branch'} has been deleted.`, variant: "destructive" });
        setBranches(prev => prev.filter(b => b.id !== branchId));
      }
    });
  };

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingBranch(null);
    setIsDialogOpen(true);
  }

  const columns: ColumnDef<Branch>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "location", header: "Location" },
    { accessorKey: "size", header: "Size" },
    { accessorKey: "manager", header: "Manager" },
    {
      id: "actions",
      cell: ({ row }) => {
        const branch = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => openEditDialog(branch)} disabled={isPending}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => handleDeleteBranch(branch.id)} disabled={isPending}>
               {isPending && editingBranch?.id !== branch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
          </div>
        );
      },
    },
  ];

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading branches...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Branches" description="Manage your store branches.">
        <Button onClick={openAddDialog} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Add Branch
        </Button>
      </PageHeader>
      <DataTable columns={columns} data={branches} filterColumnId="name" filterPlaceholder="Filter branches by name..." />

      <BranchFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        branch={editingBranch}
        onSave={editingBranch ? handleEditBranch : (data) => handleAddBranch(data as Omit<Branch, 'id'>)}
        isPending={isPending}
      />
    </>
  );
}

interface BranchFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  branch: Branch | null;
  onSave: (branch: Branch | Omit<Branch, 'id'>) => void;
  isPending?: boolean;
}

function BranchFormDialog({ isOpen, setIsOpen, branch, onSave, isPending }: BranchFormDialogProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [size, setSize] = useState('');
  const [manager, setManager] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && branch) {
      setName(branch.name);
      setLocation(branch.location);
      setSize(branch.size);
      setManager(branch.manager || '');
    } else if (isOpen && !branch) {
      setName('');
      setLocation('');
      setSize('');
      setManager('');
    }
  }, [branch, isOpen]);

  const handleSubmit = () => {
     if (!name || !location || !size) {
      toast({title: "Validation Error", description: "Name, Location and Size are required.", variant: "destructive"});
      return;
    }
    const branchData = { name, location, size, manager };
    if (branch && branch.id) {
      onSave({ ...branchData, id: branch.id });
    } else {
      onSave(branchData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{branch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
          <DialogDescription>
            {branch ? 'Update branch details.' : 'Enter details for the new branch.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch-name" className="text-right">Name</Label>
            <Input id="branch-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch-location" className="text-right">Location</Label>
            <Input id="branch-location" value={location} onChange={(e) => setLocation(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch-size" className="text-right">Size</Label>
            <Input id="branch-size" value={size} onChange={(e) => setSize(e.target.value)} className="col-span-3" placeholder="e.g., Small, Medium, Large or 1000sqm" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="branch-manager" className="text-right">Manager</Label>
            <Input id="branch-manager" value={manager} onChange={(e) => setManager(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Branch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
