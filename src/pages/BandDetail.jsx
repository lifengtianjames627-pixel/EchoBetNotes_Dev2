import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import GenreBadge from '@/components/GenreBadge';
import { ArrowLeft, Users, Guitar, Crown, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { displayName } from '@/lib/displayName';

export default function BandDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [showJoin, setShowJoin] = useState(false);
  const [myRole, setMyRole] = useState('');

  const { data: band, isLoading } = useQuery({
    queryKey: ['band', id],
    queryFn: async () => {
      const bands = await base44.entities.Band.filter({ id });
      return bands[0];
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ['band-members', id],
    queryFn: () => base44.entities.BandMember.filter({ band_id: id }),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const isMember = members.some((m) => m.user_email === currentUser?.email);

  const joinBand = useMutation({
    mutationFn: async () => {
      await base44.entities.BandMember.create({
        band_id: id,
        band_name: band.name,
        user_email: currentUser.email,
        user_name: displayName(currentUser),
        role: myRole || 'Member',
        is_founder: false,
      });
      await base44.entities.Band.update(id, { member_count: (band.member_count || 1) + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['band-members', id] });
      queryClient.invalidateQueries({ queryKey: ['band', id] });
      setShowJoin(false);
    },
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!band) return <div className="text-center py-20 text-muted-foreground">Band not found.</div>;

  return (
    <div className="space-y-8">
      <Link to="/bands" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Bands
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Band Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-8 border">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0 shadow-lg">
              {band.cover_image_url ? (
                <img src={band.cover_image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <Guitar className="w-12 h-12 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 items-center">
                <h1 className="text-3xl font-extrabold">{band.name}</h1>
                <Badge variant={band.status === 'recruiting' ? 'default' : 'secondary'}>
                  {band.status || 'recruiting'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-2">
                {band.genre && <GenreBadge genre={band.genre} />}
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" /> {band.member_count || members.length} members
                </span>
              </div>
              {band.description && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">{band.description}</p>
              )}
              {band.looking_for?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-xs font-medium text-muted-foreground">Looking for:</span>
                  {band.looking_for.map((role) => (
                    <span key={role} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                      {role}
                    </span>
                  ))}
                </div>
              )}
              {!isMember && currentUser && (
                <Dialog open={showJoin} onOpenChange={setShowJoin}>
                  <DialogTrigger asChild>
                    <Button className="mt-5 rounded-xl gap-2">
                      <UserPlus className="w-4 h-4" /> Join This Band
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Join {band.name}</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Your role / instrument</Label>
                        <Input value={myRole} onChange={(e) => setMyRole(e.target.value)} placeholder="e.g. Guitarist, Drummer, Vocalist..." />
                      </div>
                      <Button className="w-full rounded-xl" onClick={() => joinBand.mutate()} disabled={joinBand.isPending}>
                        {joinBand.isPending ? 'Joining...' : 'Join Band'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              {isMember && (
                <Badge variant="outline" className="mt-5 gap-1.5">
                  <Users className="w-3 h-3" /> You're a member
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Members */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Members ({members.length})</h2>
          {members.length > 0 ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-sm border">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">
                      {(member.user_name || member.user_email)?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{member.user_name || member.user_email}</p>
                    <p className="text-xs text-muted-foreground">{member.role || 'Member'}</p>
                  </div>
                  {member.is_founder && <Crown className="w-4 h-4 text-yellow-500 shrink-0" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No members yet.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}