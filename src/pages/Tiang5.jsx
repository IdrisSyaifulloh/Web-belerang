import { useState, useEffect } from 'react';
import ParameterCard from '../components/parameter';
import LineChart from '../components/LineChart';
import connectionService from '../services/connectionService';
import MultiTiangMap from '../components/gps';

export default function Tiang5() {
  const [connectionStatus, setConnectionStatus] = useState({
    mqtt: false,
    socket: false
  });

  // Initialize with empty data
  const parameterNames = [
    'CO2', 'SO2', 'H2S', 'Temperature', 'Humidity',
    'Pressure', 'O2', 'CH4', 'NO2', 'CO',
    'VOC', 'PM2.5', 'PM10', 'Wind Speed', 'Wind Direction'
  ];

  const [params, setParams] = useState(
    Array(15).fill().map((_, i) => ({
      id: i + 1,
      name: parameterNames[i],
      status: 'normal',
      values: Array(10).fill(0),
      timestamps: Array(10).fill(0).map((_, i) => new Date(Date.now() - (9 - i) * 1000).toLocaleTimeString())
    }))
  );

  const [selectedParam, setSelectedParam] = useState(params[0]);
  const [selectedParam2, setSelectedParam2] = useState(params[1]); // Parameter kedua

  // Connect to MQTT and Socket.IO when component mounts
  useEffect(() => {
    const initializeConnections = async () => {
      try {
        await connectionService.connect();
        setConnectionStatus({ mqtt: true, socket: true });
      } catch (err) {
        console.error('Connection error:', err);
      }
    };

    initializeConnections();

    const mqttUnsubscribe = connectionService.subscribe('mqtt', ({ topic, data }) => {
      if (topic.startsWith('sensors/tiang5/')) {
        const paramId = parseInt(topic.split('/')[2]);
        updateParameter(paramId, data);
      }
    });

    const socketUnsubscribe = connectionService.subscribe('socket', (data) => {
      if (data.tiangId === 5) {
        updateParameter(data.paramId, data);
      }
    });

    const statusUnsubscribe = connectionService.subscribeToStatus((status) => {
      setConnectionStatus(status);
    });

    return () => {
      mqttUnsubscribe?.();
      socketUnsubscribe?.();
      statusUnsubscribe?.();
      connectionService.disconnect();
    };
  }, []);

  // Update parameter data
  const updateParameter = (paramId, data) => {
    setParams(currentParams => {
      const newParams = [...currentParams];
      const param = newParams[paramId - 1];
      
      if (param) {
        const newValue = data.value;
        const values = [...param.values.slice(1), newValue];
        const timestamps = [...param.timestamps.slice(1), new Date().toLocaleTimeString()];
        
        // Determine status based on value
        let status = 'normal';
        if (newValue > 80) status = 'danger';
        else if (newValue > 60) status = 'warning';
        else if (newValue > 40) status = 'aman';

        newParams[paramId - 1] = {
          ...param,
          values,
          timestamps,
          status
        };
      }
      
      return newParams;
    });
  };

  // Prepare chart data for selected parameters (2 parameters)
  const chartData = {
    labels: selectedParam.timestamps,
    datasets: [
      {
        label: selectedParam.name,
        data: selectedParam.values,
        borderColor: 'rgba(46, 135, 28, 1)',
        backgroundColor: 'rgba(46, 135, 28, 0.1)',
        tension: 0.4,
      },
      {
        label: selectedParam2.name,
        data: selectedParam2.values,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.4,
      }
    ],
  };

  return (
    <div className="p-6 dark:bg-gray-800 min-h-screen transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Tiang 5 - Real-time Monitoring</h2>
      
      {/* Connection Status */}
      <div className="mb-4 flex gap-4">
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
          connectionStatus.mqtt ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus.mqtt ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          MQTT {connectionStatus.mqtt ? 'Connected' : 'Disconnected'}
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
          connectionStatus.socket ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${
            connectionStatus.socket ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          Socket.IO {connectionStatus.socket ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 space-x-4">
        {/* Line Chart Section */}
        <div className="mb-8 bg-white dark:bg-gray-700 p-4 rounded-lg shadow w-[600px] h-[350px]">
          <LineChart data={chartData} title={`${selectedParam.name} & ${selectedParam2.name}`} />
        </div>

        <div className="mb-8 bg-white dark:bg-gray-700 p-4 rounded-lg shadow w-[610px] h-[350px]">
          <MultiTiangMap tiangId={5} />
        </div>
      </div>

      {/* Parameter Selection Info */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Parameter 1 (Hijau):</strong> {selectedParam.name} | 
          <strong className="ml-4">Parameter 2 (Merah):</strong> {selectedParam2.name}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">Klik card untuk set Parameter 1, Shift+Klik untuk set Parameter 2</p>
      </div>

      {/* Parameter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {params.map(param => (
          <div 
            key={param.id} 
            onClick={(e) => {
              if (e.shiftKey) {
                setSelectedParam2(param);
              } else {
                setSelectedParam(param);
              }
            }}
            className="cursor-pointer transition-transform hover:scale-102"
          >
            <ParameterCard 
              name={param.name} 
              status={param.status}
              isSelected={selectedParam.id === param.id || selectedParam2.id === param.id}
                />
              </div>
            ))}
          </div>
    </div>
  );
}