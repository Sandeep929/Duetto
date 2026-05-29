# Duetto — Collaborative Music Sync Client (Frontend)

Duetto is a real-time, responsive web application that enables multiple users to join virtual listening rooms and stream music in perfect synchronization. This repository contains the vanilla HTML5/CSS3/JavaScript client application that leverages WebSockets and the STOMP protocol to achieve sub-second synchronization, manage collaborative playlists, handle song uploads, and track play analytics.

---

## 🚀 Features

### 1. User Authentication & Session Management
*   **Sign In / Sign Up Portal:** Quick toggle between login and registration with validation checks.
*   **Persistence:** Credentials are stored locally via `localStorage` for automatic session restoration.
*   **Admin Routing:** Automatically detects administrative accounts (e.g., `admin`) and exposes an entry point to the system-wide console.

### 2. Room Action Dashboard
*   **Room Creation:** Requests the backend to spin up a new room instance and assigns a unique UUID identifier.
*   **Room Joining:** Standardized joining input that redirects to the collaborative playback screen.
*   **Live Event Logger:** Monitor WebSocket activities and incoming global synchronization payloads on a clean UI log window.

### 3. Real-Time Room Player
*   **Sub-Second Sync Engine:** Synchronizes play, pause, seek, stop, and track changes across all clients.
*   **Drift/Latency Compensation:** Calculates network delay during message transit (`driftSeconds = (Date.now() - payload.time) / 1000`) and adjusts the local media player’s timeline dynamically.
*   **Session Recovery (Reload Path):** Caches play state to local storage under `roomState_{roomId}`. Upon a page refresh, the cached state is applied instantly to prevent audio interruption, and is subsequently reconciled with the server via the REST API (`/room/checkRoomState`).
*   **Collaborative Playlists:** Real-time playlist CRUD, allowing users to select checkboxes to assign songs to multiple playlists.
*   **Dual Media Sources:** Supports streaming Cloudinary-hosted songs or loading local audio files from a configurable local development path.
*   **Volume & Progress Controls:** Customized, responsive range sliders.

### 4. Admin Management Console
*   **User CRUD Control:** List, add/edit, and delete single or multiple registered users simultaneously.
*   **Live Monitor:** Monitor active rooms, host IDs, and inspect connected user lists via specialized STOMP subscriptions.
*   **Media Database Management:** Drag-and-drop audio uploading, track deletions, and leaderboard monitoring showing the top 5 most-played songs.

---

## 🛠️ Architecture & Tech Stack

*   **HTML5 & CSS3:** Semantic markup and a modern glassmorphism design system using custom CSS properties for dark-mode variables, smooth transition curves, and responsive flex grid layouts.
*   **Vanilla JS:** Light weight, zero-framework application logic managing DOM updates and state changes.
*   **StompJS:** Utilizes STOMP over WebSockets via CDN integration to establish connection pipelines.
*   **Vercel Analytics:** Integrates `@vercel/analytics` for production environment page-view and event telemetry.

---

## 📂 Directory Layout

```
STOMP Client/
├── auth.html           # Login and Registration interface
├── auth.css            # Styles for authentication cards & input tabs
├── index.html          # Dashboard, Room creation/joining, and logs
├── index.css           # Styling for dashboard layout & glass panels
├── room-player.html    # Core music synchronization room player UI
├── room-player.css     # CSS grid layout for player, sidebar, controls & modals
├── admin.html          # Administrative dashboard console
├── api.js              # Centralized fetch utilities, fallbacks, and STOMP connections
├── analytics.js        # Vercel Web Analytics loader
├── global.css          # Universal CSS variables, tokens, and button styles
├── package.json        # Frontend configuration and npm metadata
└── README.md           # This document
```

---

## ⚡ Technical Highlights

### WebSocket / STOMP Connection & Fallbacks
The client uses `api.js` to automatically resolve local network endpoints or cloud-hosted fallback targets.

```javascript
// Connects the STOMP client using fallback endpoints
function connectStompClientWithFallback(onConnect, onError) {
    // ... resolves the WebSocket address based on hostname
    const socket = new WebSocket(wsUrl);
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame) {
        console.log(`[STOMP] Connected to ${wsUrl}`);
        if (onConnect) onConnect(stompClient, frame);
    }, function (error) {
        // Automatically retries alternative endpoints on failure
        retryConnection();
    });
}
```

### Drift Compensation Logic
To keep playback synchronized, the receiver calculates the transport duration of the action and seeks forward to match the broadcaster:

```javascript
// Calculate transport latency
const driftSeconds = payload.time ? (Date.now() - payload.time) / 1000 : 0;

if (payload.action === 'play') {
    // Apply position seek adjusted by drift time
    const seekTo = Math.max(0, (payload.currentTime || 0) + driftSeconds);
    audio.currentTime = seekTo;
    audio.play();
}
```

### Analytics Buffering
Play tracking increments are stored in a local storage buffer (`playBuffer`) and periodically sent in batch queries to `/songs/updatePlays`. This guarantees data integrity, making sure play metrics aren't lost if the browser tab closes abruptly.

---

## ⚙️ Getting Started

### Prerequisites
*   A running instance of the **Duetto Backend**.
*   A simple HTTP local server (VS Code Live Server, Python HTTP server, or Nginx).

### Run Locally

1.  **Clone this repository** into your web server directory.
2.  **Open `api.js`** and configure your backend URLs if different from the defaults:
    ```javascript
    // api.js
    const localApiEndpoint = 'http://localhost:8080';
    const localWsEndpoint  = 'ws://localhost:8080/ws';
    ```
3.  **Start your HTTP server** from the root of the frontend folder:
    *   Using Python:
        ```bash
        python -m http.server 3000
        ```
    *   Using Node `http-server`:
        ```bash
        npx http-server -p 3000
        ```
4.  Open `http://localhost:3000/auth.html` in your browser.
