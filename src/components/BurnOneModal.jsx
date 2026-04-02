import { useState, useMemo } from 'react'
import { burnBroadcast, keychainAvailable } from '../api/keychain.js'

const TYPE_LABELS = {
  '1st':      '1st Edition',
  '2nd':      '2nd Edition',
  '3rd':      '3rd Edition',
  'citizen':  'Citizen',
  'combined': 'Combined',
}

export default function BurnOneModal({ username, group, onClose, onBurned }) {
  const [status, setStatus]     = useState('idle') // idle | burning | error
  const [errorMsg, setErrorMsg] = useState(null)
  const [quantity, setQuantity] = useState(1)

  const maxQty     = Math.min(250, group.count)
  const simPerCard = group.count > 0 ? group.totalSim / group.count : 0
  const typeLabel  = TYPE_LABELS[group.type] ?? group.type ?? '—'

  // Sort descending once — highest ID burned first
  const sortedIds = useMemo(
    () => [...group.ids].sort((a, b) => b - a),
    [group.ids]
  )
  const selectedIds = sortedIds.slice(0, quantity)
  const selectedStrIds = selectedIds.map(id => id.toString())

  // Build the same operations array that burnBroadcast will sign
  const opsPreview = []
  for (let i = 0; i < selectedStrIds.length; i += 50) {
    const batch = selectedStrIds.slice(i, i + 50)
    opsPreview.push([
      'custom_json',
      {
        required_auths: [username],
        required_posting_auths: [],
        id: 'ssc-mainnet-hive',
        json: JSON.stringify({
          contractName: 'nft',
          contractAction: 'burn',
          contractPayload: { nfts: [{ symbol: 'CITY', ids: batch }] },
        }),
      },
    ])
  }

  function adjustQty(delta) {
    setQuantity(q => Math.max(1, Math.min(maxQty, q + delta)))
  }

  function handleQtyInput(e) {
    const v = parseInt(e.target.value, 10)
    if (!isNaN(v)) setQuantity(Math.max(1, Math.min(maxQty, v)))
  }

  async function handleConfirm() {
    if (!keychainAvailable()) {
      setErrorMsg('Hive Keychain extension not found. Install it at hive-keychain.com')
      return
    }
    setStatus('burning')
    setErrorMsg(null)
    try {
      await burnBroadcast(username, selectedStrIds)
      onClose()
      onBurned?.(selectedIds)
    } catch (e) {
      setErrorMsg(e.message ?? 'Keychain request failed')
      setStatus('error')
    }
  }

  function handleClose() {
    if (status === 'burning') return
    onClose()
  }

  const isBurning = status === 'burning'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-6 space-y-5 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-zinc-100">Burn cards</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{group.name} · {typeLabel}</p>
        </div>

        {/* Quantity selector */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">How many to burn</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustQty(-1)}
              disabled={quantity <= 1 || isBurning}
              className="w-8 h-8 rounded-md border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              min={1}
              max={maxQty}
              onChange={handleQtyInput}
              disabled={isBurning}
              className="w-20 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-center text-sm text-zinc-200 focus:outline-none focus:border-zinc-500 disabled:opacity-40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => adjustQty(1)}
              disabled={quantity >= maxQty || isBurning}
              className="w-8 h-8 rounded-md border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-lg leading-none"
            >
              +
            </button>
            <span className="text-xs text-zinc-600">of {group.count} in stack</span>
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">SIM to recover</span>
            <span className="font-semibold text-amber-400">
              {(simPerCard * quantity).toLocaleString(undefined, { maximumFractionDigits: 3 })} SIM
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Remaining after burn</span>
            <span className="text-zinc-400">{group.count - quantity}</span>
          </div>
        </div>

        {/* JSON preview */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Broadcast operations ({opsPreview.length} × custom_json)
          </p>
          <pre className="rounded-md border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-300 overflow-x-auto overflow-y-auto max-h-48 leading-relaxed">
{JSON.stringify(opsPreview, null, 2)}
          </pre>
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-sm text-red-400">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isBurning}
            className="flex-1 rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBurning}
            className="flex-1 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isBurning  && 'Burning…'}
            {!isBurning && (status === 'error' ? 'Retry' : `Burn ${quantity}`)}
          </button>
        </div>
      </div>
    </div>
  )
}
