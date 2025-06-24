import { NextResponse } from 'next/server'
import mqtt from 'mqtt'
import { MongoClient } from 'mongodb'

const Schema = {
  value: Number,
  timestamp: Date
}

let mqttClient = null
let dbClient = null
let database = null
let collection = null
let isConnectedMqtt = false
let isConnectedDb = false

let latestData = {
  value: 0,
  timestamp: new Date().toISOString(),
  status: 'stale'
}

const MQTT_TOPIC = '$&mqttTopic$&'
const COLLECTION_NAME = '$&componentName$&dataChart'

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
      console.log('$&componentName$& Chart MQTT Connected')
      isConnectedMqtt = true
      mqttClient.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('$&componentName$& Chart MQTT Subscribe error:', err)
        } else {
          console.log(`$&componentName$& Chart Subscribed to ${MQTT_TOPIC}`)
        }
      })
    })

    mqttClient.on('message', async (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const value = parseFloat(message.toString())
          const timestamp = new Date().toISOString()
          
          latestData = {
            value,
            timestamp,
            status: 'live'
          }

          if (isConnectedDb && collection) {
            try {
              await collection.insertOne({
                value,
                timestamp: new Date(),
                createdAt: new Date()
              })
            } catch (dbErr) {
              console.error('$&componentName$& Chart Database insert error:', dbErr)
            }
          }
        } catch (err) {
          console.error('$&componentName$& Chart Message parsing error:', err)
        }
      }
    })

    mqttClient.on('error', (err) => {
      console.error('$&componentName$& Chart MQTT error:', err)
      isConnectedMqtt = false
    })

    mqttClient.on('close', () => {
      console.log('$&componentName$& Chart MQTT disconnected')
      isConnectedMqtt = false
    })

    mqttClient.on('offline', () => {
      console.log('$&componentName$& Chart MQTT offline')
      isConnectedMqtt = false
    })

  } catch (err) {
    console.error('$&componentName$& Chart MQTT initialization error:', err)
    isConnectedMqtt = false
  }
}

async function initializeDatabase() {
  if (dbClient && isConnectedDb) return

  try {
    if (!process.env.MONGODB_URI) {
      console.log('$&componentName$& Chart: No MongoDB URI provided, running without database')
      return
    }

    dbClient = new MongoClient(process.env.MONGODB_URI)
    await dbClient.connect()
    
    database = dbClient.db()
    collection = database.collection(COLLECTION_NAME)
    
    await collection.createIndex({ timestamp: -1 })
    
    isConnectedDb = true
    console.log('$&componentName$& Chart MongoDB Connected')

    const lastRecord = await collection.findOne({}, { sort: { timestamp: -1 } })
    if (lastRecord) {
      latestData = {
        value: lastRecord.value,
        timestamp: lastRecord.timestamp.toISOString(),
        status: 'cached'
      }
    }

  } catch (err) {
    console.error('$&componentName$& Chart Database connection error:', err)
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

export async function GET(request) {
  try {
    if (!mqttClient) {
      await initializeMqtt()
    }
    
    if (!isConnectedDb && process.env.MONGODB_URI) {
      await initializeDatabase()
    }

    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    let chartData = []
    let responseData = { ...latestData }

    if (isConnectedDb && collection) {
      try {
        let query = {}
        
        if (since) {
          query.timestamp = { $gt: new Date(since) }
          
          const records = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .limit(50) 
            .toArray()

          chartData = records.reverse().map(record => ({
            value: record.value,
            timestamp: record.timestamp.toISOString(),
            time: record.timestamp.getTime()
          }))
        } else {
          const records = await collection
            .find({})
            .sort({ timestamp: -1 })
            .limit(300)
            .toArray()

          chartData = records.reverse().map(record => ({
            value: record.value,
            timestamp: record.timestamp.toISOString(),
            time: record.timestamp.getTime()
          }))
        }

        const lastRecord = await collection.findOne({}, { sort: { timestamp: -1 } })
        if (lastRecord) {
          const dbTimestamp = lastRecord.timestamp.toISOString()
          if (new Date(dbTimestamp) > new Date(latestData.timestamp)) {
            responseData = {
              value: lastRecord.value,
              timestamp: dbTimestamp,
              status: 'cached'
            }
          }
        }

      } catch (dbErr) {
        console.error('$&componentName$& Chart Database query error:', dbErr)
      }
    }

    if (chartData.length === 0 && latestData.value !== undefined) {
      chartData = [{
        value: latestData.value,
        timestamp: latestData.timestamp,
        time: new Date(latestData.timestamp).getTime()
      }]
    }

    responseData.status = await getDataStatus()

    return NextResponse.json({
      current: {
        ...responseData,
        mqttConnected: isConnectedMqtt,
        dbConnected: isConnectedDb
      },
      data: chartData,
      hasMore: !since && chartData.length === 300, 
      isIncremental: !!since
    })

  } catch (error) {
    console.error('$&componentName$& Chart API error:', error)
    return NextResponse.json({
      current: {
        value: 0,
        timestamp: new Date().toISOString(),
        status: 'stale',
        mqttConnected: false,
        dbConnected: false
      },
      data: [],
      hasMore: false,
      isIncremental: false
    }, { status: 500 })
  }
}

initializeMqtt()
if (process.env.MONGODB_URI) {
  initializeDatabase()
}