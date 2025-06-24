'use client'

import { useState, useEffect } from 'react'
import { $&icon$&, Wifi, WifiOff, Database, DatabaseZap, Activity, TrendingUp, BarChart3 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const MAX_POINTS = 300

export default function $&componentName$&() {
  const [data, setData] = useState(null) 
  const [loading, setLoading] = useState(true)
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const initializeWithFullData = async () => {
      try {
        const response = await fetch('/api/microlab/$&componentApi$&')
        const result = await response.json()
        setData(result)
        setLoading(false)
        
        console.log('$&componentName$& Initial data loaded:', result.data.length, 'points')
        
        const interval = setInterval(async () => {
          try {
            if (result.data.length > 0) {
              const sortedData = [...result.data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              const lastTimestamp = sortedData[0]?.timestamp
              
              if (lastTimestamp) {

                const incrementalResponse = await fetch(`/api/microlab/$&componentApi$&?since=${lastTimestamp}`)
                const incrementalResult = await incrementalResponse.json()
                
                if (incrementalResult.isIncremental && incrementalResult.data.length > 0) {
                  setData(prev => ({
                    ...incrementalResult,
                    data: maintainArraySize(prev.data, incrementalResult.data)
                  }))
                }
              }
            }
          } catch (error) {
            console.error('$&componentName$& Polling error:', error)
          }
        }, $&pollingInterval$&)
        
        return () => clearInterval(interval)
        
      } catch (error) {
        console.error('$&componentName$& Chart Failed to fetch initial data:', error)
        setLoading(false)
      }
    }

    initializeWithFullData()
  }, []) 

  const maintainArraySize = (currentData, newData) => {
    const combined = [...currentData, ...newData]
    
    combined.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    const unique = combined.filter((item, index, arr) => 
      index === arr.findIndex(t => t.timestamp === item.timestamp)
    )
    
    if (unique.length > MAX_POINTS) {
      return unique.slice(-MAX_POINTS)
    }
    
    return unique
  }

  useEffect(() => {
    if (!data) return
    
    const updateTimeAgo = () => {
      const now = new Date()
      const date = new Date(data.current.timestamp)
      const diffMs = now - date
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)

      if (diffSeconds < 60) {
        setTimeAgo(diffSeconds < 1 ? 'now' : `${diffSeconds}s`)
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins}m`)
      } else if (diffHours === 1) {
        setTimeAgo('1h')
      } else {
        setTimeAgo(date.toLocaleString([], { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }))
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000)
    return () => clearInterval(interval)
  }, [data?.current.timestamp])

  if (loading || !data) {
    return (
      <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-6 shadow-2xl w-[400px] flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border border-cyan-500/20">
            <div className="absolute inset-1 rounded-full border-t-2 border-cyan-400 animate-spin" style={{animationDuration: '0.8s'}}></div>
          </div>
          <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  const getStatusColor = () => {
    switch (data.current.status) {
      case 'live': return { 
        bg: 'from-emerald-500 via-teal-500 to-cyan-500', 
        glow: 'shadow-emerald-500/30',
        pulse: 'animate-pulse'
      }
      case 'cached': return { 
        bg: 'from-amber-500 via-orange-500 to-yellow-500', 
        glow: 'shadow-amber-500/30',
        pulse: ''
      }
      case 'stale': return { 
        bg: 'from-red-500 via-rose-500 to-pink-500', 
        glow: 'shadow-red-500/30',
        pulse: ''
      }
      default: return { 
        bg: 'from-slate-600 via-slate-500 to-slate-600', 
        glow: 'shadow-slate-500/20',
        pulse: ''
      }
    }
  }

  const getStatusText = () => {
    switch (data.current.status) {
      case 'live': return 'LIVE'
      case 'cached': return 'CACHE'
      case 'stale': return 'STALE'
      default: return 'UNKNOWN'
    }
  }

  const formatTooltipTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatXAxisTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffHours = (now - date) / (1000 * 60 * 60)
    
    if (diffHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  const getMinMax = () => {
    if (data.data.length === 0) return { min: 0, max: 100 }
    
    const values = data.data.map(d => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1 || 1
    
    return {
      min: Math.max(0, min - padding),
      max: max + padding
    }
  }

  const { min, max } = getMinMax()
  const statusStyle = getStatusColor()

  return (
    <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-3 shadow-2xl w-[600px] flex flex-col">
      
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className={`relative p-2 rounded-full bg-gradient-to-r ${statusStyle.bg}`}>
              <$&icon$& className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">$&label$&</h1>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-black text-white">
                {data.current.value.toFixed(1)}
                <span className="text-lg text-slate-400 ml-2">$&unit$&</span>
              </div>
              <div className="flex items-center space-x-1 text-slate-400 text-sm">
                <BarChart3 className="w-4 h-4" />
                <span>{data.data.length} pts</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
                  {timeAgo}
                </span>
            </div>
            {data.current.mqttConnected ? (
              <div className="relative">
                <Wifi className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
                <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur animate-pulse"></div>
              </div>
            ) : (
              <WifiOff className="w-5 h-5 text-slate-500/70" />
            )}
            
            {data.current.dbConnected ? (
              <div className="relative">
                <DatabaseZap className="w-5 h-5 text-emerald-400 drop-shadow-lg" />
                <div className="absolute -inset-1 bg-cyan-400/20 rounded-full blur animate-pulse"></div>
              </div>
            ) : (
              <Database className="w-5 h-5 text-slate-500/70" />
            )}
          </div>
          
          <div className={`flex items-center px-3 py-1 rounded-lg bg-gradient-to-r ${statusStyle.bg} text-white text-xs font-bold uppercase tracking-widest shadow-lg ${statusStyle.glow} ${statusStyle.pulse}`}>
            <Activity className="w-3 h-3 mr-1" />
            {getStatusText()}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.data} margin={{ top: 5, right: 10, left: 5, bottom: 15 }}>
                <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="30%" stopColor="#0891B2" />
                    <stop offset="70%" stopColor="#0E7490" />
                    <stop offset="100%" stopColor="#164E63" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="#0891B2" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#0E7490" stopOpacity={0.05} />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                </filter>
                </defs>
                <CartesianGrid 
                strokeDasharray="2 4" 
                stroke="#374151" 
                opacity={0.2}
                horizontal={true}
                vertical={false}
                />
                <XAxis 
                dataKey="timestamp"
                tickFormatter={formatXAxisTime}
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickCount={6}
                interval="preserveStartEnd"
                minTickGap={20}
                />
                <YAxis 
                domain={[min, max]}
                stroke="#6B7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                tickFormatter={(value) => value.toFixed(1)}
                width={35}
                />
                <Tooltip 
                contentStyle={{
                    backgroundColor: 'rgba(24, 24, 27, 0.95)',
                    border: '1px solid #52525B',
                    borderRadius: '16px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 20px rgba(6, 182, 212, 0.1)',
                    backdropFilter: 'blur(12px)',
                    padding: '12px 16px'
                }}
                labelStyle={{
                    color: '#CBD5E1',
                    fontSize: '11px',
                    fontWeight: '500',
                    marginBottom: '4px'
                }}
                itemStyle={{
                    color: '#06B6D4',
                    fontSize: '13px',
                    fontWeight: '600'
                }}
                labelFormatter={(value) => formatTooltipTime(value)}
                formatter={(value) => [`${value.toFixed(2)} $&unit$&`, '$&label$&']}
                cursor={{
                    stroke: '#06B6D4',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                    opacity: 0.6
                }}
                />
                <Line 
                type="monotone" 
                dataKey="value" 
                stroke="url(#gradient)"
                strokeWidth={3}
                dot={false}
                isAnimationActive={true}
                animationDuration={2000}
                animationBegin={0}
                filter="url(#glow)"
                activeDot={{ 
                    r: 5, 
                    fill: '#06B6D4',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                    filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.6))'
                }}
                />
            </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}