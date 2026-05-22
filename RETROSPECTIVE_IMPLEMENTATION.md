# Retrospective 4Ls Implementation

## Overview

Implemented a collaborative real-time retrospective feature using the 4Ls format:

- Loved
- Learned
- Lacked
- Longed For

Retrospectives are separate from Planning Poker rooms, but reuse the existing identity, Socket.IO, SQLite, and frontend UI patterns.

## Frontend Changes

- Added a `Retrospective` button to the home action screen after the user has entered their name.
- Added `/retrospective` for creating or joining a retrospective by code or link.
- Added `/retrospective/[retroId]` for the live retrospective board.
- Added `useRetrospective` hook for joining sessions, receiving live state, and emitting retrospective mutations.
- The live board includes four responsive 4Ls columns with descriptions in each header.
- Each column includes a card composer with a `Show my name` checkbox.
- Cards show:
  - Body text
  - `Anonymous` or the author name, depending on `showAuthor`
  - Like count and current user's liked state
  - Edit control for the card author
  - Delete control for the card author or moderator
- Added copyable retrospective links using `/retrospective/[retroId]`.

## Shared Package Changes

- Added retrospective types:
  - `RetrospectiveColumn`
  - `RetrospectiveParticipantPublic`
  - `RetrospectiveCardPublic`
  - `RetrospectiveState`
- Added retrospective Socket.IO event constants:
  - `retro:create`
  - `retro:created`
  - `retro:join`
  - `retro:state`
  - `retro:updated`
  - `retro:card:add`
  - `retro:card:edit`
  - `retro:card:delete`
  - `retro:card:like:toggle`
- Added payload interfaces for create, join, card add/edit/delete, like toggle, and state responses.

## Backend Changes

- Added SQLite tables:
  - `retrospectives`
  - `retrospective_participants`
  - `retrospective_cards`
  - `retrospective_card_likes`
- Added indexes for retrospective participant lookup, card lookup, and activity cleanup support.
- Updated connection reset to clear retrospective participant socket state on backend startup.
- Added retrospective database helpers in `apps/backend/src/db/retrospectives.ts` for:
  - Creating retrospectives
  - Joining/upserting participants
  - Disconnecting participants
  - Building full retrospective state
  - Adding cards
  - Editing cards
  - Deleting cards
  - Toggling likes
- Added Socket.IO handlers in `apps/backend/src/socket/handlers/retrospective.ts`.
- Registered retrospective handlers in the main socket server.

## Privacy and Permission Behavior

- Cards are anonymous by default.
- If `showAuthor` is false, the backend sends `authorName: null`; the frontend renders `Anonymous`.
- Moderators also do not receive hidden author names.
- The backend still stores the internal author participant token so permissions can be enforced.
- Retrospective state is built per participant so the payload can safely include:
  - `canEdit`
  - `canDelete`
  - `likedByMe`
- Only the card author can edit a card.
- The card author or retrospective moderator can delete a card.
- Any joined participant can like or unlike a card once.
- Each mutation broadcasts updated state to every connected participant in that retrospective.

## Verification

Ran:

```bash
npm run build
```

Result:

- Shared package compiled successfully.
- Backend compiled successfully.
- Frontend Next.js production build completed successfully.

## Notes

- A stale local dev server was found on ports `3000` and `3001` during manual route verification and was stopped.
- No dev server was left running because the app is intended to be run via Docker.
