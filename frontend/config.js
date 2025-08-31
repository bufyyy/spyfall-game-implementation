// Backend configuration
const config = {
    // Railway backend URL - this will be updated after deployment
    backendUrl: 'https://your-railway-app-name.railway.app' || 'http://localhost:3000'
};

// Socket.IO connection
const socket = io(config.backendUrl, {
    transports: ['websocket', 'polling']
});
