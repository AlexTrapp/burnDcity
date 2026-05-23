// Seed nodes — tried first, no network overhead
const SEED_NODES = [
  'https://engine.hive.pizza/contracts',
  'https://herpc.actifit.io/contracts',
  'https://enginerpc.com/contracts',
  'https://api.hive-engine.com/contracts',
]

// Hive RPC nodes used to read the flowerengine account metadata
const HIVE_RPC_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
]

// Cached FlowerEngine node list — fetched only if seed nodes are exhausted
let flowerEngineCache = null

// Index into the active node list — we stay on the last working node
// rather than restarting from index 0 on every batch
let currentNodeIndex = 0
let activeNodeList = [...SEED_NODES]

function toContractsUrl(raw) {
  const base = raw.replace(/\/$/, '')
  if (base.endsWith('/rpc')) return base.slice(0, -4) + '/contracts'
  if (base.endsWith('/contracts')) return base
  return base + '/contracts'
}

async function fetchFlowerEngineNodes() {
  if (flowerEngineCache) return flowerEngineCache

  for (const rpc of HIVE_RPC_NODES) {
    try {
      const res = await fetch(rpc, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_accounts',
          params: [['flowerengine']],
          id: 1,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const account = data?.result?.[0]
      if (!account) continue

      const meta = JSON.parse(account.json_metadata || '{}')
      const nodes = meta?.nodes
      if (!Array.isArray(nodes) || nodes.length === 0) continue

      const failingSet = new Set(Object.keys(meta.failing_nodes ?? {}))
      const active = nodes
        .filter(n => !failingSet.has(n))
        .map(toContractsUrl)
        .filter(n => !SEED_NODES.includes(n)) // skip seeds we already tried

      if (active.length === 0) continue

      flowerEngineCache = active
      return active
    } catch {
      // try next Hive RPC
    }
  }

  return []
}

async function tryNode(node, body) {
  const res = await fetch(node, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const data = JSON.parse(text) // throws if node returns HTML
  // A null result with an error field means the node rejected the request
  // (e.g. rate-limited) — throw so we try the next node instead of
  // treating it as an empty/complete page
  if (data.result === null || data.result === undefined) {
    throw new Error(data.error ?? 'null result')
  }
  return data.result
}

async function queryContract(contract, table, query, limit = 1000, offset = 0, onStatus) {
  const body = { jsonrpc: '2.0', id: 1, method: 'find', params: { contract, table, query, limit, offset } }

  // Try every node starting from the last one that worked
  const start = currentNodeIndex
  for (let i = 0; i < activeNodeList.length; i++) {
    const idx = (start + i) % activeNodeList.length
    try {
      const result = await tryNode(activeNodeList[idx], body)
      currentNodeIndex = idx // remember this node for the next batch
      return result
    } catch {
      // try next
    }
  }

  // All current nodes failed — fetch FlowerEngine extras and expand the list
  onStatus?.('Seed nodes unavailable — fetching backup node list from FlowerEngine…')
  const extras = await fetchFlowerEngineNodes()

  if (extras.length === 0) {
    throw new Error('All nodes exhausted and FlowerEngine returned no extras.')
  }

  // Append extras to the active list and continue from where we left off
  activeNodeList = [...activeNodeList, ...extras]

  for (const node of extras) {
    const idx = activeNodeList.indexOf(node)
    try {
      const result = await tryNode(node, body)
      currentNodeIndex = idx
      onStatus?.(`Connected via ${new URL(node).hostname}`)
      return result
    } catch {
      // try next extra
    }
  }

  throw new Error('All nodes exhausted — please try again later.')
}

// Returns { nfts, nextOffset, hasMore }
// Pass startOffset to resume a previous fetch ("Load more").
export async function getAllCityNfts(username, startOffset = 0, onProgress, onStatus) {
  const all = []
  let offset = startOffset
  while (true) {
    const page = await queryContract(
      'nft',
      'CITYinstances',
      { account: username, ownedBy: 'u' },
      1000,
      offset,
      onStatus
    )
    all.push(...page)
    offset += page.length
    onProgress?.(all.length)
    if (page.length < 1000) break
  }
  return { nfts: all, nextOffset: offset, hasMore: all.length > 0 && all.length % 1000 === 0 }
}

export function partitionNfts(nfts) {
  const isContainer = n => Array.isArray(n.lockedNfts) && n.lockedNfts.length > 0
  return {
    combined:  nfts.filter(n => isContainer(n)),
    burnable:  nfts.filter(n => !isContainer(n) && !n.delegatedTo),
    delegated: nfts.filter(n => !!n.delegatedTo),
  }
}

export function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
