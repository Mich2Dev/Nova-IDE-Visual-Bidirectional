export type SessionArc = 'resolved' | 'degraded' | 'neutral' | 'abandoned';

export interface Episode {
    id: string;
    sessionId: string;
    situation: string;
    strategy: string;
    outcome: string;
    sessionArc: SessionArc;
    qualityScore: number;
    temporalWeight: number;
    createdAt: number;
}

export interface Pattern {
    id: string;
    triggerDesc: string;
    responseDesc: string;
    confidenceScore: number;
    episodeCount: number;
    isApproved: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Principle {
    id: string;
    description: string;
    patternIds: string[];
    createdAt: number;
}

export interface KnowledgeGap {
    id: string;
    topic: string;
    occurrenceCount: number;
    status: 'pending' | 'addressed';
    firstSeenAt: number;
    lastSeenAt: number;
}
