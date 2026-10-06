import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Reviews store a snapshot of the reviewer's equipped badges at post time, which
// goes stale once the user re-equips/unequips badges later. This looks up each
// reviewer's CURRENT equipped_badges live (service role, since the User entity
// blocks non-admins from reading other users).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { emails } = await req.json();
    if (!Array.isArray(emails) || emails.length === 0) return Response.json({ badges: {} });

    const uniqueEmails = [...new Set(emails.filter(Boolean))];
    const badges = {};
    await Promise.all(uniqueEmails.map(async (email) => {
      const matches = await base44.asServiceRole.entities.User.filter({ email });
      badges[email] = matches[0]?.equipped_badges || [];
    }));

    return Response.json({ badges });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});