
import React, { useState } from 'react';
import type { VideoConfig } from '../types';
import { LANGUAGES, VOICES, VIDEO_LENGTHS, ASPECT_RATIOS, QUALITIES, MUSIC_STYLES, SUBTITLE_STYLES } from '../constants';

interface CustomizationPanelProps {
    onGenerate: (config: VideoConfig) => void;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ onGenerate }) => {
    const [config, setConfig] = useState<VideoConfig>({
        language: LANGUAGES[0],
        voice: VOICES[0],
        videoLength: VIDEO_LENGTHS[1],
        aspectRatio: Object.keys(ASPECT_RATIOS)[0],
        quality: QUALITIES[1],
        prompt: "A young girl discovers a hidden village in the mountains at sunset, filled with magical creatures.",
        musicStyle: MUSIC_STYLES[0],
        subtitles: true,
        subtitleStyle: SUBTITLE_STYLES[1],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        onGenerate(config);
    };
    
    const handleChange = <T extends keyof VideoConfig>(key: T, value: VideoConfig[T]) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const renderSelect = (label: string, key: keyof VideoConfig, options: readonly string[] | Record<string, string>) => (
        <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-400 mb-2">{label}</label>
            <select
                value={config[key] as string}
                onChange={e => handleChange(key, e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-brand-cyan focus:outline-none transition"
            >
                {Array.isArray(options) 
                    ? options.map(opt => <option key={opt} value={opt}>{opt}</option>)
                    : Object.entries(options).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)
                }
            </select>
        </div>
    );

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="md:col-span-2">
                    <h2 className="text-3xl font-bold text-center mb-2">Create Your AI Story</h2>
                    <p className="text-slate-400 text-center mb-8">Describe your vision and let our AI bring it to life.</p>
                </div>
                
                <div className="md:col-span-2">
                    <label htmlFor="prompt" className="text-sm font-medium text-slate-400 mb-2 block">Your Story Prompt</label>
                    <textarea
                        id="prompt"
                        rows={4}
                        value={config.prompt}
                        onChange={e => handleChange('prompt', e.target.value)}
                        placeholder="e.g., A robot exploring a lush, overgrown city..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-cyan focus:outline-none transition resize-none"
                        required
                    />
                </div>

                {renderSelect("Language", "language", LANGUAGES)}
                {renderSelect("Voice", "voice", VOICES)}
                {renderSelect("Video Length", "videoLength", VIDEO_LENGTHS)}
                {renderSelect("Aspect Ratio", "aspectRatio", ASPECT_RATIOS)}
                
                <div className="md:col-span-2">
                     <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm text-brand-cyan hover:underline">
                        {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                    </button>
                </div>
                
                {showAdvanced && (
                    <>
                        {renderSelect("Video Quality", "quality", QUALITIES)}
                        {renderSelect("Music Style", "musicStyle", MUSIC_STYLES)}
                        <div className="flex items-center space-x-4">
                             <label className="text-sm font-medium text-slate-400">Subtitles</label>
                             <input type="checkbox" checked={config.subtitles} onChange={e => handleChange('subtitles', e.target.checked)} className="h-5 w-5 rounded bg-slate-700 border-slate-600 text-brand-cyan focus:ring-brand-cyan"/>
                        </div>
                        {config.subtitles && renderSelect("Subtitle Style", "subtitleStyle", SUBTITLE_STYLES)}
                    </>
                )}

                <div className="md:col-span-2 mt-6">
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full py-3 px-6 bg-brand-cyan text-slate-900 font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center animate-subtle-glow"
                    >
                        {isLoading ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating...
                            </>
                        ) : '✨ Generate Video'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CustomizationPanel;
