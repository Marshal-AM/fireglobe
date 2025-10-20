import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, formatUnits, http } from 'viem'
import { sepolia } from 'viem/chains'

const DATACOIN_ADDRESS = process.env.NEXT_PUBLIC_DATACOIN_ADDRESS || '0x3D2f760c3Bb59BC74B6BE357e3c20Aad708a9667'
const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://1rpc.io/sepolia'

const DataCoinAbi = [
  { inputs: [], name: 'decimals', outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }], stateMutability: 'view', type: 'function' },
  { inputs: [{ internalType: 'address', name: 'account', type: 'address' }], name: 'balanceOf', outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }], stateMutability: 'view', type: 'function' },
  { inputs: [], name: 'symbol', outputs: [{ internalType: 'string', name: '', type: 'string' }], stateMutability: 'view', type: 'function' }
]

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get('address')
    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 })
    }

    const client = createPublicClient({ chain: sepolia, transport: http(SEPOLIA_RPC_URL) })
    const [decimals, raw, symbol] = await Promise.all([
      client.readContract({ address: DATACOIN_ADDRESS as `0x${string}`, abi: DataCoinAbi as any, functionName: 'decimals', args: [] }),
      client.readContract({ address: DATACOIN_ADDRESS as `0x${string}`, abi: DataCoinAbi as any, functionName: 'balanceOf', args: [address as `0x${string}`] }),
      client.readContract({ address: DATACOIN_ADDRESS as `0x${string}`, abi: DataCoinAbi as any, functionName: 'symbol', args: [] })
    ])

    return NextResponse.json({
      success: true,
      address,
      symbol,
      balance: formatUnits(raw as bigint, decimals as number)
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'failed to fetch balance' }, { status: 500 })
  }
}


