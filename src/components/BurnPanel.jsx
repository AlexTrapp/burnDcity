import { useState } from 'react'
import { burnBroadcast } from '../api/keychain.js'
import { chunk, delay } from '../api/hiveEngine.js'

export default function BurnPanel({ username, selectedNfts, onBurned }) {
  const [status, setStatus] = useState('idle') // idle | burning | done | cancelled
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [result, setResult] = useState({ burned: 0, total: 0, simRecovered: 0 })

  const totalSim = selectedNfts.reduce(
    (s, n) => s + parseFloat(n.lockedTokens?.SIM ?? '0'), 0
  )
  const count = selectedNfts.length

  async function handleBurn() {
    if (count === 0) return
    setStatus('burning')
    const batches = chunk([...selectedNfts].sort((a, b) => b._id - a._id), 250)
    setProgress({ current: 0, total: batches.length })
    const burnedIds = []
    try {
      for (let i = 0; i < batches.length; i++) {
        setProgress({ current: i + 1, total: batches.length })
        await burnBroadcast(username, batches[i].map(n => n._id.toString()))
        batches[i].forEach(n => burnedIds.push(n._id))
        if (i < batches.length - 1) await delay(2000)
      }
      setResult({ burned: batches.length, total: batches.length, simRecovered: totalSim })
      setStatus('done')
      onBurned?.(burnedIds)
    } catch {
      setResult({ burned: burnedIds.length, total: batches.length, simRecovered: 0 })
      setStatus('cancelled')
      onBurned?.(burnedIds)
    }
  }

  function buttonLabel() {
    if (status === 'burning') {
      return `Prompt ${progress.current} of ${progress.total}… (do not close this tab)`
    }
    if (status === 'done') {
      return `Done. ${result.simRecovered.toFixed(3)} SIM recovered.`
    }
    if (status === 'cancelled') {
      return `Stopped after ${result.burned} of ${result.total} batches.`
    }
    if (count === selectedNfts.length && count > 0) {
      return 'Recover SIM from All Cards'
    }
    return `Recover SIM from ${count} Cards`
  }

  const isBurning = status === 'burning'
  const isTerminal = status === 'done' || status === 'cancelled'

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-amber-400">
            {totalSim.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 3 })} SIM
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {count} card{count !== 1 ? 's' : ''} selected to burn
          </p>
        </div>
      </div>

      {isBurning && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-zinc-500">
            Prompt {progress.current} of {progress.total}
          </p>
        </div>
      )}

      <button
        onClick={handleBurn}
        disabled={isBurning || isTerminal || count === 0}
        className="w-full rounded-md bg-amber-500 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {buttonLabel()}
      </button>

      {status === 'cancelled' && (
        <p className="text-xs text-zinc-500">
          Burn was stopped. Cards not yet burned remain in your account. Refresh to try again.
        </p>
      )}
    </div>
  )
}
