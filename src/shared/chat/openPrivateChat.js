// Central dispatcher for "open a private chat with this member".
// Components across reviews, comments, soulmate posts and podcasts call this
// when a user's avatar/name is tapped. The global listener in Layout catches
// the event and navigates to /chat?with=… so the conversation opens in the
// full DirectChat page (with the pre-friend 3-message gate).
export function openPrivateChat(email, name) {
  if (!email) return;
  window.dispatchEvent(new CustomEvent('openMiniChat', {
    detail: { email, name: name || '' },
  }));
}