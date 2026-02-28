import React from 'react';
import './ConfirmModal.css';
import { AlertTriangle, Info, CheckCircle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
    if (!isOpen) return null;

    const Icon = type === 'danger' ? AlertTriangle : type === 'success' ? CheckCircle : Info;
    const iconColor = type === 'danger' ? 'var(--accent-red)' : type === 'success' ? 'var(--accent-green)' : 'var(--accent-blue)';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <Icon color={iconColor} size={24} />
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    {message}
                </div>
                <div className="modal-actions">
                    {type !== 'info' && (
                        <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                            ยกเลิก
                        </button>
                    )}
                    <button
                        className={`modal-btn ${type === 'danger' ? 'modal-btn-danger' : 'modal-btn-confirm'}`}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {type === 'info' ? 'ตกลง' : 'ยืนยัน'}
                    </button>
                </div>
            </div>
        </div>
    );
}
