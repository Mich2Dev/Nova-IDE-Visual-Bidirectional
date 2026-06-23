import type { Episode, Pattern, Principle } from './types';

const nova = (window as any).novaAPI;

export class MemoryManager {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  private async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
    try {
      const data = await nova?.brainReadJson?.(this.projectPath, filename);
      return data ?? defaultValue;
    } catch (e) {
      console.error(`Error reading brain/${filename}:`, e);
      return defaultValue;
    }
  }

  private async writeJsonFile<T>(filename: string, data: T): Promise<void> {
    try {
      await nova?.brainWriteJson?.(this.projectPath, filename, data);
    } catch (e) {
      console.error(`Error writing brain/${filename}:`, e);
    }
  }

  async getEpisodes(): Promise<Episode[]> {
    return this.readJsonFile<Episode[]>('episodes.json', []);
  }

  async addEpisode(episode: Episode): Promise<void> {
    const episodes = await this.getEpisodes();
    episodes.push(episode);
    // Keep last 50 episodes max
    const trimmed = episodes.slice(-50);
    await this.writeJsonFile('episodes.json', trimmed);
  }

  async getPatterns(): Promise<Pattern[]> {
    return this.readJsonFile<Pattern[]>('patterns.json', []);
  }

  async addPattern(pattern: Pattern): Promise<void> {
    const patterns = await this.getPatterns();
    patterns.push(pattern);
    await this.writeJsonFile('patterns.json', patterns);
  }

  async updatePattern(patternId: string, updates: Partial<Pattern>): Promise<void> {
    const patterns = await this.getPatterns();
    const idx = patterns.findIndex((p) => p.id === patternId);
    if (idx === -1) return;
    patterns[idx] = { ...patterns[idx], ...updates, updatedAt: Date.now() };
    await this.writeJsonFile('patterns.json', patterns);
  }

  async approvePattern(patternId: string): Promise<void> {
    await this.updatePattern(patternId, { isApproved: true });
  }

  async rejectPattern(patternId: string): Promise<void> {
    const patterns = await this.getPatterns();
    const filtered = patterns.filter((p) => p.id !== patternId);
    await this.writeJsonFile('patterns.json', filtered);
  }

  async getPrinciples(): Promise<Principle[]> {
    return this.readJsonFile<Principle[]>('principles.json', []);
  }

  async addPrinciple(principle: Principle): Promise<void> {
    const principles = await this.getPrinciples();
    principles.push(principle);
    await this.writeJsonFile('principles.json', principles);
  }
}
