// Muted earthy inks for nearby people — the same colour marks a person's map
// pin and their row in the list, so they're easy to match up without shouting.
export const PEER_COLORS = ['#bf7a35', '#6f7a5a', '#4f5a7a', '#a0522d', '#7a6a4f', '#5f6b6b', '#8a5a6a'];

export const peerColor = (i) => PEER_COLORS[i % PEER_COLORS.length];