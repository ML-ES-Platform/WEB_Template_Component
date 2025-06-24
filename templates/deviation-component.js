'use client'

import { useState, useEffect } from 'react'
import { $&icon$&, Wifi, WifiOff, Database, DatabaseZap, Activity, Target, TrendingUp, TrendingDown } from 'lucide-react'

export default function $&componentName$&() {
  const [data, setData] = useState({
    value: 0,
    setpoint: $&setpoint$&,
    deviation: 0,
    timestamp: new Date().toISOString(),
    status: 'stale',
    mqttConnected: false,
    dbConnected: false
  })
  const [loading, setLoading] = useState(true)
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/microlab/$&componentApi$&')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('$&componentName$& Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, $&pollingInterval$&)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const updateTimeAgo = () => {
      const now = new Date()
      const date = new Date(data.timestamp)
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
  }, [data.timestamp])

  const getStatusColor = () => {
    switch (data.status) {
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
    switch (data.status) {
      case 'live': return 'LIVE'
      case 'cached': return 'CACHE'
      case 'stale': return 'STALE'
      default: return 'UNKNOWN'
    }
  }

  const getDeviationColor = () => {
    const absDeviation = Math.abs(data.deviation)
    if (absDeviation < 1) return 'text-emerald-400'
    if (absDeviation < 5) return 'text-amber-400'
    return 'text-red-400'
  }

  const getDeviationBgColor = () => {
    const absDeviation = Math.abs(data.deviation)
    if (absDeviation < 1) return 'from-emerald-500/20 to-emerald-600/20'
    if (absDeviation < 5) return 'from-amber-500/20 to-amber-600/20'
    return 'from-red-500/20 to-red-600/20'
  }

  const getSliderPosition = () => {
    const maxDeviation = $&maxDeviation$& || 10
    const absDeviation = Math.abs(data.deviation)
    
    if (absDeviation === 0) return 50
    
    const logScale = Math.log(1 + absDeviation) / Math.log(1 + maxDeviation) * 50
    
    return data.deviation > 0 ? 50 + logScale : 50 - logScale
  }

  const sliderPosition = getSliderPosition()

  if (loading) {
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

  const statusStyle = getStatusColor()

  return (
    <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-3 shadow-2xl w-[400px]">
      
      <div className="flex items-center justify-between mb-3 gap-6">
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <div className={`relative p-2 rounded-full bg-gradient-to-r ${statusStyle.bg}`}>
              <$&icon$& className="w-7 h-7 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">$&label$&</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {data.mqttConnected ? (
            <div className="relative">
              <Wifi className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
              <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur animate-pulse"></div>
            </div>
          ) : (
            <WifiOff className="w-6 h-6 text-slate-500/70" />
          )}
          
          {data.dbConnected ? (
            <div className="relative">
              <DatabaseZap className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
              <div className="absolute -inset-1 bg-cyan-400/20 rounded-full blur animate-pulse"></div>
            </div>
          ) : (
            <Database className="w-6 h-6 text-slate-500/70" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm text-slate-400 uppercase tracking-wider mb-1">Current</div>
          <div className="text-4xl font-black text-white">
            {data.value.toFixed(1)}
            <span className="text-lg text-slate-400 ml-2">$&unit$&</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-sm text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
            <Target className="w-3 h-3" />
            Target
          </div>
          <div className="text-4xl font-black text-slate-300">
            {data.setpoint.toFixed(1)}
            <span className="text-lg text-slate-400 ml-2">$&unit$&</span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-center mb-4">
          <div className="text-sm text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
            {data.deviation > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            Deviation
          </div>
          <div className={`text-6xl font-black ${getDeviationColor()} flex items-center justify-center gap-2`}>
            {data.deviation > 0 ? '+' : ''}{data.deviation.toFixed(1)}
            <span className="text-2xl text-slate-400">$&unit$&</span>
          </div>
        </div>

        <div className="relative h-8 bg-zinc-800/50 rounded-full overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r ${getDeviationBgColor()} opacity-30`}></div>
          
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 transform -translate-x-0.5"></div>
          
          <div 
            className={`absolute top-1 bottom-1 w-2 rounded-full transition-all duration-500 ease-out ${
              data.deviation > 0 ? 'bg-gradient-to-r from-amber-400 to-red-400' : 'bg-gradient-to-r from-blue-400 to-cyan-400'
            }`}
            style={{ 
              left: `${sliderPosition}%`,
              transform: 'translateX(-50%)',
              boxShadow: `0 0 10px ${data.deviation > 0 ? '#f59e0b' : '#06b6d4'}40`
            }}
          ></div>
          
          <div className="absolute top-0 bottom-0 left-1/4 w-px bg-slate-600"></div>
          <div className="absolute top-0 bottom-0 right-1/4 w-px bg-slate-600"></div>
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-1 px-2">
          <span>-{$&maxDeviation$& || 10}</span>
          <span>0</span>
          <span>+{$&maxDeviation$& || 10}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
          <span className="text-slate-400 text-sm font-medium uppercase tracking-wider">
            {timeAgo}
          </span>
        </div>
        
        <div className={`flex items-center px-4 py-2 rounded-xl bg-gradient-to-r ${statusStyle.bg} text-white text-xs font-bold uppercase tracking-widest shadow-lg ${statusStyle.glow} ${statusStyle.pulse}`}>
          <Activity className="w-4 h-4 mr-2" />
          {getStatusText()}
        </div>
      </div>

    </div>
  )
}