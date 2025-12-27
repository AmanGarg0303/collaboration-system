### Tech

-> React.js, Tailwind, Node.js, Express.js, Postgres and Redis in Docker

### Feature

Collaboration Engine like simple google docs, where multiple people could collaborate in real time with proper conflicts breaking, history tracking, socket server.

### Steps to start the things:

-> npm i // if node_modules are not present in client and server
-> docker-compose up - d
-> /server -> nodemon server.js
-> /client -> npm run dev

### To check data in docker postgres

-> docker ps
-> docker exec -it {containerID} bash
-> su postgres // postgres is username
-> psql
-> \l
-> \c analytics-system
-> \d
-> select \* from button_clicks_daily;

📃 Single-Document Collaboration Engine — Simplified Version
Flow

User visits page → prompted for a username

Backend checks if username is unique

If yes → allow access

If no → ask for another username

User enters the single shared document page

All edits are real-time synced with others

Show online users (by name)

No traditional auth, no multiple docs

1️⃣ Backend Components
A. WebSocket Server

Single doc ID: doc:1

Manages:

Connections

Username uniqueness check

Receiving events

Broadcasting events

Event types:

join → new user joins

leave → user leaves

edit → document changes

B. Redis

doc:1:state → current document state (text or JSON)

doc:1:users → active usernames (Redis Set)

doc:1:events → Pub/Sub channel for broadcasting

C. Postgres (optional for persistence)

Table: events

Single document, logs all edits

Table: snapshot

Stores full document periodically

2️⃣ Event Model

Since we have only one doc, the model is simpler.

Event Type Payload Example Purpose
join { "name": "Alice" } Add user, broadcast join
leave { "name": "Alice" } Remove user, broadcast leave
edit { "name": "Alice", "changes": { ... } } Apply mutation, broadcast
snapshot { "state": { ... } } Optional periodic save
3️⃣ Redis Keys

Current state: doc:1:state

Active users: doc:1:users (Set)

Pub/Sub channel: doc:1:events

4️⃣ WebSocket Logic
On Connect

User sends join event with name

Server checks Redis Set doc:1:users

Exists → reject

Else → add

Broadcast join to all users

Send current document state to this user

On Edit

Validate name exists in Redis set

Apply changes to doc:1:state

Publish edit event to all users

Persist event in Postgres asynchronously

On Disconnect

Remove username from Redis set

Broadcast leave event

5️⃣ Frontend Flow (Minimal)

Prompt for username → submit

Connect WebSocket

Render single document state

Capture edits → send edit events

Display real-time edits from other users

Show online users

6️⃣ Optional Enhancements (Knowledge-Worthy)

Conflict handling: last-write-wins or simple CRDT for JSON/text

Snapshots: every N events → save full state

Reconnect & replay: user reconnects → fetch missed events from Postgres
