const { sumTokensExport, nullAddress, } = require('../helper/sumTokens')
const { covalentGetTokens } = require('./http')
const axios = require("axios")

function treasuryExports(config) {
  const chains = Object.keys(config)
  const exportObj = {  }
  chains.forEach(chain => {
    let { ownTokenOwners = [], ownTokens, owners = [], fetchTokens = false } = config[chain]
    if (chain === 'solana')  config[chain].solOwners = owners
    const tvlConfig = { ...config[chain] }
    tvlConfig.blacklistedTokens = ownTokens
    if(fetchTokens === true){
      exportObj[chain] = { tvl: async (_, _b, _cb, { api }) => {
        const tokens = await Promise.all(owners.map(address=>covalentGetTokens(address, chain)))
        const uniqueTokens = new Set([...config[chain].tokens, ...tokens.flat()])
        tvlConfig.tokens = Array.from(uniqueTokens)
        return sumTokensExport(tvlConfig)(_, _b, _cb, api)
      }}
    } else {
      exportObj[chain] = { tvl: sumTokensExport(tvlConfig) }
    }

    if (ownTokens) {
      const { solOwners, ...otherOptions } = config[chain]
      const options = { ...otherOptions, owners: [...owners, ...ownTokenOwners], tokens: ownTokens, chain, resolveUniV3: false, }
      exportObj[chain].ownTokens = sumTokensExport(options)
    }
  })
  return exportObj
}

async function getComplexTreasury(owners){
  const networks = ["ethereum", "polygon", "optimism", "gnosis", "binance-smart-chain", "fantom", "avalanche", "arbitrum",
    "celo", "harmony", "moonriver", "bitcoin", "cronos", "aurora", "evmos"]
  const data = await axios.get(`https://api.zapper.xyz/v2/balances/apps?${owners.map(a=>`addresses=${a}`).join("&")}&${networks.map(a=>`networks=${a}`).join("&")}`, {
    headers:{
      Authorization: `Basic ${btoa(process.env.ZAPPER_API_KEY)}`
    }
  })
  let sum = 0
  data.data.forEach(d=>{
    sum+=d.balanceUSD
  })
  return sum
}

module.exports = {
  nullAddress,
  treasuryExports,
  getComplexTreasury
}
