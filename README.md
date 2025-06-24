# Web Components

A code generation library for creating MQTT-connected React components in Next.js applications.

## Installation

First, create a new Next.js application:

```bash
npx create-next-app@latest my-app
cd my-app
```

## Project Structure

Create a `mqtt/` folder in your project root directory:

```
my-app/
├── mqtt/
│   ├── acToggleState.js
│   ├── humDeviation.js
│   ├── humidityState.js
│   └── lightChart.js
├── .env.local
└── ...
```

## Configuration Files

Create configuration files in the `mqtt/` directory. Each file exports a configuration object for a specific MQTT component.

### Example Configuration Files

**mqtt/acToggleState.js**
```javascript
module.exports = {
    componentName: "ACState",
    mqttTopic: "togglestate",
    pollingInterval: 1000,
    label: "AC State",
    icon: "AirVent" 
};
```

**mqtt/humDeviation.js**
```javascript
module.exports = {
    componentName: "HumidityDeviation",
    mqttTopic: "humidity",
    pollingInterval: 1000,
    label: "Hum Deviation",
    unit: "%",
    icon: "Droplets",
    setpoint: 50,
    maxDeviation: 100
};
```

**mqtt/humidityState.js**
```javascript
module.exports = {
    componentName: "HallHumidityState",
    mqttTopic: "humidity",
    pollingInterval: 2000,
    label: "Hall Humidity",
    unit: "%",
    icon: "Droplets" 
};
```

**mqtt/lightChart.js**
```javascript
module.exports = {
    componentName: "LightChart",
    mqttTopic: "light",
    pollingInterval: 2000,
    label: "Hall Light",
    unit: "lux",
    icon: "Lightbulb" 
};
```

## Environment Configuration

Create a `.env.local` file in your project root with the following variables:

```env
MONGODB_URI=mongodb://localhost:27017/your-database
MQTT_HOST=your-mqtt-broker.com
MQTT_USERNAME=your-username
MQTT_PASSWORD=your-password
```

## Code Generation

Run the MicroLab code generator and specify the path to your configuration files:

```bash
npx microlab
```

When prompted, provide the location of your configuration files (e.g., `./mqtt/acToggleState.js`).

## Usage

After code generation, import and use the generated components in your Next.js application:

```javascript
import ACState from "@/components/microlab/ACState";
import HallHumidityState from "@/components/microlab/HallHumidityState";
import HallHumidityValueStatistics from "@/components/microlab/HallHumidityStateStatistics";
import HumidityDeviation from "@/components/microlab/HumidityDeviation";
import LightChart from "@/components/microlab/LightChart";

export default function Home() {
  return (
    <div className="flex flex-col flex-wrap gap-6 m-6">
      <div className="flex gap-6 justify-between">
        <HumidityDeviation />
        <HallHumidityState />
        <LightChart />
        <ACState />
      </div>
      <HallHumidityValueStatistics />
    </div>
  );
}
```

## Configuration Properties

Each configuration file supports the following properties:

- `componentName`: The name of the generated React component
- `mqttTopic`: The MQTT topic to subscribe to for data
- `pollingInterval`: Polling interval in milliseconds
- `label`: Display label for the component
- `unit`: Unit of measurement (optional)
- `icon`: Icon name for the component display (Lucide)
- `setpoint`: Target value for deviation components (optional)
- `maxDeviation`: Maximum allowed deviation (optional)

## Requirements

- Next.js application
- MongoDB instance
- MQTT broker access
- Node.js environment with npm/npx
