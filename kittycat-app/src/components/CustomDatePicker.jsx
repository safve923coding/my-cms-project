import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import './CustomDatePicker.css';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export default function CustomDatePicker({ value, onChange, style }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(() => {
        if (value) return new Date(value);
        return new Date();
    });

    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDaysInMonth = (year, month) => {
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateChange = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Format as YYYY-MM-DD for native <input type="date"> compatibility
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const formattedDay = String(day).padStart(2, '0');
        onChange(`${year}-${month}-${formattedDay}`);
        setIsOpen(false);
    };

    const formatDisplayDate = (dateString) => {
        if (!dateString) return 'ไม่มีข้อมูล';
        const date = new Date(dateString);
        return `${date.getDate()} ${THAI_MONTHS[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const selectedDateObj = value ? new Date(value) : null;

    const days = [];
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        const isSelected = selectedDateObj &&
            selectedDateObj.getDate() === i &&
            selectedDateObj.getMonth() === month &&
            selectedDateObj.getFullYear() === year;
        const isToday = new Date().getDate() === i &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

        days.push(
            <div
                key={i}
                className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                onClick={() => handleDateChange(i)}
            >
                {i}
            </div>
        );
    }

    return (
        <div className="custom-datepicker-container" ref={dropdownRef}>
            <div
                className={`custom-datepicker-header ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                style={style}
            >
                <span style={{ color: value ? 'white' : 'rgba(255,255,255,0.4)' }}>
                    {formatDisplayDate(value)}
                </span>
                <CalendarIcon size={16} className="calendar-icon" />
            </div>

            {isOpen && (
                <div className="custom-datepicker-dropdown">
                    <div className="calendar-header">
                        <button onClick={handlePrevMonth} className="nav-btn"><ChevronLeft size={16} /></button>
                        <div className="current-month-year">
                            {THAI_MONTHS[month]} {year + 543}
                        </div>
                        <button onClick={handleNextMonth} className="nav-btn"><ChevronRight size={16} /></button>
                    </div>
                    <div className="calendar-grid">
                        {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                            <div key={d} className="calendar-weekday">{d}</div>
                        ))}
                        {days}
                    </div>
                </div>
            )}
        </div>
    );
}
