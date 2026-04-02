import { useMemo } from 'react'
import NftCard from './NftCard.jsx'

function groupByName(nfts) {
  const map = new Map()
  for (const nft of nfts) {
    const name = nft.properties?.name ?? 'Unknown'
    if (!map.has(name)) {
      map.set(name, { name, type: nft.properties?.type, ids: [], totalSim: 0, count: 0 })
    }
    const g = map.get(name)
    g.ids.push(nft._id)
    g.count++
    g.totalSim += parseFloat(nft.lockedTokens?.SIM ?? '0')
  }
  return Array.from(map.values()).sort((a, b) => b.totalSim - a.totalSim)
}

export default function NftGrid({ nfts, excluded, onToggleGroup, onBurnOne }) {
  const groups = useMemo(() => groupByName(nfts), [nfts])

  if (groups.length === 0) {
    return <p className="text-sm text-zinc-600 py-4">No burnable cards found.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {groups.map(group => (
        <NftCard
          key={group.name}
          name={group.name}
          type={group.type}
          count={group.count}
          totalSim={group.totalSim}
          excluded={group.ids.every(id => excluded.has(id))}
          onToggle={() => onToggleGroup(group.ids)}
          onBurnOne={() => onBurnOne(group)}
        />
      ))}
    </div>
  )
}
