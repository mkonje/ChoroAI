import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppState, VideoConfig, GeneratedAssets, GenerationProgress, Scene } from './types';
import { generateScript, generateImage, generateVoiceover } from './services/geminiService';
import CustomizationPanel from './components/CustomizationPanel';
import GenerationProgressComponent from './components/GenerationProgress';
import VideoPreview from './components/VideoPreview';
import ScriptEditor from './components/ScriptEditor';
import { GENERATION_STEPS } from './constants';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('CONFIG');
    const [videoConfig, setVideoConfig] = useState<VideoConfig | null>(null);
    const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
    const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({ step: 0, status: 'pending', message: '', progress: 0 });
    const [error, setError] = useState<string | null>(null);

    const updateProgress = (step: number, status: 'pending' | 'in-progress' | 'completed', message: string, progress?: number) => {
        setGenerationProgress(prev => ({
            ...prev,
            step,
            status,
            message,
            progress: progress !== undefined ? progress : prev.progress
        }));
    };

    const handleGenerateVideo = useCallback(async (config: VideoConfig) => {
        setVideoConfig(config);
        setAppState('GENERATING');
        setError(null);
        setGenerationProgress({ step: 1, status: 'in-progress', message: GENERATION_STEPS[0].text, progress: 0 });

        try {
            // Step 1: Generate Script
            updateProgress(1, 'in-progress', 'Crafting a compelling narrative...', 10);
            const script = await generateScript(config);
            if (!Array.isArray(script) || script.length === 0) {
                throw new Error("Script generation failed to produce a valid list of scenes.");
            }
            updateProgress(1, 'completed', 'Script generated successfully!', 15);
            
            // Step 2: Generate Images
            updateProgress(2, 'in-progress', 'Visualizing scenes...', 15);
            const scenesWithImages: Scene[] = [];
            for (let i = 0; i < script.length; i++) {
                const scene = script[i];
                const progress = 15 + (i + 1) / script.length * 40;
                updateProgress(2, 'in-progress', `Generating image for scene ${i + 1}/${script.length}...`, progress);
                const imageUrl = await generateImage(scene.visual_description, config.aspectRatio);
                scenesWithImages.push({ ...scene, image_url: imageUrl });
            }
            updateProgress(2, 'completed', 'All images generated!', 55);

            // Step 5: Generate Voiceover (moved up before simulation)
            updateProgress(5, 'in-progress', 'Synthesizing voiceover...', 70);
            const fullNarration = scenesWithImages.map(s => s.narration).join(' ');
            const audioData = await generateVoiceover(fullNarration, config.voice);
            updateProgress(5, 'completed', 'Voiceover generated!', 77);

            setGeneratedAssets({
                script: scenesWithImages,
                audioData,
            });
            
            // Simulate remaining non-critical steps for UI feedback
            updateProgress(3, 'in-progress', GENERATION_STEPS[2].text, 55);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgress(3, 'completed', 'Transitions designed!', 62);
            
            updateProgress(4, 'in-progress', GENERATION_STEPS[3].text, 62);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgress(4, 'completed', 'Subtitles prepared!', 70);

            updateProgress(6, 'in-progress', GENERATION_STEPS[5].text, 77);
            await new Promise(resolve => setTimeout(resolve, 500));
            updateProgress(6, 'completed', 'Music mixed!', 85);
            
            updateProgress(7, 'in-progress', GENERATION_STEPS[6].text, 85);
            await new Promise(resolve => setTimeout(resolve, 800));
            updateProgress(7, 'completed', 'Final render complete!', 100);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            setAppState('PREVIEW');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setAppState('ERROR');
        }
    }, []);

    const handleGenerateNextEpisode = useCallback(async () => {
        if (!videoConfig || !generatedAssets) return;

        const lastScene = generatedAssets.script[generatedAssets.script.length - 1];
        const continuationPrompt = `The story so far: "${videoConfig.prompt}". The last scene was: "${lastScene.narration}". Please write a compelling continuation of this story for a new video of approximately ${videoConfig.videoLength}.`;

        const newConfig: VideoConfig = {
            ...videoConfig,
            prompt: continuationPrompt,
        };
        
        setGeneratedAssets(null);
        await handleGenerateVideo(newConfig);

    }, [videoConfig, generatedAssets, handleGenerateVideo]);

    const handleEditScript = () => {
        if (!generatedAssets) return;
        setAppState('EDIT');
    };

    const handleUpdateScript = (newScript: Scene[]) => {
        setGeneratedAssets(prev => prev ? { ...prev, script: newScript } : null);
        setAppState('PREVIEW');
    };
    
    const handleCancelEdit = () => {
        setAppState('PREVIEW');
    };


    const handleReset = () => {
        setAppState('CONFIG');
        setVideoConfig(null);
        setGeneratedAssets(null);
        setError(null);
        setGenerationProgress({ step: 0, status: 'pending', message: '', progress: 0 });
    };

    const renderContent = () => {
        switch (appState) {
            case 'GENERATING':
                return <GenerationProgressComponent progress={generationProgress} />;
            case 'PREVIEW':
                if (!generatedAssets || !videoConfig) return <div />;
                return <VideoPreview assets={generatedAssets} config={videoConfig} onReset={handleReset} onGenerateNextEpisode={handleGenerateNextEpisode} onEditScript={handleEditScript} />;
            case 'EDIT':
                 if (!generatedAssets) return <div />;
                 return <ScriptEditor initialScript={generatedAssets.script} onSave={handleUpdateScript} onCancel={handleCancelEdit} />;
            case 'ERROR':
                return (
                    <div className="flex flex-col items-center justify-center h-screen text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">Generation Failed</h2>
                        <p className="max-w-md mb-6 text-slate-400">{error}</p>
                        <button onClick={handleReset} className="px-6 py-2 bg-brand-cyan text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity">
                            Try Again
                        </button>
                    </div>
                );
            case 'CONFIG':
            default:
                return <CustomizationPanel onGenerate={handleGenerateVideo} />;
        }
    };

    return (
        <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
             <header className="absolute top-0 left-0 p-6 flex items-center space-x-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-cyan"><path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M2 7L12 12L22 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                <h1 className="text-2xl font-bold tracking-tighter">ChoroAI Studio</h1>
            </header>
            <AnimatePresence mode="wait">
                <motion.div
                    key={appState}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-7xl"
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </main>
    );
};

export default App;