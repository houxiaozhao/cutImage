export const IMAGE_PROCESSING = {
  formats: {
    JPEG: 'image/jpeg',
    PNG: 'image/png',
    WEBP: 'image/webp'
  },
  defaultOptions: {
    quality: 1.0,
    format: 'image/jpeg',
    resize: {
      enabled: false,
      maxWidth: 3840,  // 4K
      maxHeight: 2160
    },
    smoothing: true,
    smoothingQuality: 'high'
  },
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

export const GRID_PRESETS = [
  { name: '2 x 2', x: 2, y: 2 },
  { name: '3 x 3', x: 3, y: 3 },
  { name: '4 x 4', x: 4, y: 4 },
];

export const UI_CONSTANTS = {
  darkMode: {
    background: 'bg-gray-900',
    text: 'text-white',
    border: 'border-gray-700',
    hover: 'hover:bg-gray-700'
  },
  lightMode: {
    background: 'bg-white',
    text: 'text-gray-900',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-100'
  }
};
