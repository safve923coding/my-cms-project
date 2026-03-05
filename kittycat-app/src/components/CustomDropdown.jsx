import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './CustomDropdown.css';

export default function CustomDropdown({
    options,
    value,
    onChange,
    style,
    className = '',
    listAlign = 'left',
    renderOption = null,
    renderValue = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0] || { label: 'Select...', value: '' };

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`custom-dropdown-container ${className}`} ref={containerRef}>
            <div
                className={`custom-dropdown-header ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={style}
            >
                {renderValue ? renderValue(selectedOption) : <span>{selectedOption.label}</span>}
                <ChevronDown size={16} className="custom-dropdown-arrow" />
            </div>

            {isOpen && (
                <div className={`custom-dropdown-list ${listAlign === 'right' ? 'custom-dropdown-list-right' : ''}`}>
                    {options.map((opt, index) => (
                        <div
                            key={`${opt.value}-${index}`}
                            className={`custom-dropdown-item ${String(opt.value) === String(value) ? 'selected' : ''}`}
                            onClick={() => handleSelect(opt.value)}
                            style={opt.style || {}}
                        >
                            {renderOption ? renderOption(opt) : opt.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
