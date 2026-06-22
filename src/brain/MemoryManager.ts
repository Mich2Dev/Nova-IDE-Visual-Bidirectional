import type { Episode, Pattern, Principle, KnowledgeGap } from './types';

export class MemoryManager {
    private dirHandle: any = null;

    constructor(directoryHandle: any) {
        this.dirHandle = directoryHandle;
    }

    private async getBrainDir() {
        if (!this.dirHandle) throw new Error("No directory handle");
        const novaDir = await this.dirHandle.getDirectoryHandle('.nova', { create: true });
        const brainDir = await novaDir.getDirectoryHandle('brain', { create: true });
        return brainDir;
    }

    private async getFileHandle(filename: string) {
        const brainDir = await this.getBrainDir();
        return await brainDir.getFileHandle(filename, { create: true });
    }

    private async readJsonFile<T>(filename: string, defaultValue: T): Promise<T> {
        try {
            const fileHandle = await this.getFileHandle(filename);
            const file = await fileHandle.getFile();
            const content = await file.text();
            if (!content.trim()) return defaultValue;
            return JSON.parse(content) as T;
        } catch (e) {
            console.error(`Error reading ${filename}:`, e);
            return defaultValue;
        }
    }

    private async writeJsonFile<T>(filename: string, data: T): Promise<void> {
        try {
            const fileHandle = await this.getFileHandle(filename);
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();
        } catch (e) {
            console.error(`Error writing ${filename}:`, e);
        }
    }

    // -- Episodes --
    async getEpisodes(): Promise<Episode[]> {
        return this.readJsonFile<Episode[]>('episodes.json', []);
    }

    async addEpisode(episode: Episode): Promise<void> {
        const episodes = await this.getEpisodes();
        episodes.push(episode);
        await this.writeJsonFile('episodes.json', episodes);
    }

    // -- Patterns --
    async getPatterns(): Promise<Pattern[]> {
        return this.readJsonFile<Pattern[]>('patterns.json', []);
    }

    async addPattern(pattern: Pattern): Promise<void> {
        const patterns = await this.getPatterns();
        patterns.push(pattern);
        await this.writeJsonFile('patterns.json', patterns);
    }

    // -- Principles --
    async getPrinciples(): Promise<Principle[]> {
        return this.readJsonFile<Principle[]>('principles.json', []);
    }

    async addPrinciple(principle: Principle): Promise<void> {
        const principles = await this.getPrinciples();
        principles.push(principle);
        await this.writeJsonFile('principles.json', principles);
    }
}
