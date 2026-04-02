import { useState } from 'react'
import { burnBatch } from '../api/keychain.js'
import { chunk, delay } from '../api/hiveEngine.js'

export default function CombinedSection({ username, combinedNfts, onBurned }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  if (combinedNfts.length === 0) return null

  async function handleBurnCombined() {
    setStatus('burning')
    const batches = chunk([...combinedNfts].sort((a, b) => b._id - a._id), 50)
    setProgress({ current: 0, total: batches.length })
    const burnedIds = []
    try {
      for (let i = 0; i < batches.length; i++) {
        setProgress({ current: i + 1, total: batches.length })
        await burnBatch(username, batches[i].map(n => n._id.toString()))
        batches[i].forEach(n => burnedIds.push(n._id))
        if (i < batches.length - 1) await delay(2000)
      }
      setStatus('done')
      onBurned?.(burnedIds)
    } catch {
      setStatus('cancelled')
      onBurned?.(burnedIds)
    }
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="text-sm font-medium text-zinc-200">Combined Cards</span>
          <span className="ml-2 text-xs text-zinc-500">{combinedNfts.length} cards</span>
        </div>
        <span className="text-zinc-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
          <p className="text-xs text-zinc-500">
            Combined cards hold inner CITY cards. Burning them releases the inner cards back to your account — they'll appear after a refresh.
          </p>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {combinedNfts.map(nft => (
              <div key={nft._id} className="rounded border border-zinc-700 bg-zinc-800 p-2 text-center">
                <p className="text-xs text-zinc-400">#{nft._id}</p>
              </div>
            ))}
          </div>

          {status === 'idle' && (
            <button
              onClick={handleBurnCombined}
              className="rounded-md border border-purple-600 px-4 py-2 text-sm text-purple-400 hover:bg-purple-950 transition-colors"
            >
              Burn {combinedNfts.length} Combined Card{combinedNfts.length !== 1 ? 's' : ''}
            </button>
          )}
          {status === 'burning' && (
            <p className="text-xs text-zinc-400">
              Burning batch {progress.current} of {progress.total}… (do not close this tab)
            </p>
          )}
          {status === 'done' && (
            <p className="text-xs text-green-500">Done. Inner cards released — use Reload to load them.</p>
          )}
          {status === 'cancelled' && (
            <p className="text-xs text-red-400">Stopped. Some combined cards may not have been burned.</p>
          )}
        </div>
      )}
    </div>
  )
}
