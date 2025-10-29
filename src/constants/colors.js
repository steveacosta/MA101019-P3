// Paleta de colores pasteles masculinos para TipFit
export const colors = {
  primary: '#A8DADC',      // Azul pastel
  secondary: '#457B9D',    // Azul medio
  accent: '#E0E1DD',       // Gris claro
  background: '#F1FAEE',   // Blanco crema
  text: '#1D3557',         // Azul oscuro
  success: '#90C9B5',      // Verde pastel
  error: '#F4A6A3',        // Rojo pastel
  white: '#FFFFFF',
  lightGray: '#F8F9FA',
  mediumGray: '#6C757D',
  darkGray: '#343A40',
  border: '#DEE2E6',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const gradients = {
  primary: ['#A8DADC', '#457B9D'],
  background: ['#F1FAEE', '#E0E1DD'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal',
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.mediumGray,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
};
