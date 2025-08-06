import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getTags } from '../../services/api';
import { Tag } from '../../types';

interface TagManagerProps {
  initialTags: Tag[];
  onChange: (selectedTags: Tag[]) => void;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  menuIsOpen: boolean;
}

const TagManager: React.FC<TagManagerProps> = ({ initialTags, onChange, onMenuOpen, onMenuClose, menuIsOpen }) => {
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<any>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAllTags(tags);
      } catch (error) {
        console.error('Failed to fetch tags', error);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const options = initialTags.map(tag => ({ value: tag.id, label: tag.name }));
    setSelectedOptions(options);
  }, [initialTags]);

  const handleSelectionChange = (options: any) => {
    setSelectedOptions(options);
    const selectedTags = options ? options.map((opt: any) => ({ id: opt.value, name: opt.label })) : [];
    onChange(selectedTags);
  };

  const tagOptions = allTags.map(tag => ({ value: tag.id, label: tag.name }));

  const customStyles = {
    menuPortal: (base: any) => ({
      ...base,
      zIndex: 9999,
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#2d3748',
      border: '1px solid #4a5568',
    }),
    option: (styles: any, { isFocused, isSelected }: any) => ({
      ...styles,
      backgroundColor: isSelected ? '#4a5568' : isFocused ? '#4a5568' : undefined,
      color: '#e2e8f0',
      ':active': {
        ...styles[':active'],
        backgroundColor: '#2d3748',
      },
    }),
    control: (styles: any) => ({
        ...styles,
        backgroundColor: '#1f2937',
        borderColor: '#4b5563',
    }),
    multiValue: (styles: any) => ({
        ...styles,
        backgroundColor: '#4b5563',
    }),
    multiValueLabel: (styles: any) => ({
        ...styles,
        color: '#e5e7eb',
    }),
    input: (styles: any) => ({
        ...styles,
        color: '#e5e7eb',
    }),
  };

  return (
    <Select
      isMulti
      options={tagOptions}
      value={selectedOptions}
      onChange={handleSelectionChange}
      placeholder="Select tags..."
      noOptionsMessage={() => 'No tags found'}
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
      menuIsOpen={menuIsOpen}
      styles={customStyles}
    />
  );
};

export default TagManager;