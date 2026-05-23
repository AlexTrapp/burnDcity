import { useMemo, useState } from 'react'

// Cards known to fail on-chain when burned — Keychain accepts but the sidechain rejects.
const NON_BURNABLE = new Set(['Bones'])

function groupByName(nfts) {
  const map = new Map()
  for (const nft of nfts) {
    const name = nft.properties?.name ?? `#${nft._id}`
    if (!map.has(name)) {
      map.set(name, { name, type: 'combined', ids: [], count: 0, totalSim: 0, totalInner: 0, isNonBurnable: NON_BURNABLE.has(nft.properties?.name) })
    }
    const g = map.get(name)
    g.ids.push(nft._id)
    g.count++
    g.totalInner += nft.lockedNfts?.reduce((s, e) => s + (e.ids?.length ?? 1), 0) ?? 0
  }
  return Array.from(map.values()).sort((a, b) => b.ids.length - a.ids.length || a.name.localeCompare(b.name))
}

export default function CombinedSection({ combinedNfts, onBurnOne }) {
  const [open, setOpen] = useState(true)

  const groups = useMemo(() => groupByName(combinedNfts), [combinedNfts])

  if (combinedNfts.length === 0) return null

  const nonBurnableCount = combinedNfts.filter(n => NON_BURNABLE.has(n.properties?.name)).length

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div>
          <span className="text-sm font-medium text-zinc-200">Combined Cards</span>
          <span className="ml-2 text-xs text-zinc-500">{combinedNfts.length} cards</span>
          {nonBurnableCount > 0 && (
            <span className="ml-2 text-xs text-amber-600">{nonBurnableCount} cannot burn</span>
          )}
        </div>
        <span className="text-zinc-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-5 py-4 space-y-4">
          <p className="text-xs text-zinc-500">
            Combined cards hold inner CITY cards. Burning them releases the inner cards back to your account — they'll appear after a reload.
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {groups.map(group => (
              <div
                key={group.name}
                onClick={() => !group.isNonBurnable && onBurnOne(group)}
                className={`rounded border p-2.5 transition-all select-none ${
                  group.isNonBurnable
                    ? 'border-zinc-800 bg-zinc-900 opacity-50 cursor-not-allowed'
                    : 'border-zinc-700 bg-zinc-800 cursor-pointer hover:border-zinc-600'
                }`}
              >
                <p className="text-xs font-medium text-zinc-200 leading-snug">{group.name}</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  ×{group.ids.length}
                  {group.totalInner > 0 ? ` · ${group.totalInner} inside` : ''}
                </p>
                {group.isNonBurnable
                  ? <p className="text-xs text-amber-600 mt-1">cannot burn</p>
                  : <p className="text-xs text-zinc-600 mt-1">click to burn</p>
                }
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
