import React from 'react';
import Select from 'react-select';
import { Users } from 'lucide-react';
import { EntityForTreemap } from '@/utils/treemap-calculations';

interface EntitySelectorProps {
  entities: EntityForTreemap[];
  selectedEntityIds: string[];
  onChange: (entityIds: string[]) => void;
  placeholder?: string;
}

interface SelectOption {
  value: string;
  label: string;
  entity: EntityForTreemap;
}

export function EntitySelector({ 
  entities, 
  selectedEntityIds, 
  onChange, 
  placeholder = "Sélectionner les entités..."
}: EntitySelectorProps) {
  const options: SelectOption[] = entities.map(entity => ({
    value: entity.id,
    label: entity.name,
    entity
  }));

  const selectedOptions = options.filter(option => 
    selectedEntityIds.includes(option.value)
  );

  const handleChange = (selectedOptions: SelectOption[] | null) => {
    const entityIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
    onChange(entityIds);
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      '&:hover': {
        borderColor: '#3B82F6',
      },
      borderRadius: '0.5rem',
      padding: '0.25rem',
      minHeight: '2.5rem',
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: '#EBF8FF',
      borderRadius: '0.375rem',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: '#1E40AF',
      fontWeight: '500',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: '#6B7280',
      '&:hover': {
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EBF8FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#EBF8FF',
      },
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#6B7280',
    }),
  };

  const formatOptionLabel = (option: SelectOption) => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
      <span className="font-medium">{option.label}</span>
      <span className="text-sm text-gray-500">
        ({option.entity.type === 'PHYSICAL_PERSON' ? 'Personne' : 'Société'})
      </span>
    </div>
  );

  return (
    <div className="w-full max-w-md">
      <div className="flex items-center space-x-2 mb-2">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Entités</span>
      </div>
      <Select
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        closeMenuOnSelect={false}
        classNamePrefix="react-select"
        noOptionsMessage={() => "Aucune entité disponible"}
        loadingMessage={() => "Chargement..."}
      />
      {selectedEntityIds.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {selectedEntityIds.length} entité{selectedEntityIds.length > 1 ? 's' : ''} sélectionnée{selectedEntityIds.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
} 