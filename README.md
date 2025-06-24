# Microlab

A plug-and-play component system for building MQTT-connected dashboards in Next.js.

## Installation

```bash
npm install microlab
```

## Usage

### 1. Configure Environment Variables

Create a `.env` file in your project root:

```env
MQTT_HOST=your_mqtt_broker_host
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password
MONGODB_URI=your_mongodb_connection_string
```

### 2. Create Component Configuration

Create a JSON configuration file for your component (e.g., `src/mqttconfig/humiditySensor.js`):

```json
{
  "componentName": "HumidityState",
  "mqttTopic": "sensors/humidity",
  "pollingInterval": 5000,
  "label": "Humidity Sensor",
  "schema": {
    "type": "Number",
    "required": true
  }
}
```

### 3. Generate Components

Generate a state component:
```bash
npx microlab state --json src/mqttconfig/humiditySensor.js
```

Generate a chart component:
```bash
npx microlab chart --json src/mqttconfig/temperatureChart.js
```

Generate a dashtable container:
```bash
npx microlab dashtable --json src/mqttconfig/dashboard.js
```

### 4. Use Components in Your Next.js App

```jsx
import Dashtable from '@/components/microlab/Dashtable';
import HumidityState from '@/components/microlab/HumidityState';
import TemperatureChart from '@/components/microlab/TemperatureChart';

export default function Dashboard() {
  return (
    <Dashtable>
      <HumidityState />
      <TemperatureChart />
    </Dashtable>
  );
}
```

## Component Types

### State Component
Displays real-time state values from MQTT topics.

### Chart Component
Visualizes time-series data from MQTT topics.

### Dashtable Component
A responsive container that automatically arranges child components in a grid layout.

## Features

- Automatic MQTT connection and message handling
- MongoDB integration for data persistence
- Real-time data updates via HTTP polling
- Responsive and modern UI with Tailwind CSS
- Automatic dependency installation
- Self-contained components with dedicated MongoDB collections
- Serverless-friendly architecture

## License

ISC 