import { useState } from 'react'

export default function DelegatedSection({ delegatedNfts }) {
  const [open, setOpen] = useState(false)

  if (delegatedNfts.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="text-sm font-medium text-zinc-400">Delegated Cards</span>
          <span className="ml-2 text-xs text-zinc-500">{delegatedNfts.length} cards</span>
        </div>
        <span className="text-zinc-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
          <p className="text-xs text-zinc-500">
            These cards are currently delegated and cannot be burned. Undelegate them first to recover their SIM.
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {delegatedNfts.map(nft => (
              <div key={nft._id} className="rounded border border-zinc-700 bg-zinc-800 p-2 text-center opacity-50">
                <p className="text-xs text-zinc-400">#{nft._id}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {parseFloat(nft.lockedTokens?.SIM ?? '0') > 0
                    ? `${nft.lockedTokens.SIM} SIM`
                    : '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
