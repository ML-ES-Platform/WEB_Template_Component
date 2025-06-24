import { NextResponse } from 'next/server'
import mqtt from 'mqtt'
import { MongoClient } from 'mongodb'

const Schema = {
  value: Number,
  timestamp: Date,
  setpoint: Number,
  deviation: Number
}

let mqttClient = null
let dbClient = null
let database = null
let collection = null
let isConnectedMqtt = false
let isConnectedDb = false

const SETPOINT = $&setpoint$&;

let latestData = {
  value: 0,
  setpoint: SETPOINT,
  deviation: 0,
  timestamp: new Date().toISOString(),
  status: 'stale'
}

const MQTT_TOPIC = '$&mqttTopic$&'
const COLLECTION_NAME = '$&componentName$&dataDeviation'

function calculateDeviation(value, setpoint) {
  return value - setpoint
}

async function initializeMqtt() {
  if (mqttClient) return

  try {
    const options = {
      host: process.env.MQTT_HOST,
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      reconnectPeriod: 5000,
      connectTimeout: 30000
    }

    mqttClient = mqtt.connect(`mqtts://${process.env.MQTT_HOST}`, options)

    mqttClient.on('connect', () => {
      console.log('$&componentName$& MQTT Connected')
      isConnectedMqtt = true
      mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('$&componentName$& MQTT Subscribe error:', err)
        } else {
          console.log(`$&componentName$& Subscribed to ${MQTT_TOPIC}`)
        }
      })
    })

    mqttClient.on('message', async (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const value = parseFloat(message.toString())
          const timestamp = new Date().toISOString()
          const deviation = calculateDeviation(value, SETPOINT)
          
          latestData = {
            value,
            setpoint: SETPOINT,
            deviation,
            timestamp,
            status: 'live'
          }

          if (isConnectedDb && collection) {
            try {
              await collection.insertOne({
                value,
                setpoint: SETPOINT,
                deviation,
                timestamp: new Date(),
                createdAt: new Date()
              })
            } catch (dbErr) {
              console.error('$&componentName$& Database insert error:', dbErr)
            }
          }
        } catch (err) {
          console.error('$&componentName$& Message parsing error:', err)
        }
      }
    })

    mqttClient.on('error', (err) => {
      console.error('$&componentName$& MQTT error:', err)
      isConnectedMqtt = false
    })

    mqttClient.on('close', () => {
      console.log('$&componentName$& MQTT disconnected')
      isConnectedMqtt = false
    })

    mqttClient.on('offline', () => {
      console.log('$&componentName$& MQTT offline')
      isConnectedMqtt = false
    })

  } catch (err) {
    console.error('$&componentName$& MQTT initialization error:', err)
    isConnectedMqtt = false
  }
}

async function initializeDatabase() {
  if (dbClient && isConnectedDb) return

  try {
    if (!process.env.MONGODB_URI) {
      console.log('$&componentName$&: No MongoDB URI provided, running without database')
      return
    }

    dbClient = new MongoClient(process.env.MONGODB_URI)
    await dbClient.connect()
    
    database = dbClient.db()
    collection = database.collection(COLLECTION_NAME)
    
    await collection.createIndex({ timestamp: -1 })
    
    isConnectedDb = true
    console.log('$&componentName$& MongoDB Connected')

    const lastRecord = await collection.findOne({}, { sort: { timestamp: -1 } })
    if (lastRecord) {
      const deviation = calculateDeviation(lastRecord.value, SETPOINT)
      latestData = {
        value: lastRecord.value,
        setpoint: SETPOINT,
        deviation,
        timestamp: lastRecord.timestamp.toISOString(),
        status: 'cached'
      }
    }

  } catch (err) {
    console.error('$&componentName$& Database connection error:', err)
    isConnectedDb = false
  }
}

async function getDataStatus() {
  const now = new Date()
  const lastUpdate = new Date(latestData.timestamp)
  const timeDiff = now - lastUpdate

  if (timeDiff > 300000) {
    return 'stale'
  } else if (isConnectedMqtt && timeDiff < 30000) {
    return 'live'
  } else {
    return 'cached'
  }
}

export async function GET() {
  try {
    if (!mqttClient) {
      await initializeMqtt()
    }
    
    if (!isConnectedDb && process.env.MONGODB_URI) {
      await initializeDatabase()
    }

    let responseData = { ...latestData }

    if (isConnectedDb && collection) {
      try {
        const lastRecord = await collection.findOne({}, { sort: { timestamp: -1 } })
        if (lastRecord) {
          const dbTimestamp = lastRecord.timestamp.toISOString()
          if (new Date(dbTimestamp) > new Date(latestData.timestamp)) {
            const deviation = calculateDeviation(lastRecord.value, SETPOINT)
            responseData = {
              value: lastRecord.value,
              setpoint: SETPOINT,
              deviation,
              timestamp: dbTimestamp,
              status: 'cached'
            }
          }
        }
      } catch (dbErr) {
        console.error('$&componentName$& Database query error:', dbErr)
      }
    }

    responseData.status = await getDataStatus()

    return NextResponse.json({
      ...responseData,
      mqttConnected: isConnectedMqtt,
      dbConnected: isConnectedDb
    })

  } catch (error) {
    console.error('$&componentName$& API error:', error)
    return NextResponse.json({
      value: 0,
      setpoint: SETPOINT,
      deviation: 0,
      timestamp: new Date().toISOString(),
      status: 'stale',
      mqttConnected: false,
      dbConnected: false
    }, { status: 500 })
  }
}

initializeMqtt()
if (process.env.MONGODB_URI) {
  initializeDatabase()
}