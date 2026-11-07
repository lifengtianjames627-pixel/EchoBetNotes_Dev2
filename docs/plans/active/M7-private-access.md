# M7 — Public browsing stays, private collections require sign-in

Status: COMPLETE  
Updated: 2026-11-07

M7 follows the charter privacy rules without moving the site off email-linked chat,
profiles, or friend requests.

## Scope

- `assertCollectionRead` rejects anonymous reads of participant, self, owner, voter, and subscriber collections before the database is scanned.
- Approved reviews stay readable without a session, matching the original public catalogue.
- Chat validation errors keep stable codes so the existing message feedback still recognizes blocked contact, invalid chats, and missing members.
- Integration tests lock search (no email in results, email queries rejected), authorized profile email for compatibility, chat participant isolation, cold-message limit, and notification ownership.

## Out of scope

- Replacing `/u/:email` or chat ids with user ids.
- Removing `email` from `publicProfile` for signed-in members.
- Browser walkthrough of the chat UI.

## Verification

- `npm test`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run build:server`
