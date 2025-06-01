
"use client";

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { DataTable } from "@/components/shared/data-table";
import { type Product } from "@/lib/types";
import { getProductsAction, addProductAction, updateProductAction, deleteProductAction } from './actions';
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [currencySymbol] = useState('Rs.'); 

  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // In a more complex app, settings (like currency symbol) might come from a context or store.
  // useEffect(() => {
  //   async function fetchSettings() {
  //     const settings = await getStoreSettingsAction(); // Assuming you have such an action
  //     if (settings && settings.currencySymbol) {
  //       setCurrencySymbol(settings.currencySymbol);
  //     }
  //   }
  //   fetchSettings();
  // }, []);

  const fetchProducts = async () => {
    setIsLoadingData(true);
    try {
      const fetchedProducts = await getProductsAction();
      setAllProducts(fetchedProducts);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast({ title: "Error", description: "Could not fetch products.", variant: "destructive" });
      setAllProducts([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const uniqueCategoriesForFilter = useMemo(() => {
    const categories = new Set(allProducts.map(p => p.category));
    return ["All Categories", ...Array.from(categories).sort()];
  }, [allProducts]);

  const uniqueCategoriesForForm = useMemo(() => {
    const categories = new Set(allProducts.map(p => p.category).filter(c => c.trim() !== ''));
    return Array.from(categories).sort();
  }, [allProducts]);


  const displayedProducts = useMemo(() => {
    return allProducts
      .filter(product =>
        product.name.toLowerCase().includes(nameFilter.toLowerCase())
      )
      .filter(product =>
        categoryFilter === "All Categories" || categoryFilter === "" || product.category === categoryFilter
      );
  }, [allProducts, nameFilter, categoryFilter]);

  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
    startTransition(async () => {
      const result = await addProductAction(productData);
      if ('error' in result) {
        toast({ title: "Error Adding Product", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Product Added", description: `${result.name} has been added.` });
        fetchProducts(); // Re-fetch to get the latest list including the new ID
        setIsDialogOpen(false);
      }
    });
  };

  const handleEditProduct = (product: Product) => {
     const { id, ...productData } = product;
    startTransition(async () => {
      const result = await updateProductAction(id, productData);
      if ('error'in result) {
        toast({ title: "Error Updating Product", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Product Updated", description: `${result.name} has been updated.` });
        setAllProducts(prev => prev.map(p => p.id === result.id ? result : p));
        setEditingProduct(null);
        setIsDialogOpen(false);
      }
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const productName = allProducts.find(p => p.id === productId)?.name;
    startTransition(async () => {
      const result = await deleteProductAction(productId);
      if (!result.success) {
        toast({ title: "Error Deleting Product", description: result.error || "Could not delete product.", variant: "destructive" });
      } else {
        toast({ title: "Product Deleted", description: `${productName || 'Product'} has been deleted.`, variant: "destructive" });
        setAllProducts(prev => prev.filter(p => p.id !== productId));
      }
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => {
        const product = row.original;
        return product.image ? (
          <Image src={product.image} alt={product.name} width={40} height={40} className="rounded" data-ai-hint={product['data-ai-hint'] || 'product image'} />
        ) : <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-xs">No Img</div>;
      },
    },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => `${currencySymbol} ${Number(row.original.price).toFixed(2)}`
    },
    {
      accessorKey: "stock",
      header: "Stock",
      cell: ({ row }) => {
        const stock = Number(row.original.stock);
        return (
          <Badge variant={stock < 10 ? "destructive" : stock < 50 ? "secondary" : "default"}>
            {stock}
          </Badge>
        );
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => openEditDialog(product)} disabled={isPending}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={() => handleDeleteProduct(product.id)} disabled={isPending && editingProduct?.id !== product.id}>
              {isPending && editingProduct?.id !== product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
        <p className="ml-2">Loading products...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Products" description="Manage your product catalog.">
        <Button onClick={openAddDialog} disabled={isPending}>
          {isPending && !editingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Add Product
        </Button>
      </PageHeader>

      <div className="flex items-center py-4 gap-4">
        <Input
          placeholder="Filter products by name..."
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="max-w-sm h-10"
          disabled={isPending}
        />
        <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value === "All Categories" ? "" : value)} disabled={isPending}>
          <SelectTrigger className="w-[200px] h-10">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {uniqueCategoriesForFilter.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={displayedProducts} filterColumnId='name'/>

      <ProductFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        product={editingProduct}
        onSave={editingProduct ? handleEditProduct : (data) => handleAddProduct(data as Omit<Product, 'id'>)}
        isPending={isPending}
        availableCategories={uniqueCategoriesForForm}
      />
    </>
  );
}

interface ProductFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  product: Product | null;
  onSave: (product: Product | Omit<Product, 'id'>) => void;
  isPending?: boolean;
  availableCategories: string[];
}

function ProductFormDialog({ isOpen, setIsOpen, product, onSave, isPending, availableCategories }: ProductFormDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [dataAiHint, setDataAiHint] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(String(product.price));
      setStock(String(product.stock));
      setDescription(product.description || '');
      setImage(product.image || '');
      setDataAiHint(product['data-ai-hint'] || '');
    } else if (isOpen && !product) {
      // Reset form for new product
      setName('');
      setCategory('');
      setPrice('');
      setStock('');
      setDescription('');
      setImage('');
      setDataAiHint('product new');
    }
  }, [product, isOpen]);

  const handleSubmit = () => {
    const numericPrice = parseFloat(price);
    const numericStock = parseInt(stock, 10);

    if (!name || !category) {
      toast({ title: "Validation Error", description: "Name and Category are required.", variant: "destructive" });
      return;
    }
    if (isNaN(numericPrice) || numericPrice < 0) {
      toast({ title: "Validation Error", description: "Price must be a non-negative number.", variant: "destructive" });
      return;
    }
    if (isNaN(numericStock) || numericStock < 0) {
       toast({ title: "Validation Error", description: "Stock must be a non-negative integer.", variant: "destructive" });
      return;
    }
    
    const productData = {
      name,
      category,
      price: numericPrice,
      stock: numericStock,
      description,
      image: image || `https://placehold.co/100x100.png`,
      'data-ai-hint': dataAiHint || name.split(' ').slice(0,2).join(' ').toLowerCase() || 'product item'
    };

    if (product && product.id) { // Editing existing product
      onSave({ ...productData, id: product.id });
    } else { // Adding new product
      onSave(productData); 
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of this product.' : 'Enter the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">Category</Label>
            <Select 
              value={category} 
              onValueChange={setCategory}
              disabled={isPending}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 && !category && (
                  <SelectItem value="new_category_placeholder" disabled>Enter category name below</SelectItem>
                )}
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
                 {/* If editing and current category is not in list, show it as an option */}
                {product && product.category && !availableCategories.includes(product.category) && (
                    <SelectItem key={product.category} value={product.category}>
                        {product.category} (current)
                    </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
           {/* Allow creating new category if no categories exist or if desired explicitly */}
           {availableCategories.length === 0 || !availableCategories.includes(category) ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-category" className="text-right">New Category</Label>
              <Input 
                id="new-category" 
                value={category} // Bind to the same category state
                onChange={(e) => setCategory(e.target.value)} 
                className="col-span-3" 
                placeholder="Or type a new category"
                disabled={isPending} 
              />
            </div>
          ) : null}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">Price</Label>
            <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">Stock</Label>
            <Input id="stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" disabled={isPending} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">Image URL</Label>
            <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} className="col-span-3" placeholder="https://placehold.co/100x100.png" disabled={isPending}/>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dataAiHint" className="text-right">AI Hint</Label>
            <Input id="dataAiHint" value={dataAiHint} onChange={(e) => setDataAiHint(e.target.value)} className="col-span-3" placeholder="e.g. fruit apple" disabled={isPending}/>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Product
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

