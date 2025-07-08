'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Search,
  Users,
  Building2,
  User
} from "lucide-react"

interface Option {
  id: string
  label: string
  value: string
  icon?: React.ReactNode
  description?: string
  type?: string
}

interface MultiSelectDropdownProps {
  options: Option[]
  selectedValues: string[]
  onSelectionChange: (selectedValues: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  maxDisplayItems?: number
  className?: string
  disabled?: boolean
  showSelectAll?: boolean
  showClearAll?: boolean
  emptyStateText?: string
  loadingText?: string
  loading?: boolean
}

export default function MultiSelectDropdown({
  options,
  selectedValues,
  onSelectionChange,
  placeholder = "Sélectionner des éléments",
  searchPlaceholder = "Rechercher...",
  maxDisplayItems = 2,
  className = "",
  disabled = false,
  showSelectAll = true,
  showClearAll = true,
  emptyStateText = "Aucun élément disponible",
  loadingText = "Chargement...",
  loading = false
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get selected options for display
  const selectedOptions = options.filter(option => selectedValues.includes(option.value))

  // Handle individual option toggle
  const toggleOption = (optionValue: string) => {
    const newSelection = selectedValues.includes(optionValue)
      ? selectedValues.filter(value => value !== optionValue)
      : [...selectedValues, optionValue]
    
    onSelectionChange(newSelection)
  }

  // Handle select all
  const selectAll = () => {
    onSelectionChange(filteredOptions.map(option => option.value))
  }

  // Handle clear all
  const clearAll = () => {
    onSelectionChange([])
  }

  // Get display text for the dropdown button
  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return placeholder
    }
    
    if (selectedValues.length === 1) {
      return selectedOptions[0]?.label || placeholder
    }
    
    if (selectedValues.length <= maxDisplayItems) {
      return selectedOptions.map(option => option.label).join(', ')
    }
    
    return `${selectedOptions.slice(0, maxDisplayItems).map(option => option.label).join(', ')} +${selectedValues.length - maxDisplayItems} autres`
  }

  // Get default icons based on type
  const getDefaultIcon = (type?: string) => {
    switch (type) {
      case 'INDIVIDUAL':
        return <User className="h-4 w-4" />
      case 'LEGAL_ENTITY':
        return <Building2 className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Dropdown Trigger */}
      <Button
        variant="outline"
        className={`w-full justify-between ${disabled ? 'opacity-50' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="truncate text-left">
          {getDisplayText()}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
        )}
      </Button>

      {/* Selection Count Badge */}
      {selectedValues.length > 0 && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {selectedValues.length}
        </div>
      )}

      {/* Dropdown Content */}
      {isOpen && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border">
          <CardContent className="p-0">
            {/* Search Input */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {(showSelectAll || showClearAll) && (
              <div className="p-3 border-b bg-muted/30">
                <div className="flex justify-between gap-2">
                  {showSelectAll && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={filteredOptions.length === 0}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Tout sélectionner
                    </Button>
                  )}
                  {showClearAll && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      disabled={selectedValues.length === 0}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Tout désélectionner
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-64 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">
                  {loadingText}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchTerm ? 'Aucun résultat trouvé' : emptyStateText}
                </div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.id}
                    className={`flex items-center p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedValues.includes(option.value)
                        ? 'bg-primary/5 border-l-2 border-primary'
                        : ''
                    }`}
                    onClick={() => toggleOption(option.value)}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center transition-colors ${
                      selectedValues.includes(option.value)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedValues.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className="mr-3 text-muted-foreground">
                      {option.icon || getDefaultIcon(option.type)}
                    </div>

                    {/* Label and Description */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selection Summary */}
            {selectedValues.length > 0 && (
              <div className="p-3 border-t bg-muted/30">
                <div className="text-xs text-muted-foreground">
                  {selectedValues.length} élément{selectedValues.length > 1 ? 's' : ''} sélectionné{selectedValues.length > 1 ? 's' : ''}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 