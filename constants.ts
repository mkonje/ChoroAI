export const LANGUAGES = ["English", "Swahili"];
export const VOICES = ["Male (Young)", "Female (Mature)", "Male (News-style)", "Female (Calm)"];
export const VIDEO_LENGTHS = ["15s", "30s", "1min", "2min"];
export const ASPECT_RATIOS = {
    "16:9": "YouTube",
    "9:16": "TikTok/Reels",
    "1:1": "Instagram",
    "4:3": "Classic TV",
    "3:4": "Portrait"
};
export const QUALITIES = ["720p", "1080p", "4K"];
export const MUSIC_STYLES = ["Cinematic", "Emotional", "Upbeat", "Ambient"];
export const SUBTITLE_STYLES = ["Minimal", "Cinematic", "Bold"];

export const GENERATION_STEPS = [
    { id: 1, text: "Generating Script...", icon: "script" },
    { id: 2, text: "Generating Images...", icon: "image" },
    { id: 3, text: "Designing Transitions...", icon: "transitions" },
    { id: 4, text: "Adding Subtitles...", icon: "subtitles" },
    { id: 5, text: "Generating Voiceover...", icon: "voiceover" },
    { id: 6, text: "Mixing Background Music...", icon: "music" },
    { id: 7, text: "Rendering Final Video...", icon: "render" },
];