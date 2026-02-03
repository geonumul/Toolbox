import React, { useState, useEffect, useRef } from 'react';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  tagName?: keyof JSX.IntrinsicElements;
}

export const EditableField = ({
  value,
  onSave,
  isEditing,
  className = '',
  placeholder = 'Type here...',
  multiline = false,
  tagName: Tag = 'div',
}: EditableFieldProps) => {
  const [localValue, setLocalValue] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Auto-resize textarea
  useEffect(() => {
    if (isEditing && multiline && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [localValue, isEditing, multiline]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full bg-black/5 outline-none resize-none overflow-hidden rounded px-1 -mx-1 border border-transparent focus:border-blue-500/30 transition-all ${className}`}
          rows={1}
        />
      );
    }
    return (
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full bg-black/5 outline-none rounded px-1 -mx-1 border border-transparent focus:border-blue-500/30 transition-all ${className}`}
      />
    );
  }

  return (
    <Tag className={className}>
      {value || <span className="opacity-30 italic">Empty</span>}
    </Tag>
  );
};
