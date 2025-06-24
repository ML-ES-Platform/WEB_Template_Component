import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

let dbClient = null
let database = null
let collection = null
let isConnectedDb = false

const COLLECTION_NAME = '$&componentName$&data'

async function initializeDatabase() {
  if (dbClient && isConnectedDb) return

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('No MongoDB URI provided')
    }

    dbClient = new MongoClient(process.env.MONGODB_URI)
    await dbClient.connect()
    
    database = dbClient.db()
    collection = database.collection(COLLECTION_NAME)
    
    isConnectedDb = true
    console.log('$&componentName$& Statistics MongoDB Connected')

  } catch (err) {
    console.error('$&componentName$& Statistics Database connection error:', err)
    isConnectedDb = false
    throw err
  }
}

function calculateStatistics(data) {
  if (!data || data.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      mode: 0,
      range: 0,
      variance: 0,
      standardDeviation: 0,
      skewness: 0,
      kurtosis: 0,
      q1: 0,
      q3: 0,
      iqr: 0,
      outliers: 0,
      trendDirection: 'stable',
      trendStrength: 0
    }
  }

  const values = data.map(d => d.value).sort((a, b) => a - b)
  const n = values.length

  const min = values[0]
  const max = values[n - 1]
  const sum = values.reduce((acc, val) => acc + val, 0)
  const mean = sum / n
  const range = max - min

  const median = n % 2 === 0 
    ? (values[Math.floor(n / 2) - 1] + values[Math.floor(n / 2)]) / 2
    : values[Math.floor(n / 2)]

  const frequency = {}
  values.forEach(val => frequency[val] = (frequency[val] || 0) + 1)
  const maxFreq = Math.max(...Object.values(frequency))
  const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq)
  const mode = parseFloat(modes[0]) || 0

  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const q1 = values[q1Index]
  const q3 = values[q3Index]
  const iqr = q3 - q1

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
  const standardDeviation = Math.sqrt(variance)

  const skewness = values.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 3), 0) / n

  const kurtosis = values.reduce((acc, val) => acc + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3

  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr
  const outliers = values.filter(val => val < lowerBound || val > upperBound).length

  let trendDirection = 'stable'
  let trendStrength = 0
  
  if (data.length >= 2) {
    const timeValues = data.map((d, i) => i) 
    const dataValues = data.map(d => d.value)
    
    const n = timeValues.length
    const sumX = timeValues.reduce((a, b) => a + b, 0)
    const sumY = dataValues.reduce((a, b) => a + b, 0)
    const sumXY = timeValues.reduce((acc, x, i) => acc + x * dataValues[i], 0)
    const sumXX = timeValues.reduce((acc, x) => acc + x * x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    
    if (Math.abs(slope) > 0.01) {
      trendDirection = slope > 0 ? 'increasing' : 'decreasing'
      trendStrength = Math.abs(slope)
    }
  }

  return {
    count: n,
    min: parseFloat(min.toFixed(3)),
    max: parseFloat(max.toFixed(3)),
    mean: parseFloat(mean.toFixed(3)),
    median: parseFloat(median.toFixed(3)),
    mode: parseFloat(mode.toFixed(3)),
    range: parseFloat(range.toFixed(3)),
    variance: parseFloat(variance.toFixed(3)),
    standardDeviation: parseFloat(standardDeviation.toFixed(3)),
    skewness: parseFloat(skewness.toFixed(3)),
    kurtosis: parseFloat(kurtosis.toFixed(3)),
    q1: parseFloat(q1.toFixed(3)),
    q3: parseFloat(q3.toFixed(3)),
    iqr: parseFloat(iqr.toFixed(3)),
    outliers,
    trendDirection,
    trendStrength: parseFloat(trendStrength.toFixed(3))
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '1d'

    if (!isConnectedDb) {
      await initializeDatabase()
    }

    const now = new Date()
    let startDate
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        break
      case '1m':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }

    const data = await collection.find({
      timestamp: { $gte: startDate }
    }).sort({ timestamp: 1 }).toArray()

    if (!data || data.length === 0) {
      return NextResponse.json({
        period,
        statistics: calculateStatistics([]),
        dataPoints: 0,
        timeRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        },
        error: 'No data available for the selected period'
      })
    }

    const statistics = calculateStatistics(data)

    const oldestRecord = data[0]
    const newestRecord = data[data.length - 1]
    const timeSpan = new Date(newestRecord.timestamp) - new Date(oldestRecord.timestamp)
    const avgInterval = timeSpan / (data.length - 1)

    return NextResponse.json({
      period,
      statistics,
      dataPoints: data.length,
      timeRange: {
        start: oldestRecord.timestamp,
        end: newestRecord.timestamp
      },
      metadata: {
        avgIntervalMs: Math.round(avgInterval),
        timeSpanHours: Math.round(timeSpan / (1000 * 60 * 60) * 100) / 100,
        dataQuality: data.length > 10 ? 'good' : data.length > 2 ? 'fair' : 'poor'
      }
    })

  } catch (error) {
    console.error('$&componentName$& Statistics API error:', error)
    return NextResponse.json({
      period: '1d',
      statistics: calculateStatistics([]),
      dataPoints: 0,
      error: error.message,
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

if (process.env.MONGODB_URI) {
  initializeDatabase().catch(console.error)
}