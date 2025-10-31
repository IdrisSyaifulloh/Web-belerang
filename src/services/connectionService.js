import mqtt from 'mqtt';
import io from 'socket.io-client';

class ConnectionService {
  constructor() {
    this.mqttClient = null;
    this.socketClient = null;
    this.callbacks = new Map();
    this.statusListeners = new Set();
    this.connectionStatus = {
      mqtt: false,
      socket: false
    };
    
    // MQTT Configuration
    this.mqttConfig = {
      host: 'broker.hivemq.com', // Public MQTT broker for testing
      port: 8000,
      protocol: 'ws', // WebSocket for browser
      path: '/mqtt',
      reconnectPeriod: 5000, // Reconnect every 5 seconds
      keepalive: 60
    };

    // Socket.IO Configuration
    this.socketUrl = 'http://localhost:3001'; // Your Socket.IO server
  }

  updateConnectionStatus(type, status) {
    this.connectionStatus[type] = status;
    this.notifyStatusListeners();
  }

  notifyStatusListeners() {
    this.statusListeners.forEach(listener => {
      listener(this.connectionStatus);
    });
  }

  subscribeToStatus(callback) {
    this.statusListeners.add(callback);
    callback(this.connectionStatus); // Initial status
    return () => this.statusListeners.delete(callback);
  }

  // Initialize connections
  async connect() {
    return new Promise((resolve, reject) => {
      let mqttConnected = false;
      let socketConnected = false;
      let timeoutId;

      const checkConnections = () => {
        if (mqttConnected && socketConnected) {
          clearTimeout(timeoutId);
          resolve();
        }
      };

      // Connect to MQTT broker
      const mqttUrl = `${this.mqttConfig.protocol}://${this.mqttConfig.host}:${this.mqttConfig.port}${this.mqttConfig.path}`;
      this.mqttClient = mqtt.connect(mqttUrl, this.mqttConfig);

      this.mqttClient.on('connect', () => {
        console.log('Connected to MQTT broker');
        mqttConnected = true;
        this.updateConnectionStatus('mqtt', true);
        this.mqttClient.subscribe('sensors/#');
        checkConnections();
      });

      this.mqttClient.on('error', (err) => {
        console.error('MQTT error:', err);
        this.updateConnectionStatus('mqtt', false);
      });

      this.mqttClient.on('close', () => {
        console.log('MQTT connection closed');
        this.updateConnectionStatus('mqtt', false);
      });

      this.mqttClient.on('message', (topic, message) => {
        try {
          const data = JSON.parse(message.toString());
          this.notifyListeners('mqtt', { topic, data });
        } catch (err) {
          console.error('Error parsing MQTT message:', err);
        }
      });

      // Connect to Socket.IO server
      this.socketClient = io(this.socketUrl, {
        reconnectionDelay: 5000,
        reconnectionAttempts: Infinity,
        timeout: 10000
      });

      this.socketClient.on('connect', () => {
        console.log('Connected to Socket.IO server');
        socketConnected = true;
        this.updateConnectionStatus('socket', true);
        checkConnections();
      });

      this.socketClient.on('serialError', (error) => {
        console.error('Serial port error:', error);
        this.notifyListeners('error', {
          type: 'serial',
          message: error.message || 'Error communicating with hardware'
        });
      });

      this.socketClient.on('dataError', (error) => {
        console.error('Data parsing error:', error);
        this.notifyListeners('error', {
          type: 'data',
          message: error.message || 'Error processing sensor data'
        });
      });

      this.socketClient.on('commandError', (error) => {
        console.error('Command error:', error);
        this.notifyListeners('error', {
          type: 'command',
          message: error.message || 'Error sending command to hardware'
        });
        this.updateConnectionStatus('socket', true);
        checkConnections();
      });

      this.socketClient.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        this.updateConnectionStatus('socket', false);
      });

      this.socketClient.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
        this.updateConnectionStatus('socket', false);
      });

      this.socketClient.on('sensorData', (data) => {
        this.notifyListeners('socket', data);
      });

      // Set a timeout for the initial connection
      timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
  }

  // Subscribe to data updates
  subscribe(source, callback) {
    if (!this.callbacks.has(source)) {
      this.callbacks.set(source, new Set());
    }
    this.callbacks.get(source).add(callback);
  }

  // Unsubscribe from data updates
  unsubscribe(source, callback) {
    if (this.callbacks.has(source)) {
      this.callbacks.get(source).delete(callback);
    }
  }

  // Notify all listeners for a specific source
  notifyListeners(source, data) {
    if (this.callbacks.has(source)) {
      this.callbacks.get(source).forEach(callback => callback(data));
    }
  }

  // Send data via MQTT
  publishMQTT(topic, data) {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(topic, JSON.stringify(data));
    }
  }

  // Send data via Socket.IO
  sendSocket(event, data) {
    if (this.socketClient && this.socketClient.connected) {
      this.socketClient.emit(event, data);
    }
  }

  // Cleanup connections
  disconnect() {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    if (this.socketClient) {
      this.socketClient.disconnect();
    }
  }
}

// Create singleton instance
const connectionService = new ConnectionService();
export default connectionService;