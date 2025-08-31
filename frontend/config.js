// Backend configuration
const config = {
    // Railway backend URL - this will be updated after deployment
    backendUrl: 'https://web-production-acde1.up.railway.app' || 'http://localhost:3000'
};

// Socket.IO connection
const socket = io(config.backendUrl, {
    transports: ['websocket', 'polling']
});
