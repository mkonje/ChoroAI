export type AppState = 'CONFIG' | 'GENERATING' | 'PREVIEW' | 'ERROR' | 'EDIT';

export interface VideoConfig {
    language: string;
    voice: string;
    videoLength: string;
    aspectRatio: string;
    quality: string;
    prompt: string;
    musicStyle: string;
    subtitles: boolean;
    subtitleStyle: string;
}

export interface Scene {
    scene_number: number;
    visual_description: string;
    narration: string;
    image_url?: string;
}

export interface GeneratedAssets {
    script: Scene[];
    audioData: string;
}

export interface GenerationProgress {
    step: number;
    status: 'pending' | 'in-progress' | 'completed';
    message: string;
    progress: number;
}
