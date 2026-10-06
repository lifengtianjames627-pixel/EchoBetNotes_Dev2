import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
export default function useRecruitPosts(user) {
  return useQuery({
    queryKey: ['recruit-posts', user?.id, 'open-discovery'],
    queryFn: () => base44.entities.RecruitPost.filter({
      status: 'active', moderation_status: { $in: ['approved', '', null] },
    }, '-created_date', 200),
    enabled: !!user?.id,
  });
}