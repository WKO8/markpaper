export interface DocumentMetadata {
  fileName: string;
  filePath: string;
  dirPath: string;
  sizeBytes: number;
  lastModified: string;
  wordCount: number;
  readingTimeMinutes: number;
  headingCount: number;
}

export interface OutlineItem {
  id: string;
  text: string;
  level: number;
}

export type ThemeMode = 'paper' | 'sepia' | 'slate' | 'dark';
export type ViewMode = 'paged' | 'continuous';
export type FontFamily = 'sans' | 'serif' | 'mono';

// Aliases for semantic clarity across viewer components
export type ViewerTheme = ThemeMode;
export type ViewerFont = FontFamily;

export interface ViewerSettings {
  theme: ThemeMode;
  viewMode: ViewMode;
  zoom: number; // 0.5 to 2.0
  fontFamily: FontFamily;
  fontSize: number; // in px, e.g. 16
  showSidebar: boolean;
  autoReload: boolean;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  matchesCount: number;
  currentMatchIndex: number;
}
