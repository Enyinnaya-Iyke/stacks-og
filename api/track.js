// File: api/track.js
import { kv } from '@vercel/kv'

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Only POST allowed' })
    }

    const { address, firstTxISO } = req.body || {}
    if (!address) {
      return res.status(400).json({ error: 'Address required' })
    }

    // Key to store address → firstTxISO
    const key = `user:${address}`

    // Check if already recorded
    const exists = await kv.exists(key)

    if (!exists) {
      await kv.set(key, firstTxISO || new Date().toISOString())
      await kv.zadd('all-users', {
        score: new Date(firstTxISO || Date.now()).getTime(),
        member: address,
      })
    }

    // Get rank (1-based, ascending by score = earlier = more OG)
    const rank = await kv.zrank('all-users', address)
    const total = await kv.zcard('all-users')

    res.json({
      rank: (rank ?? 0) + 1,
      total,
      before: rank ?? 0,
      after: total - ((rank ?? 0) + 1),
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
}
