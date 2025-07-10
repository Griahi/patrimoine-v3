'use client'

import { useState, useEffect, useCallback } from 'react'

interface Entity {
  id: string
  name: string
  type: 'PHYSICAL_PERSON' | 'LEGAL_ENTITY'
  userId: string
  metadata?: any
  notes?: string
}

interface UseEntityFilterResult {
  selectedEntityIds: string[]
  setSelectedEntityIds: (entityIds: string[]) => void
  toggleEntity: (entityId: string) => void
  selectAll: (entityIds: string[]) => void
  clearAll: () => void
  isEntitySelected: (entityId: string) => boolean
  getSelectedEntities: (entities: Entity[]) => Entity[]
  hasSelection: boolean
  selectionCount: number
}

interface UseEntityFilterOptions {
  storageKey?: string
  defaultSelection?: string[]
  onSelectionChange?: (entityIds: string[]) => void
  persistToStorage?: boolean
}

export function useEntityFilter({
  storageKey = 'entity-filter-selection',
  defaultSelection = [],
  onSelectionChange,
  persistToStorage = true
}: UseEntityFilterOptions = {}): UseEntityFilterResult {
  
  const [selectedEntityIds, setSelectedEntityIdsState] = useState<string[]>(defaultSelection)

  // Load from localStorage on component mount
  useEffect(() => {
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsedIds = JSON.parse(stored)
          if (Array.isArray(parsedIds)) {
            setSelectedEntityIdsState(parsedIds)
          }
        }
      } catch (error) {
        console.warn('Failed to load entity filter from storage:', error)
      }
    }
  }, [storageKey, persistToStorage])

  // Persist to localStorage when selection changes
  const setSelectedEntityIds = useCallback((entityIds: string[]) => {
    setSelectedEntityIdsState(entityIds)
    
    // Persist to storage
    if (persistToStorage && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(entityIds))
      } catch (error) {
        console.warn('Failed to save entity filter to storage:', error)
      }
    }

    // Call external onChange handler
    onSelectionChange?.(entityIds)
  }, [storageKey, persistToStorage, onSelectionChange])

  // Toggle a single entity
  const toggleEntity = useCallback((entityId: string) => {
    setSelectedEntityIds(prev => 
      prev.includes(entityId)
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    )
  }, [setSelectedEntityIds])

  // Select all entities
  const selectAll = useCallback((entityIds: string[]) => {
    setSelectedEntityIds(entityIds)
  }, [setSelectedEntityIds])

  // Clear all selections
  const clearAll = useCallback(() => {
    setSelectedEntityIds([])
  }, [setSelectedEntityIds])

  // Check if an entity is selected
  const isEntitySelected = useCallback((entityId: string) => {
    return selectedEntityIds.includes(entityId)
  }, [selectedEntityIds])

  // Get selected entities from the full list
  const getSelectedEntities = useCallback((entities: Entity[]): Entity[] => {
    return entities.filter(entity => selectedEntityIds.includes(entity.id))
  }, [selectedEntityIds])

  // Computed properties
  const hasSelection = selectedEntityIds.length > 0
  const selectionCount = selectedEntityIds.length

  return {
    selectedEntityIds,
    setSelectedEntityIds,
    toggleEntity,
    selectAll,
    clearAll,
    isEntitySelected,
    getSelectedEntities,
    hasSelection,
    selectionCount
  }
}

// Utility hook for dashboard-specific entity filtering
export function useDashboardEntityFilter() {
  return useEntityFilter({
    storageKey: 'dashboard-entity-filter',
    persistToStorage: true
  })
}

// Utility hook for reports-specific entity filtering
export function useReportsEntityFilter() {
  return useEntityFilter({
    storageKey: 'reports-entity-filter',
    persistToStorage: true
  })
} 