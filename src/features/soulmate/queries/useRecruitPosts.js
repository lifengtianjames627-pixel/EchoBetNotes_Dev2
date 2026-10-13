import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/appClient';
export default function useRecruitPosts(user) {
  return useQuery({
    queryKey: ['recruit-posts', user?.id, 'open-discovery'],
    queryFn: () => apiClient.entities.RecruitPost.filter({
      status: 'active', moderation_status: { $in: ['approved', '', null] },
    }, '-created_date', 200),
    enabled: !!user?.id,
  });
}