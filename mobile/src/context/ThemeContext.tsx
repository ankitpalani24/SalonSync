import React, { createContext, useContext, useState } from 'react';
import { COLORS } from '../constants/theme';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof COLORS;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors: COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
