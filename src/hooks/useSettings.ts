import { STORAGE_KEYS } from "@/lib/storageKeys";
import { useState, useEffect } from 'react';

const SETTINGS_KEY = STORAGE_KEYS.settings;

export interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    defaultSearchMode: 'OR' | 'AND';
}

const defaultSettings: UserSettings = {
    theme: 'light',
    defaultSearchMode: 'OR',
};

export function useSettings() {
    const [settings, setSettings] = useState<UserSettings>(defaultSettings);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                setSettings({ ...defaultSettings, ...JSON.parse(stored) });
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        } finally {
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
    }, [settings, isLoaded]);

    const updateSettings = (newSettings: Partial<UserSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    return { settings, updateSettings, isLoaded };
}
