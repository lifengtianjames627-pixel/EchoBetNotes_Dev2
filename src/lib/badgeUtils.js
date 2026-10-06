import { base44 } from '@/api/base44Client';
import { BADGE_MAP } from '@/lib/badgeConfig';
import { notify } from '@/lib/notify';
import { toast } from 'sonner';

export const getWeekKey = () => {
  const d = new Date();
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

export async function awardBadge(userEmail, badgeId, queryClient) {
  if (!userEmail || !badgeId) return false;
  try {
    const existing = await base44.entities.UserBadge.filter({ user_email: userEmail, badge_id: badgeId });
    if (existing.length > 0) return false;
    await base44.entities.UserBadge.create({
      user_email: userEmail,
      badge_id: badgeId,
      earned_at: new Date().toISOString(),
    });
    const badge = BADGE_MAP[badgeId];
    if (badge) {
      toast(`Badge unlocked — ${badge.name}`, {
        description: badge.desc,
        duration: 5000,
      });
      notify({
        owner_email: userEmail,
        type: 'badge',
        title: `New badge unlocked — ${badge.name}`,
        body: badge.desc || '',
        link: '/profile',
      });
    }
    queryClient?.invalidateQueries({ queryKey: ['earned-badges', userEmail] });
    return true;
  } catch {
    return false;
  }
}