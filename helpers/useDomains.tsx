import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Domain {
  id: number;
  domain: string;
  status: 'pending' | 'verified' | 'failed' | 'suspended';
  createdAt: string;
  verifiedAt?: string;
  sslEnabled: boolean;
  sslStatus: 'none' | 'pending' | 'active' | 'expired';
  isActive: boolean;
  storeUrl: string;
  dnsInstructions: {
    cname: {
      type: string;
      host: string;
      value: string;
      configured: boolean;
    };
    txt: {
      type: string;
      host: string;
      value: string;
      configured: boolean;
    };
  };
}

interface AddDomainData {
  domain: string;
}

interface VerifyDomainData {
  domainId: number;
}

export const useDomains = () => {
  return useQuery({
    queryKey: ['domains'],
    queryFn: async () => {
      const response = await fetch('/api/domains');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch domains');
      }
      
      return data.domains as Domain[];
    },
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
};

export const useAddDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddDomainData) => {
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to add domain');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
};

export const useVerifyDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VerifyDomainData) => {
      const response = await fetch('/api/domains/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || result.error || 'Failed to verify domain');
      }

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
};

export const useDeleteDomain = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (domainId: number) => {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete domain');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domains'] });
    },
  });
};
