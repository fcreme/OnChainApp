import { createPublicClient, http, formatUnits } from 'viem'
import { sepolia } from 'viem/chains'
import { env } from '../config/env.js'
import { SEPOLIA_TOKENS } from '../config/constants.js'
import { transactionService } from './TransactionService.js'
import { auditService } from './AuditService.js'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const TRANSFER_EVENT = {
  type: 'event' as const,
  name: 'Transfer' as const,
  inputs: [
    { name: 'from', type: 'address' as const, indexed: true },
    { name: 'to', type: 'address' as const, indexed: true },
    { name: 'value', type: 'uint256' as const, indexed: false },
  ],
}

const APPROVAL_EVENT = {
  type: 'event' as const,
  name: 'Approval' as const,
  inputs: [
    { name: 'owner', type: 'address' as const, indexed: true },
    { name: 'spender', type: 'address' as const, indexed: true },
    { name: 'value', type: 'uint256' as const, indexed: false },
  ],
}

export class BlockchainSyncService {
  private client = createPublicClient({
    chain: sepolia,
    transport: http(env.SEPOLIA_RPC_URL),
  })

  // ── Sync anchors for a wallet across all known tokens ──
  async syncAnchors(wallet: string): Promise<{ anchors_synced: number }> {
    let totalSynced = 0

    for (const [tokenSymbol, tokenInfo] of Object.entries(SEPOLIA_TOKENS)) {
      try {
        const synced = await this.syncTokenAnchors(
          wallet,
          tokenSymbol,
          tokenInfo.address as `0x${string}`,
          tokenInfo.decimals,
        )
        totalSynced += synced
      } catch (err) {
        console.error(`Failed to sync ${tokenSymbol} for ${wallet}:`, err)
      }
    }

    await auditService.log(
      'sync_anchors',
      'system',
      null,
      wallet,
      null,
      { anchors_synced: totalSynced },
    )

    return { anchors_synced: totalSynced }
  }

  private async syncTokenAnchors(
    wallet: string,
    tokenSymbol: string,
    tokenAddress: `0x${string}`,
    decimals: number,
  ): Promise<number> {
    const currentBlock = await this.client.getBlockNumber()
    const fromBlock = currentBlock > 50000n ? currentBlock - 50000n : 0n

    // Fetch outgoing transfers, incoming transfers, and approvals
    const [outgoing, incoming, approvals] = await Promise.all([
      this.client.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        args: { from: wallet as `0x${string}` },
        fromBlock,
        toBlock: 'latest',
      }),
      this.client.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        args: { to: wallet as `0x${string}` },
        fromBlock,
        toBlock: 'latest',
      }),
      this.client.getLogs({
        address: tokenAddress,
        event: APPROVAL_EVENT,
        args: { owner: wallet as `0x${string}` },
        fromBlock,
        toBlock: 'latest',
      }),
    ])

    let synced = 0

    // Process transfers
    for (const log of [...outgoing, ...incoming]) {
      const args = log.args as Record<string, unknown>
      const from = args.from as string
      const to = args.to as string
      const value = args.value as bigint
      const isMint = from.toLowerCase() === ZERO_ADDRESS

      // Get block timestamp
      let timestamp = Date.now()
      try {
        const block = await this.client.getBlock({ blockNumber: log.blockNumber })
        timestamp = Number(block.timestamp) * 1000
      } catch { /* use current time as fallback */ }

      try {
        await transactionService.upsertAnchor({
          tx_hash: log.transactionHash,
          type: isMint ? 'Mint' : 'Transfer',
          token_symbol: tokenSymbol,
          token_address: tokenAddress,
          amount_gross: formatUnits(value, decimals),
          sender_address: from,
          receiver_address: to,
          timestamp,
          block_number: Number(log.blockNumber),
        })
        synced++
      } catch { /* duplicate or error, skip */ }
    }

    // Process approvals
    for (const log of approvals) {
      const args = log.args as Record<string, unknown>
      const owner = args.owner as string
      const spender = args.spender as string
      const value = args.value as bigint

      let timestamp = Date.now()
      try {
        const block = await this.client.getBlock({ blockNumber: log.blockNumber })
        timestamp = Number(block.timestamp) * 1000
      } catch { /* use current time */ }

      try {
        await transactionService.upsertAnchor({
          tx_hash: log.transactionHash,
          type: 'Approval',
          token_symbol: tokenSymbol,
          token_address: tokenAddress,
          amount_gross: formatUnits(value, decimals),
          sender_address: owner,
          receiver_address: spender,
          timestamp,
          block_number: Number(log.blockNumber),
        })
        synced++
      } catch { /* duplicate or error, skip */ }
    }

    return synced
  }
}

export const blockchainSyncService = new BlockchainSyncService()
