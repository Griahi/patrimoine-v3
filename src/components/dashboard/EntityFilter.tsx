'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import MultiSelectDropdown from "@/components/ui/MultiSelectDropdown"
import { Users, Filter, Globe, User, Building2 } from "lucide-react"

interface Entity {
  id: string
  name: string
  type: 'PHYSICAL_PERSON' | 'LEGAL_ENTITY'
  userId: string
  metadata?: any
  notes?: string
}

interface EntityFilterProps {
  entities: Entity[]
  selectedEntityIds: string[]
  onSelectionChange: (entityIds: string[]) => void
  loading?: boolean
  className?: string
}

export default function EntityFilter({
  entities,
  selectedEntityIds,
  onSelectionChange,
  loading = false,
  className = ""
}: EntityFilterProps) {
  // Transform entities to dropdown options
  const entityOptions = entities.map(entity => ({
    id: entity.id,
    label: entity.name,
    value: entity.id,
    description: entity.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale',
    type: entity.type,
    icon: entity.type === 'PHYSICAL_PERSON' ? 
      <User className="h-4 w-4" /> : 
      <Building2 className="h-4 w-4" />
  }))

  // Get display text for the filter summary
  const getFilterSummary = () => {
    if (selectedEntityIds.length === 0) {
      return {
        text: "Toutes les entités",
        icon: <Globe className="h-4 w-4" />,
        description: `${entities.length} entité${entities.length > 1 ? 's' : ''} dans la vue`
      }
    }

    if (selectedEntityIds.length === 1) {
      const entity = entities.find(e => e.id === selectedEntityIds[0])
      return {
        text: entity?.name || "Entité inconnue",
        icon: entity?.type === 'PHYSICAL_PERSON' ? 
          <User className="h-4 w-4" /> : 
          <Building2 className="h-4 w-4" />,
        description: entity?.type === 'PHYSICAL_PERSON' ? 'Personne physique' : 'Personne morale'
      }
    }

    if (selectedEntityIds.length <= 3) {
      const selectedNames = entities
        .filter(e => selectedEntityIds.includes(e.id))
        .map(e => e.name)
        .join(', ')
      
      return {
        text: selectedNames,
        icon: <Users className="h-4 w-4" />,
        description: `${selectedEntityIds.length} entités sélectionnées`
      }
    }

    const firstTwo = entities
      .filter(e => selectedEntityIds.includes(e.id))
      .slice(0, 2)
      .map(e => e.name)
      .join(', ')
    
    return {
      text: `${firstTwo} +${selectedEntityIds.length - 2} autres`,
      icon: <Users className="h-4 w-4" />,
      description: `${selectedEntityIds.length} entités sélectionnées`
    }
  }

  const filterSummary = getFilterSummary()

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filtrage par Entité
          </CardTitle>
          {selectedEntityIds.length > 0 && (
            <div className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1">
              {selectedEntityIds.length}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Current Selection Summary */}
        <div className="mb-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2 mb-1">
            {filterSummary.icon}
            <span className="font-medium text-sm">{filterSummary.text}</span>
          </div>
          <p className="text-xs text-muted-foreground">{filterSummary.description}</p>
        </div>

        {/* Multi-Select Dropdown */}
        <MultiSelectDropdown
          options={entityOptions}
          selectedValues={selectedEntityIds}
          onSelectionChange={onSelectionChange}
          placeholder="Sélectionner des entités"
          searchPlaceholder="Rechercher une entité..."
          maxDisplayItems={2}
          showSelectAll={true}
          showClearAll={true}
          emptyStateText="Aucune entité disponible"
          loading={loading}
          loadingText="Chargement des entités..."
        />

        {/* Quick Stats */}
        {entities.length > 0 && (
          <div className="mt-4 pt-3 border-t grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <User className="h-3 w-3 text-blue-500" />
              <span className="text-muted-foreground">
                {entities.filter(e => e.type === 'PHYSICAL_PERSON').length} physiques
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="h-3 w-3 text-purple-500" />
              <span className="text-muted-foreground">
                {entities.filter(e => e.type === 'LEGAL_ENTITY').length} morales
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 