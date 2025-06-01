
"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Globe, Bell, Percent, Loader2, Mail } from "lucide-react"; // Added Mail icon
import { getStoreSettingsAction, updateStoreSettingsAction } from './actions';
import type { StoreSettings } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";

const initialSettings: StoreSettings = {
  taxRate: 0,
  currencySymbol: 'Rs.',
  pricesIncludeTax: false,
  adminEmail: '', // Added adminEmail
  notifications: {
    lowStockEmail: false,
    lowStockSms: false,
    dailySalesEmail: false,
    weeklySalesEmail: false,
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingTax, startSavingTaxTransition] = useTransition();
  const [isSavingNotifications, startSavingNotificationsTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      const fetchedSettings = await getStoreSettingsAction();
      if (fetchedSettings) {
        setSettings(prev => ({
          ...initialSettings,
          ...prev,
          ...fetchedSettings,
          adminEmail: fetchedSettings.adminEmail || initialSettings.adminEmail, // Ensure adminEmail is handled
          notifications: {
            ...initialSettings.notifications,
            ...(fetchedSettings.notifications || {}),
          }
        }));
      } else {
        setSettings(initialSettings);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleInputChange = (section: keyof StoreSettings | `notifications.${keyof NonNullable<StoreSettings['notifications']>}`, value: any) => {
    setSettings(prev => {
      if (section.startsWith('notifications.')) {
        const notifKey = section.split('.')[1] as keyof NonNullable<StoreSettings['notifications']>;
        return {
          ...prev,
          notifications: {
            ...(prev.notifications || initialSettings.notifications),
            [notifKey]: value,
          }
        };
      }
      // Directly handle top-level settings like adminEmail
      if (section === 'adminEmail' || section === 'taxRate' || section === 'currencySymbol' || section === 'pricesIncludeTax') {
         return { ...prev, [section]: value };
      }
      return { ...prev, [section]: value }; // Fallback for other top-level keys
    });
  };

  const handleSaveTaxSettings = () => {
    startSavingTaxTransition(async () => {
      const { taxRate, currencySymbol, pricesIncludeTax } = settings;
      const result = await updateStoreSettingsAction({ taxRate, currencySymbol, pricesIncludeTax });
      if ('error' in result) {
        toast({ title: "Error Saving Settings", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Tax & Currency Settings Saved", description: "Your changes have been saved." });
        if(result) setSettings(s => ({...s, ...result}));
      }
    });
  };
  
  const handleSaveNotificationSettings = () => {
    startSavingNotificationsTransition(async () => {
      const { notifications, adminEmail } = settings; // Include adminEmail
      const result = await updateStoreSettingsAction({ notifications, adminEmail }); // Pass adminEmail
      if ('error'in result) {
        toast({ title: "Error Saving Settings", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Notification Settings Saved", description: "Your changes have been saved." });
         if(result) setSettings(s => ({...s, ...result}));
      }
    });
  };
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Settings" description="Configure application settings and preferences." />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Percent className="mr-2 h-5 w-5 text-primary" />Tax & Currency</CardTitle>
            <CardDescription>Set up tax rates and currency for your store.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
              <Input 
                id="tax-rate" 
                type="number" 
                placeholder="e.g., 10 for 10%" 
                value={settings.taxRate ?? ''}
                onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
                disabled={isSavingTax}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency-symbol">Currency Symbol</Label>
              <Input 
                id="currency-symbol" 
                placeholder="e.g., Rs." 
                value={settings.currencySymbol ?? ''}
                onChange={(e) => handleInputChange('currencySymbol', e.target.value)}
                disabled={isSavingTax}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prices-include-tax" 
                checked={settings.pricesIncludeTax ?? false}
                onCheckedChange={(checked) => handleInputChange('pricesIncludeTax', checked as boolean)}
                disabled={isSavingTax}
              />
              <Label htmlFor="prices-include-tax" className="text-sm font-normal">
                All product prices include tax
              </Label>
            </div>
             <Button className="mt-2" onClick={handleSaveTaxSettings} disabled={isSavingTax}>
               {isSavingTax && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Save Tax & Currency
             </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Bell className="mr-2 h-5 w-5 text-primary" />Notification Settings</CardTitle>
            <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="admin-email" className="flex items-center"><Mail className="mr-2 h-4 w-4" /> Admin Email for Notifications</Label>
              <Input 
                id="admin-email" 
                type="email" 
                placeholder="admin@example.com" 
                value={settings.adminEmail ?? ''}
                onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                disabled={isSavingNotifications}
              />
            </div>
            <Separator />
            <h3 className="text-md font-medium">Low Stock Alerts:</h3>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-low-stock" 
                checked={settings.notifications?.lowStockEmail ?? false}
                onCheckedChange={(checked) => handleInputChange('notifications.lowStockEmail', checked as boolean)}
                disabled={isSavingNotifications}
              />
              <Label htmlFor="email-low-stock" className="text-sm font-normal">
                Receive email notifications for low stock items
              </Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox 
                id="sms-low-stock" 
                checked={settings.notifications?.lowStockSms ?? false}
                onCheckedChange={(checked) => handleInputChange('notifications.lowStockSms', checked as boolean)}
                disabled={isSavingNotifications}
              />
              <Label htmlFor="sms-low-stock" className="text-sm font-normal">
                Receive SMS notifications for low stock items (requires SMS setup)
              </Label>
            </div>
            <Separator />
            <h3 className="text-md font-medium">Sales Reports:</h3>
             <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-daily-sales" 
                checked={settings.notifications?.dailySalesEmail ?? false}
                onCheckedChange={(checked) => handleInputChange('notifications.dailySalesEmail', checked as boolean)}
                disabled={isSavingNotifications}
              />
              <Label htmlFor="email-daily-sales" className="text-sm font-normal">
                Email daily sales summary
              </Label>
            </div>
             <div className="flex items-center space-x-2">
              <Checkbox 
                id="email-weekly-sales" 
                checked={settings.notifications?.weeklySalesEmail ?? false}
                onCheckedChange={(checked) => handleInputChange('notifications.weeklySalesEmail', checked as boolean)}
                disabled={isSavingNotifications}
              />
              <Label htmlFor="email-weekly-sales" className="text-sm font-normal">
                Email weekly sales summary
              </Label>
            </div>
            <Button className="mt-2" onClick={handleSaveNotificationSettings} disabled={isSavingNotifications}>
              {isSavingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Notifications
            </Button>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center"><Globe className="mr-2 h-5 w-5 text-primary" />Regional Settings</CardTitle>
                <CardDescription>Configure language, timezone and other regional preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" placeholder="e.g. English (US)" disabled value="English (US)"/>
                    <p className="text-xs text-muted-foreground">Language settings are currently not customizable.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" placeholder="e.g. UTC (Server Default)" disabled value="UTC (Server Default)"/>
                     <p className="text-xs text-muted-foreground">Timezone is currently set to server default (likely UTC).</p>
                </div>
                 <Button className="mt-2" disabled>Save Regional Settings</Button>
            </CardContent>
        </Card>
      </div>
    </>
  );
}

