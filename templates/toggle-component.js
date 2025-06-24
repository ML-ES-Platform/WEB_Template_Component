'use client'

import { useState, useEffect } from 'react'
import { $&icon$&, Wifi, WifiOff, Database, DatabaseZap, Activity, Power, PowerOff } from 'lucide-react'

export default function $&componentName$&() {
  const [data, setData] = useState({
    value: 0,
    timestamp: new Date().toISOString(),
    status: 'stale',
    mqttConnected: false,
    dbConnected: false,
    isOn: false
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

  const getToggleStyle = () => {
    if (data.isOn) {
      return {
        bg: 'from-emerald-400 via-green-500 to-emerald-600',
        glow: 'shadow-emerald-500/50',
        pulse: data.status === 'live' ? 'animate-pulse' : '',
        text: 'text-white',
        shadow: 'drop-shadow-2xl'
      }
    } else {
      return {
        bg: 'from-slate-600 via-slate-700 to-slate-800',
        glow: 'shadow-slate-500/30',
        pulse: '',
        text: 'text-slate-300',
        shadow: 'drop-shadow-lg'
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
  const toggleStyle = getToggleStyle()

  return (
    <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-3 shadow-2xl w-[350px] flex flex-col justify-between min-h-[200px]">
      
      <div className="flex items-center justify-between mb-3 gap-6">
        <div className="flex items-center space-x-2">
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

      <div className="text-center mb-3 relative">
        <div className={`relative inline-flex items-center justify-center w-48 h-24 rounded-2xl bg-gradient-to-r ${toggleStyle.bg} shadow-2xl ${toggleStyle.glow} ${toggleStyle.pulse} ${toggleStyle.shadow} transition-all duration-500 ease-in-out`}>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 to-transparent"></div>
          <div className="flex items-center space-x-4 relative z-10">
            {data.isOn ? (
              <Power className={`w-12 h-12 ${toggleStyle.text} ${toggleStyle.shadow}`} />
            ) : (
              <PowerOff className={`w-12 h-12 ${toggleStyle.text} ${toggleStyle.shadow}`} />
            )}
            <div className={`text-4xl font-black ${toggleStyle.text} ${toggleStyle.shadow} tracking-tight`}>
              {data.isOn ? 'ON' : 'OFF'}
            </div>
          </div>
          
          {data.isOn && data.status === 'live' && (
            <>
              <div className="absolute -inset-2 rounded-2xl bg-emerald-400/20 blur-xl"></div>
              <div className="absolute inset-0 rounded-2xl">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/30 via-transparent to-emerald-400/30"></div>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-4 text-sm font-medium text-slate-400 tracking-wider uppercase">
          State: {data.value === 1 ? '1 (Active)' : '0 (Inactive)'}
        </div>
      </div>

      <div className="flex items-center justify-between p-2">
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