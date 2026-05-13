import { useState, useCallback } from 'react'
import { loadAIConfig, saveAIConfig } from '../utils/ai.js'

export function useAIConfig() {
  const [config, setConfig] = useState(loadAIConfig)

  const update = useCallback((partial) => {
    setConfig(prev => {
      const next = { ...prev, ...partial }
      saveAIConfig(next)
      return next
    })
  }, [])

  return [config, update]
}
