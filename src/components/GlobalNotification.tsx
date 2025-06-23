// src/components/GlobalNotification.tsx
import React, { useEffect } from 'react';
import { Bell } from 'lucide-react';

interface GlobalNotificationProps {
  notification: { message: string; type: 'success' | 'error' } | null;
  onClear: () => void;
}

export const GlobalNotification: React.FC<GlobalNotificationProps> = ({ notification, onClear }) => {
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                onClear();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) return null;

    const bgColor = notification.type === 'success' ? 'bg-gray-800' : 'bg-red-600';

    return (
        <div className={`fixed bottom-5 right-5 text-white px-4 py-3 rounded-lg shadow-2xl z-[100] transition-all duration-300 animate-fade-in-up ${bgColor}`}>
            <div className="flex items-center">
                <Bell size={18} className="mr-2" />
                <span>{notification.message}</span>
            </div>
        </div>
    );
};