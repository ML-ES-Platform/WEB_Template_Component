'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Minus, Database, AlertTriangle, Target, Zap, Activity } from 'lucide-react'

export default function $&componentName$&Statistics() {
  const [data, setData] = useState({
    period: '1d',
    statistics: {},
    dataPoints: 0,
    timeRange: { start: '', end: '' },
    metadata: {}
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('1d')

  const fetchStatistics = async (period = '1d') => {
    setLoading(true)
    try {
      const response = await fetch(`/api/microlab/$&componentApi$&/statistics?period=${period}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('$&componentName$& Failed to fetch statistics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatistics(selectedPeriod)
    const interval = setInterval(() => fetchStatistics(selectedPeriod), 30000)
    return () => clearInterval(interval)
  }, [selectedPeriod])

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period)
  }

  const getTrendIcon = () => {
    if (!data.statistics.trendDirection) return <Minus className="w-4 h-4" />
    
    switch (data.statistics.trendDirection) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-red-400" />
      default:
        return <Minus className="w-4 h-4 text-slate-400" />
    }
  }

  const getTrendColor = () => {
    switch (data.statistics.trendDirection) {
      case 'increasing': return 'text-emerald-400'
      case 'decreasing': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const getDataQualityColor = () => {
    switch (data.metadata?.dataQuality) {
      case 'good': return 'text-emerald-400'
      case 'fair': return 'text-amber-400'
      case 'poor': return 'text-red-400'
      default: return 'text-slate-400'
    }
  }

  const StatCard = ({ title, value, unit = '', icon: Icon, subtitle = '', trend = false }) => (
    <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800/40 p-4 hover:border-zinc-700/60 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <Icon className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-slate-300 text-sm font-medium">{title}</span>
        </div>
        {trend && getTrendIcon()}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
          {unit && <span className="text-sm text-slate-400 ml-1 font-normal">{unit}</span>}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-400">{subtitle}</div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-6 shadow-2xl w-full max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border border-cyan-500/20">
              <div className="absolute inset-1 rounded-full border-t-2 border-cyan-400 animate-spin" style={{animationDuration: '0.8s'}}></div>
            </div>
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  const stats = data.statistics || {}

  return (
    <div className="bg-zinc-950/80 backdrop-blur-2xl rounded-3xl border border-zinc-800/50 p-6 shadow-2xl w-full">
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">$&label$& Statistics</h1>
            <p className="text-slate-400 text-sm">{data.dataPoints} data points analyzed</p>
          </div>
        </div>

        <div className="flex space-x-2 bg-zinc-900/60 rounded-xl p-1">
          {['1d', '1m', '1y'].map((period) => (
            <button
              key={period}
              onClick={() => handlePeriodChange(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedPeriod === period
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              {period === '1d' ? '24H' : period === '1m' ? '30D' : '1Y'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard
          title="Count"
          value={stats.count || 0}
          icon={Database}
          subtitle="Total readings"
        />
        <StatCard
          title="Average"
          value={stats.mean || 0}
          unit="$&unit$&"
          icon={Target}
          subtitle="Mean value"
        />
        <StatCard
          title="Minimum"
          value={stats.min || 0}
          unit="$&unit$&"
          icon={TrendingDown}
          subtitle="Lowest reading"
        />
        <StatCard
          title="Maximum"
          value={stats.max || 0}
          unit="$&unit$&"
          icon={TrendingUp}
          subtitle="Highest reading"
        />
        <StatCard
          title="Range"
          value={stats.range || 0}
          unit="$&unit$&"
          icon={Activity}
          subtitle="Max - Min"
        />
        <StatCard
          title="Std Dev"
          value={stats.standardDeviation || 0}
          unit="$&unit$&"
          icon={Zap}
          subtitle="Variability"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        
        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800/40 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-teal-500/20">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Distribution</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Median</span>
              <span className="text-white font-semibold">{stats.median || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Mode</span>
              <span className="text-white font-semibold">{stats.mode || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Variance</span>
              <span className="text-white font-semibold">{stats.variance || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Skewness</span>
              <span className="text-white font-semibold">{stats.skewness || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Kurtosis</span>
              <span className="text-white font-semibold">{stats.kurtosis || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800/40 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Quartiles</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Q1 (25%)</span>
              <span className="text-white font-semibold">{stats.q1 || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Q2 (Median)</span>
              <span className="text-white font-semibold">{stats.median || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Q3 (75%)</span>
              <span className="text-white font-semibold">{stats.q3 || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">IQR</span>
              <span className="text-white font-semibold">{stats.iqr || 0} $&unit$&</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Outliers</span>
              <span className={`font-semibold ${stats.outliers > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stats.outliers || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800/40 p-5">
          <div className="flex items-center space-x-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20">
              <Activity className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Analysis</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Trend</span>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold capitalize ${getTrendColor()}`}>
                  {stats.trendDirection || 'stable'}
                </span>
                {getTrendIcon()}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Strength</span>
              <span className="text-white font-semibold">{stats.trendStrength || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Data Quality</span>
              <span className={`font-semibold capitalize ${getDataQualityColor()}`}>
                {data.metadata?.dataQuality || 'unknown'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Time Span</span>
              <span className="text-white font-semibold">
                {data.metadata?.timeSpanHours ? `${data.metadata.timeSpanHours}h` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-300 text-sm">Avg Interval</span>
              <span className="text-white font-semibold">
                {data.metadata?.avgIntervalMs ? `${Math.round(data.metadata.avgIntervalMs / 1000)}s` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}