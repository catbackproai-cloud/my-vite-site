import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useStreak(userId) {
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!userId) return
    async function calculate() {
      const { data } = await supabase
        .from('journal_entries')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (!data || data.length === 0) return

      const dates = new Set(data.map(r => r.date))

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      function fmt(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      }

      // Start counting from today or yesterday
      let current = new Date(today)
      if (!dates.has(fmt(current))) {
        current.setDate(current.getDate() - 1)
        if (!dates.has(fmt(current))) return
      }

      let count = 0
      while (dates.has(fmt(current))) {
        count++
        current.setDate(current.getDate() - 1)
      }

      setStreak(count)
    }
    calculate()
  }, [userId])

  return streak
}
