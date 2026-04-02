export function keychainAvailable() {
  return typeof window !== 'undefined' && !!window.hive_keychain
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
