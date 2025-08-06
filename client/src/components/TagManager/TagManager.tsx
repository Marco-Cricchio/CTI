import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getTags } from '../../services/api';
import { Tag } from '../../types';

interface TagManagerProps {
  initialTags: Tag[];
  onChange: (selectedTags: Tag[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({ initialTags, onChange }) => {
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
    // Sincronizza lo stato quando le props iniziali cambiano
    setSelectedOptions(initialTags.map(tag => ({ value: tag.id, label: tag.name })));
  }, [initialTags]);

  const handleSelectionChange = (options: any) => {
    setSelectedOptions(options);
    const selectedTags = options ? options.map((opt: any) => ({ id: opt.value, name: opt.label })) : [];
    onChange(selectedTags);
  };

  const tagOptions = allTags.map(tag => ({ value: tag.id, label: tag.name }));

  return (
    <Select
      isMulti
      options={tagOptions}
      value={selectedOptions}
      onChange={handleSelectionChange}
      placeholder="Select or create tags..."
      noOptionsMessage={() => 'No tags found'}
    />
  );
};

export default TagManager;