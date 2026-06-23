import type { ProjectDesignProfile } from '../context/types/context.types';

const nova = (window as any).novaAPI;

const DEFAULT_PROFILE: ProjectDesignProfile = {
  version: 1,
  tone: 'minimal',
  colors: { palette: ['#6366f1', '#0f172a', '#f8fafc', '#64748b'] },
  typography: { fontFamilies: ['Inter', 'system-ui', 'sans-serif'] },
  spacing: { unit: 4, scale: [4, 8, 12, 16, 24, 32, 48] },
  radii: { sm: '4px', md: '8px', lg: '12px', xl: '16px' },
  components: {},
  rules: {
    allowed: ['usar Tailwind CSS', 'mantener consistencia de colores del proyecto'],
    forbidden: ['inline styles innecesarios', 'más de 2 fuentes distintas'],
  },
  assets: [],
  extractedFrom: [],
  updatedAt: Date.now(),
};

export class DesignProfileManager {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async load(): Promise<ProjectDesignProfile> {
    const data = await nova?.designReadJson?.(this.projectPath, 'profile.json');
    if (!data) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...data };
  }

  async save(profile: ProjectDesignProfile): Promise<void> {
    await nova?.designWriteJson?.(this.projectPath, 'profile.json', {
      ...profile,
      updatedAt: Date.now(),
    });
  }

  async extractAndMerge(): Promise<ProjectDesignProfile> {
    const existing = await this.load();
    const { extractDesignTokens } = await import('./tokenExtractor');
    const extracted = await extractDesignTokens(this.projectPath);
    const merged: ProjectDesignProfile = {
      ...existing,
      colors: {
        palette: [...new Set([...existing.colors.palette, ...extracted.colors])],
      },
      typography: {
        fontFamilies: [...new Set([...existing.typography.fontFamilies, ...extracted.fonts])],
      },
      extractedFrom: [...new Set([...(existing.extractedFrom ?? []), ...extracted.sources])],
      updatedAt: Date.now(),
    };
    await this.save(merged);
    return merged;
  }
}
