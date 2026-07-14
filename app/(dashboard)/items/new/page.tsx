'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { BatchAddTable } from '@/components/items/BatchAddTable';
import { Button } from '@/components/ui/button';
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
        subtitle="Knock out a list of names. Details can wait."
      >
        <Button variant="ghost" asChild>
          <Link href="/items">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      </PageHeader>
      <BatchAddTable />
    </div>
  );
}
