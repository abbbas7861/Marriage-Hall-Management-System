import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'emerald' | 'ocean' | 'royal' | 'light';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  tagline: string;
  previewBg: string;
  previewCard: string;
  accentColor: string;
  accentSecondary: string;
  textColor: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'emerald',
    name: 'Emerald Dark (Default)',
    tagline: 'Deep slate backdrop with vibrant emerald & teal highlights',
    previewBg: '#0b1120',
    previewCard: '#1e293b',
    accentColor: '#14b8a6', // teal-500
    accentSecondary: '#10b981', // emerald-500
    textColor: '#f8fafc',
    isDark: true,
  },
  {
    id: 'ocean',
    name: 'Ocean Dark',
    tagline: 'Deep navy blue backdrop with cobalt & sky blue highlights',
    previewBg: '#070f26',
    previewCard: '#0f1d40',
    accentColor: '#0284c7', // sky-600
    accentSecondary: '#2563eb', // blue-600
    textColor: '#f8fafc',
    isDark: true,
  },
  {
    id: 'royal',
    name: 'Royal Dark',
    tagline: 'Imperial dark violet backdrop with royal purple & indigo accents',
    previewBg: '#0e0924',
    previewCard: '#1c1340',
    accentColor: '#8b5cf6', // violet-500
    accentSecondary: '#6366f1', // indigo-500
    textColor: '#f8fafc',
    isDark: true,
  },
  {
    id: 'light',
    name: 'Light Mode',
    tagline: 'Crisp, high-contrast white & slate-50 surfaces with dark text',
    previewBg: '#f1f5f9',
    previewCard: '#ffffff',
    accentColor: '#0d9488', // teal-600
    accentSecondary: '#059669', // emerald-600
    textColor: '#0f172a',
    isDark: false,
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeConfig: ThemeOption;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'emerald',
  setTheme: () => {},
  currentThemeConfig: THEME_OPTIONS[0],
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mhms_theme') as AppTheme;
      if (saved && ['emerald', 'ocean', 'royal', 'light'].includes(saved)) {
        return saved;
      }
    }
    return 'emerald';
  });

  const applyTheme = (t: AppTheme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', t);
      document.body.setAttribute('data-theme', t);
      if (t === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mhms_theme', newTheme);
    }
    applyTheme(newTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const currentThemeConfig =
    THEME_OPTIONS.find((opt) => opt.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentThemeConfig }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

