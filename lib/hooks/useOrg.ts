'use client';

import { useQuery } from '@tanstack/react-query';
import * as orgsApi from '@/lib/api/orgs';

export function useOrg() {
  return useQuery({
    queryKey: ['org'],
    queryFn: () => orgsApi.getOrg(),
  });
}
