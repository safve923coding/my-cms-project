import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Trophy, Download, Clock, Star, Crown } from 'lucide-react';

const AutocompleteInput = ({ value, onChange, onSelect, placeholder, style, options }) => {
    const [showOptions, setShowOptions] = useState(false);
    const [filtered, setFiltered] = useState([]);

    useEffect(() => {
        if (value && showOptions) {
            setFiltered(options.filter(o => o.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
        } else {
            setFiltered([]);
        }
    }, [value, options, showOptions]);

    return (
        <div style={{ position: 'relative', flex: 1 }}>
            <input
                type="text"
                value={value}
                onChange={e => { onChange(e.target.value); setShowOptions(true); }}
                onFocus={() => setShowOptions(true)}
                onBlur={() => setTimeout(() => setShowOptions(false), 200)}
                placeholder={placeholder}
                style={style}
            />
            {showOptions && filtered.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e1e24', border: '1px solid var(--border)', zIndex: 100, borderRadius: '8px', overflow: 'hidden', marginTop: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {filtered.map((o, i) => (
                        <div
                            key={'opt-' + i}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white', transition: 'background 0.2s', fontSize: '0.9rem' }}
                            onMouseDown={() => { onChange(o.name); onSelect(o); setShowOptions(false); }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            {o.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>({o.rank || 'ไม่ระบุ'})</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function WeeklyAnnounceModal({ isOpen, onClose, officerStats = [] }) {
    const exportRef = useRef(null);
    const [exportingImage, setExportingImage] = useState(false);

    const [topCases, setTopCases] = useState([
        { name: '', amount: '' },
        { name: '', amount: '' },
        { name: '', amount: '' }
    ]);

    const [topShifts, setTopShifts] = useState([
        { name: '', hours: '', minutes: '' },
        { name: '', hours: '', minutes: '' },
        { name: '', hours: '', minutes: '' }
    ]);

    useEffect(() => {
        if (isOpen) {
            setTopCases([
                { name: '', amount: '' },
                { name: '', amount: '' },
                { name: '', amount: '' }
            ]);
            setTopShifts([
                { name: '', hours: '', minutes: '' },
                { name: '', hours: '', minutes: '' },
                { name: '', hours: '', minutes: '' }
            ]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCaseChange = (index, field, value) => {
        const newCases = [...topCases];
        newCases[index][field] = value;
        setTopCases(newCases);
    };

    const handleCaseSelect = (index, officer) => {
        const newCases = [...topCases];
        newCases[index].name = officer.name;
        newCases[index].amount = officer.thisWeek || 0; // Auto-fill cases for this week!
        setTopCases(newCases);
    };

    const handleShiftChange = (index, field, value) => {
        const newShifts = [...topShifts];
        newShifts[index][field] = value;
        setTopShifts(newShifts);
    };

    const handleShiftSelect = (index, officer) => {
        const newShifts = [...topShifts];
        newShifts[index].name = officer.name;
        // Shift time isn't auto-filled, user inputs manually
        setTopShifts(newShifts);
    };

    const handleExport = async () => {
        if (!exportRef.current) return;
        setExportingImage(true);
        try {
            exportRef.current.style.display = 'block';
            const canvas = await html2canvas(exportRef.current, {
                backgroundColor: '#0a0a0c',
                scale: 2,
                useCORS: true
            });
            exportRef.current.style.display = 'none';

            const image = canvas.toDataURL("image/png");
            const link = document.createElement('a');
            link.href = image;
            link.download = `ประกาศผลงานประจำสัปดาห์_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.png`;
            link.click();
        } catch (error) {
            console.error("Export Failed", error);
            alert("ไม่สามารถบันทึกรูปภาพได้: " + error.message);
        } finally {
            setExportingImage(false);
        }
    };

    // Default input styling
    const inputStyle = { padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(10, 10, 12, 0.6)', color: 'white', outline: 'none', fontFamily: 'inherit', widdth: '100%' };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, backdropFilter: 'blur(8px)'
        }}>
            <div className="modal-content" style={{
                background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
                padding: '32px', borderRadius: '24px', width: '700px', maxWidth: '95%',
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)', fontSize: '1.5rem' }}>
                        <Trophy size={28} color="#fbbf24" />
                        ประกาศผลงานประจำสัปดาห์
                    </h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'revert', gap: '24px', marginBottom: '32px' }}>
                    {/* Top Cases */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: 'var(--accent-purple)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                            <Star size={18} /> ท็อปคดีสูงสุด (เคส)
                        </h3>
                        {topCases.map((item, index) => (
                            <div key={`case-${index}`} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ minWidth: '35px', fontWeight: 'bold', color: index === 0 ? '#fbbf24' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                    {index === 0 ? <Crown size={20} color="#fbbf24" /> : `#${index + 1}`}
                                </div>
                                <AutocompleteInput
                                    value={item.name}
                                    onChange={val => handleCaseChange(index, 'name', val)}
                                    onSelect={officer => handleCaseSelect(index, officer)}
                                    placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                                    style={{ ...inputStyle, width: '100%' }}
                                    options={officerStats}
                                />
                                <input
                                    type="number"
                                    value={item.amount}
                                    onChange={(e) => handleCaseChange(index, 'amount', e.target.value)}
                                    placeholder="เคส"
                                    style={{ ...inputStyle, width: '80px', textAlign: 'center' }}
                                />
                            </div>
                        ))}
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>* ค้นหาและคลิกชื่อเพื่อดึงยอดเคสสัปดาห์นี้อัตโนมัติ</p>
                    </div>

                    {/* Top Shifts */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: 'var(--accent-cyan)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                            <Clock size={18} /> ท็อปเวลาเข้าเวร (ชั่วโมง/นาที)
                        </h3>
                        {topShifts.map((item, index) => (
                            <div key={`shift-${index}`} style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                <div style={{ minWidth: '35px', fontWeight: 'bold', color: index === 0 ? '#fbbf24' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                    {index === 0 ? <Crown size={20} color="#34d399" /> : `#${index + 1}`}
                                </div>
                                <AutocompleteInput
                                    value={item.name}
                                    onChange={val => handleShiftChange(index, 'name', val)}
                                    onSelect={officer => handleShiftSelect(index, officer)}
                                    placeholder="ค้นหาชื่อเจ้าหน้าที่..."
                                    style={{ ...inputStyle, width: '100%' }}
                                    options={officerStats}
                                />
                                <input
                                    type="number"
                                    value={item.hours}
                                    onChange={(e) => handleShiftChange(index, 'hours', e.target.value)}
                                    placeholder="ชม."
                                    style={{ ...inputStyle, width: '70px', textAlign: 'center' }}
                                />
                                <input
                                    type="number"
                                    value={item.minutes}
                                    onChange={(e) => handleShiftChange(index, 'minutes', e.target.value)}
                                    placeholder="นาที"
                                    style={{ ...inputStyle, width: '70px', textAlign: 'center' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                    <button onClick={onClose} style={{ padding: '12px 24px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>
                        ปิด
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exportingImage}
                        style={{ padding: '12px 24px', borderRadius: '12px', background: 'var(--gradient-1)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit', boxShadow: '0 4px 15px rgba(236,72,153,0.3)' }}
                    >
                        <Download size={20} />
                        {exportingImage ? 'กำลังสร้างรูปภาพ...' : 'ดาวน์โหลดรูปประกาศ'}
                    </button>
                </div>

                {/* Hidden HTML2Canvas Board (Upgraded Aesthetics) */}
                <div
                    ref={exportRef}
                    style={{
                        display: 'none',
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                        width: '1080px',
                        height: '1080px',
                        background: 'radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0a0a0c 100%)',
                        color: 'white',
                        padding: '60px',
                        fontFamily: "'Prompt', sans-serif",
                        border: '8px solid rgba(244,114,182,0.6)',
                        borderRadius: '40px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 0 100px rgba(236,72,153,0.3)'
                    }}
                >
                    {/* Premium Light Textures */}
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '80%', height: '30%', background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', filter: 'blur(30px)', zIndex: 0 }}></div>

                    <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(236,72,153,0.1)', border: '4px solid #f472b6', marginBottom: '20px', boxShadow: '0 0 30px rgba(244,114,182,0.4)' }}>
                                <img src="/police-badge.png" alt="Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            </div>
                            <h1 style={{ fontSize: '3.6rem', fontWeight: '800', margin: '0 0 10px 0', background: 'linear-gradient(to right, #f87171, #f472b6, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: '0 8px 30px rgba(244,114,182,0.4)' }}>
                                ประกาศผลงานประจำสัปดาห์
                            </h1>
                            <h2 style={{ fontSize: '1.8rem', color: '#e2e8f0', margin: 0, fontWeight: '500', letterSpacing: '2px' }}>
                                สถานีตำรวจ Kitty Cat PD
                            </h2>
                        </div>

                        <div style={{ display: 'flex', gap: '30px', flex: 1 }}>

                            {/* Cases Column */}
                            <div style={{ flex: 1, background: 'rgba(10,10,14,0.6)', border: '2px solid rgba(244,114,182,0.4)', borderRadius: '30px', padding: '30px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(244,114,182,0.1)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <Star size={60} color="#f472b6" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(244,114,182,0.6))' }} />
                                    <h2 style={{ fontSize: '2.3rem', margin: '0 0 5px 0', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>ท็อปคดีสูงสุด</h2>
                                    <div style={{ display: 'inline-block', background: 'var(--gradient-1)', padding: '4px 20px', borderRadius: '20px', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(236,72,153,0.4)' }}>(จำนวนเคส)</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {topCases.map((item, i) => (
                                        <div key={`exp-case-${i}`} style={{ display: 'flex', alignItems: 'center', background: i === 0 ? 'linear-gradient(90deg, rgba(245,158,11,0.2) 0%, rgba(0,0,0,0.4) 100%)' : 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '20px', border: i === 0 ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                                            {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#fbbf24', boxShadow: '0 0 10px #fbbf24' }}></div>}
                                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : '#b45309', width: '60px', display: 'flex', justifyContent: 'center' }}>
                                                {i === 0 ? <Crown size={40} color="#fbbf24" style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,0.5))' }} /> : `#${i + 1}`}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '1.6rem', fontWeight: '600', paddingLeft: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: i === 0 ? '#fef08a' : 'white' }}>{item.name || '-'}</div>
                                            <div style={{ fontSize: '2.4rem', fontWeight: '800', color: '#f472b6', textShadow: '0 0 15px rgba(244,114,182,0.4)' }}>{item.amount || '0'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shifts Column */}
                            <div style={{ flex: 1, background: 'rgba(10,10,14,0.6)', border: '2px solid rgba(52,211,153,0.4)', borderRadius: '30px', padding: '30px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 0 20px rgba(52,211,153,0.1)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                                    <Clock size={60} color="#34d399" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 15px rgba(52,211,153,0.6))' }} />
                                    <h2 style={{ fontSize: '2.3rem', margin: '0 0 5px 0', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>ท็อปเวลาเข้าเวร</h2>
                                    <div style={{ display: 'inline-block', background: 'linear-gradient(135deg, #10b981, #059669)', padding: '4px 20px', borderRadius: '20px', color: 'white', fontSize: '1.1rem', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>(ชั่วโมง/นาที)</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    {topShifts.map((item, i) => (
                                        <div key={`exp-shift-${i}`} style={{ display: 'flex', alignItems: 'center', background: i === 0 ? 'linear-gradient(90deg, rgba(52,211,153,0.15) 0%, rgba(0,0,0,0.4) 100%)' : 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '20px', border: i === 0 ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
                                            {i === 0 && <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#34d399', boxShadow: '0 0 10px #34d399' }}></div>}
                                            <div style={{ fontSize: '2.5rem', fontWeight: '900', color: i === 0 ? '#34d399' : i === 1 ? '#cbd5e1' : '#b45309', width: '60px', display: 'flex', justifyContent: 'center' }}>
                                                {i === 0 ? <Crown size={40} color="#34d399" style={{ filter: 'drop-shadow(0 0 8px rgba(52,211,153,0.5))' }} /> : `#${i + 1}`}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '1.6rem', fontWeight: '600', paddingLeft: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: i === 0 ? '#a7f3d0' : 'white' }}>{item.name || '-'}</div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', textShadow: '0 0 15px rgba(52,211,153,0.4)' }}>
                                                {item.hours && <><span style={{ fontSize: '2.4rem', fontWeight: '800', color: '#34d399' }}>{item.hours}</span><span style={{ fontSize: '1.2rem', color: '#6ee7b7' }}>ชม.</span></>}
                                                {item.minutes && <><span style={{ fontSize: '2.4rem', fontWeight: '800', color: '#34d399', marginLeft: item.hours ? '10px' : '0' }}>{item.minutes}</span><span style={{ fontSize: '1.2rem', color: '#6ee7b7' }}>น.</span></>}
                                                {!item.hours && !item.minutes && <span style={{ fontSize: '2.4rem', fontWeight: '800', color: '#34d399' }}>0</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
