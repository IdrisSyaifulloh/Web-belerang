import express from 'express';
import { Server } from 'socket.io';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import cors from 'cors';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'development' 
      ? ["http://localhost:5177", "http://localhost:5173"]
      : false,
    methods: ["GET", "POST"]
  },
  pingTimeout: 5000,
  pingInterval: 10000,
  connectTimeout: 10000
});

// Middleware to handle errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
// Serial Port configuration
let port;
let isSerialConnected = false;

const initializeSerialPort = async () => {
  try {
    port = new SerialPort({
      path: 'COM3',
      baudRate: 115200
    });
    isSerialConnected = true;
    
    port.on('error', (error) => {
      console.error('Serial port error:', error);
      isSerialConnected = false;
      io.emit('serialError', { message: 'Serial port error occurred' });
    });

    port.on('close', () => {
      console.log('Serial port closed');
      isSerialConnected = false;
      io.emit('serialError', { message: 'Serial port connection lost' });
      
      // Try to reconnect after 5 seconds
      setTimeout(initializeSerialPort, 5000);
    });

  } catch (error) {
    console.error('Failed to open serial port:', error);
    isSerialConnected = false;
    io.emit('serialError', { message: 'Failed to connect to hardware' });
    
    // Try to reconnect after 5 seconds
    setTimeout(initializeSerialPort, 5000);
  }
};

initializeSerialPort();

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Handle Serial Port errors
port.on('error', (error) => {
  console.error('Serial port error:', error);
  io.emit('serialError', { message: 'Serial port error occurred' });
});

// Handle Serial Port data
parser.on('data', (data) => {
  try {
    const parsedData = JSON.parse(data);
    io.emit('sensorData', parsedData);
  } catch (error) {
    console.error('Error parsing serial data:', error);
    io.emit('dataError', { message: 'Failed to parse sensor data' });
  }
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Send initial hardware connection status
  socket.emit('serialStatus', { connected: isSerialConnected });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });

  // Handle commands to ESP
  socket.on('command', (data) => {
    if (!isSerialConnected) {
      socket.emit('commandError', { message: 'Hardware not connected' });
      return;
    }

    try {
      port.write(JSON.stringify(data) + '\n', (err) => {
        if (err) {
          console.error('Error writing to serial port:', err);
          socket.emit('commandError', { message: 'Failed to send command' });
        } else {
          socket.emit('commandSuccess', { message: 'Command sent successfully' });
        }
      });
    } catch (error) {
      console.error('Error processing command:', error);
      socket.emit('commandError', { message: 'Failed to process command' });
    }
  });

  // Handle status request
  socket.on('getStatus', () => {
    socket.emit('status', {
      serial: isSerialConnected,
      serverTime: new Date().toISOString()
    });
  });
});

// Start server
const PORT = process.env.PORT || 3001;

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\nStarting graceful shutdown...');
  
  // Close Socket.IO connections
  io.close(() => {
    console.log('Socket.IO server closed');
    
    // Close serial port if connected
    if (port && isSerialConnected) {
      port.close(() => {
        console.log('Serial port closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

// Handle shutdown signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serial port status: ${isSerialConnected ? 'Connected' : 'Disconnected'}`);
});