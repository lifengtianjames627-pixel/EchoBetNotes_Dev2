import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import GenreBadge, { genreLabels } from '@/components/GenreBadge';
import { Plus, Users, Search, Guitar } from 'lucide-react';
import { displayName } from '@/lib/displayName';
import { Card } from '@/components/ui/card';

export default function Bands() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newBand, setNewBand] = useState({ name: '', genre: '', description: '', looking_for: '' });

  const queryClient = useQueryClient();

  const { data: bands = [], isLoading } = useQuery({
    queryKey: ['bands'],
    queryFn: () => base44.entities.Band.list('-created_date', 100),
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const createBand = useMutation({
    mutationFn: async (data) => {
      const band = await base44.entities.Band.create({
        ...data,
        looking_for: data.looking_for ? data.looking_for.split(',').map(s => s.trim()).filter(Boolean) : [],
        member_count: 1,
        status: 'recruiting',
      });
      // Add creator as founder
      await base44.entities.BandMember.create({
        band_id: band.id,
        band_name: data.name,
        user_email: currentUser.email,
        user_name: displayName(currentUser),
        role: 'Founder',
        is_founder: true,
      });
      return band;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bands'] });
      setShowCreate(false);
      setNewBand({ name: '', genre: '', description: '', looking_for: '' });
    },
  });

  const filtered = bands.filter((b) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bands</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Start a Band</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Start a New Band</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createBand.mutate(newBand); }} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>Band Name *</Label>
                <Input value={newBand.name} onChange={(e) => setNewBand({...newBand, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Genre *</Label>
                <Select value={newBand.genre} onValueChange={(v) => setNewBand({...newBand, genre: v})}>
                  <SelectTrigger><SelectValue placeholder="Select genre" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(genreLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Looking for (comma separated)</Label>
                <Input value={newBand.looking_for} onChange={(e) => setNewBand({...newBand, looking_for: e.target.value})} placeholder="Guitarist, Drummer, Vocalist..." />
              </div>
              <div className="space-y-2">
                <Label>About the band</Label>
                <Textarea value={newBand.description} onChange={(e) => setNewBand({...newBand, description: e.target.value})} rows={3} />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={createBand.isPending}>
                {createBand.isPending ? 'Creating...' : 'Create Band'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search bands..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((band) => (
            <Link key={band.id} to={`/band/${band.id}`}>
              <Card className="p-6 border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                    {band.cover_image_url ? (
                      <img src={band.cover_image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
                    ) : (
                      <Guitar className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{band.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {band.genre && <GenreBadge genre={band.genre} />}
                      <span className="text-xs text-muted-foreground">{band.member_count || 1} members</span>
                      <Badge variant={band.status === 'recruiting' ? 'default' : 'secondary'} className="text-[10px]">
                        {band.status || 'recruiting'}
                      </Badge>
                    </div>
                    {band.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{band.description}</p>
                    )}
                    {band.looking_for?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {band.looking_for.map((role) => (
                          <span key={role} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Need: {role}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/30" />
          <p className="mt-3 text-muted-foreground">No bands yet. Start one!</p>
        </div>
      )}
    </div>
  );
}