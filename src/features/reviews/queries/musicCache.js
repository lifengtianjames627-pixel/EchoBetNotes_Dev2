// Compatibility policy shared with album/podcast consumers. Preserve existing
// affected queries while those domains are migrated separately.
export const isMusicQuery = query => /album|review|homeFeed|podcast/i.test(String(query.queryKey[0]));

export function refreshMusic(client) {
  return client.invalidateQueries({ predicate: isMusicQuery });
}