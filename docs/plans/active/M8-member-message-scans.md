# M8 — Scan a member's own messages

Status: COMPLETE  
Updated: 2026-11-07

M8 makes unread counts and the conversation directory read only the signed-in member's
messages. The public catalogue, nearby member list, and email-based chat ids stay as they are.

## Scope

- `EntityRepository.listArrayIncludes` matches a jsonb array element, used for `participants`.
- `messageUnread` and `chatDirectory` use that query with the existing caps (1000 and 500).
- `readBounds` names the existing search, profile, notification, and directory caps.
- Tests: repository isolation, and `chatDirectory` returns the thread only to its participants.

## Out of scope

- Paging through more than the capped working set.
- Changing nearby member fields or dropping email from that signed-in directory.
- A new chat UI.

## Verification

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run build:server`
