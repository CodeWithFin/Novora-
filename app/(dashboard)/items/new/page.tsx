'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BatchAddTable } from '@/components/items/BatchAddTable';
import { ExcelUploadPanel } from '@/components/items/ExcelUploadPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BatchAddPage() {
  const { isViewer } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isViewer) router.replace('/items');
  }, [isViewer, router]);

  return (
    <div>
      <PageHeader
        title="Add many products"
        subtitle="Type a list, or upload the same Excel sheets you already use for makeup and skincare."
      >
        <Button variant="ghost" asChild>
          <Link href="/items">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload spreadsheet</TabsTrigger>
          <TabsTrigger value="manual">Type them in</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          <ExcelUploadPanel />
        </TabsContent>
        <TabsContent value="manual">
          <BatchAddTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
