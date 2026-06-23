import type { ProjectDesignProfile } from '../types/context.types';
import { DesignProfileManager } from '../../design/DesignProfileManager';

let cachedProfile: ProjectDesignProfile | null = null;
let cachedPath: string | null = null;

export async function collectDesignProfile(
  projectPath: string | null
): Promise<ProjectDesignProfile | null> {
  if (!projectPath) return null;

  if (cachedPath === projectPath && cachedProfile) {
    return cachedProfile;
  }

  try {
    const manager = new DesignProfileManager(projectPath);
    cachedProfile = await manager.load();
    cachedPath = projectPath;
    return cachedProfile;
  } catch {
    return null;
  }
}

export function invalidateDesignProfileCache(): void {
  cachedProfile = null;
  cachedPath = null;
}

export async function refreshDesignProfile(projectPath: string): Promise<ProjectDesignProfile> {
  const manager = new DesignProfileManager(projectPath);
  const profile = await manager.extractAndMerge();
  cachedProfile = profile;
  cachedPath = projectPath;
  return profile;
}
