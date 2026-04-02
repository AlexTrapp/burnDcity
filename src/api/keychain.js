export function keychainAvailable() {
  return typeof window !== 'undefined' && !!window.hive_keychain
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export function verifyAccount(username) {
  return new Promise((resolve, reject) => {
    window.hive_keychain.requestSignBuffer(
      username,
      'Verify dCity Burn Tool login',
      'Posting',
      (response) => {
        if (response.success) resolve(username)
        else reject(new Error(response.message ?? 'Keychain request cancelled'))
      }
    )
  })
}

export function burnBatch(username, ids) {
  return new Promise((resolve, reject) => {
    window.hive_keychain.requestCustomJson(
      username,
      'ssc-mainnet-hive',
      'Active',
      JSON.stringify({
        contractName: 'nft',
        contractAction: 'burn',
        contractPayload: { nfts: [{ symbol: 'CITY', ids }] },
      }),
      'Burn dCity NFTs',
      (response) => {
        if (response.success) resolve(response)
        else reject(new Error(response.message ?? 'Keychain request cancelled'))
      }
    )
  })
}

// Broadcast up to 250 IDs in a single Keychain prompt.
// Hive consensus allows max 5 custom_json ops per account per block.
// Each op holds max 50 IDs → 5 × 50 = 250 hard ceiling.
export function burnBroadcast(username, ids) {
  const operations = chunk(ids, 50).slice(0, 5).map(batch => [
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
  return new Promise((resolve, reject) => {
    window.hive_keychain.requestBroadcast(
      username,
      operations,
      'Active',
      (response) => {
        if (response.success) resolve(response)
        else reject(new Error(response.message ?? 'Keychain request cancelled'))
      }
    )
  })
}
