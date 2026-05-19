const hostname = window.location.hostname;
const localApiEndpoint = (hostname === 'localhost' || hostname === '127.0.0.1') 
    ? 'http://localhost:8080' 
    : `http://${hostname}:8080`;

const localWsEndpoint = (hostname === 'localhost' || hostname === '127.0.0.1') 
    ? 'ws://localhost:8080/ws' 
    : `ws://${hostname}:8080/ws`;

const API_ENDPOINTS = [
    'https://duetto-backend-1.onrender.com'
];

const WS_ENDPOINTS = [
    'wss://duetto-backend-1.onrender.com/ws'
];

let activeEndpointIndex = 0;

/**
 * Gets the active HTTP base URL.
 */
function getActiveBaseUrl() {
    return API_ENDPOINTS[activeEndpointIndex];
}

/**
 * Makes a fetch request with fallback logic.
 * Tries the currently active endpoint first. If it fails, tries the other.
 */
async function fetchWithFallback(path, options = {}) {
    let lastError = null;
    
    // Ensure path starts with a slash
    const normalizedPath = path.startsWith('/') ? path : '/' + path;

    for (let i = 0; i < API_ENDPOINTS.length; i++) {
        const idx = (activeEndpointIndex + i) % API_ENDPOINTS.length;
        const baseUrl = API_ENDPOINTS[idx];
        const url = baseUrl + normalizedPath;
        
        try {
            console.log(`[API] Trying fetch: ${url}`);
            const response = await fetch(url, options);
            
            // If the fetch returns a server error like 502/504 (common with ngrok when down)
            if (response.status === 502 || response.status === 504) {
                console.warn(`[API] Endpoint ${baseUrl} returned ${response.status}, trying next...`);
                lastError = new Error(`HTTP ${response.status}`);
                continue;
            }
            
            // For network success, update active index
            activeEndpointIndex = idx;
            return response;
        } catch (error) {
            console.warn(`[API] Fetch failed for ${baseUrl}:`, error);
            lastError = error;
        }
    }
    
    console.error('[API] All HTTP endpoints failed.');
    throw lastError || new Error('All endpoints failed');
}

/**
 * Connects the STOMP client with fallback logic.
 */
function connectStompClientWithFallback(onConnect, onError) {
    let attempt = 0;

    function tryConnect() {
        if (attempt >= WS_ENDPOINTS.length) {
            console.error('[STOMP] All WebSocket endpoints failed.');
            if (onError) onError('All WebSocket endpoints failed');
            return;
        }

        const idx = (activeEndpointIndex + attempt) % WS_ENDPOINTS.length;
        const wsUrl = WS_ENDPOINTS[idx];
        console.log(`[STOMP] Trying WebSocket connection to ${wsUrl}`);
        
        const socket = new WebSocket(wsUrl);
        const stompClient = Stomp.over(socket);
        
        // Connect STOMP client
        stompClient.connect({}, function (frame) {
            console.log(`[STOMP] Successfully connected to ${wsUrl}`);
            activeEndpointIndex = idx; // Update active index for subsequent HTTP calls too
            if (onConnect) onConnect(stompClient, frame);
        }, function (error) {
            console.warn(`[STOMP] WebSocket connection failed for ${wsUrl}:`, error);
            attempt++;
            tryConnect();
        });
    }

    tryConnect();
}
