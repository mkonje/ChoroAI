import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GeneratedAssets, VideoConfig } from '../types';
import { Play, Pause, Download, Repeat, Share2, Edit, Book, RefreshCw, AlertTriangle, Loader } from './icons/Icons';

declare var JSZip: any;

interface VideoPreviewProps {
    assets: GeneratedAssets;
    config: VideoConfig;
    onReset: () => void;
    onGenerateNextEpisode: () => void;
    onEditScript: () => void;
}

const slideVariants = {
    initial: { opacity: 0, scale: 1.05, x: 50 },
    animate: { opacity: 1, scale: 1, x: 0 },
    exit: { opacity: 0, scale: 0.95, x: -50 },
};

const subtitleVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { delay: 0.5 } },
    exit: { opacity: 0, y: -20 },
};

// Audio Decoding Helper
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

const parseDuration = (length: string): number => {
    if (length.endsWith('s')) {
        return parseInt(length.replace('s', ''), 10) * 1000;
    }
    if (length.endsWith('min')) {
        return parseInt(length.replace('min', ''), 10) * 60 * 1000;
    }
    return 30000; // default to 30s
};

const VideoPreview: React.FC<VideoPreviewProps> = ({ assets, config, onReset, onGenerateNextEpisode, onEditScript }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false); // Start paused for browser compatibility
    const [videoEnded, setVideoEnded] = useState(false);
    const [actionStatus, setActionStatus] = useState<Record<string, 'idle' | 'loading' | 'success' | 'error'>>({});
    const [isAudioReady, setIsAudioReady] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    const SCENE_DURATION = useMemo(() => {
        const totalDuration = parseDuration(config.videoLength);
        return totalDuration / assets.script.length;
    }, [config.videoLength, assets.script.length]);

    // Effect to decode audio data once when assets are available
    useEffect(() => {
        if (!assets.audioData) return;
        
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        
        let isActive = true;
        const setupAudio = async () => {
            try {
                const decodedData = decode(assets.audioData);
                const buffer = await decodeAudioData(decodedData, audioContextRef.current!, 24000, 1);
                if (isActive) {
                    audioBufferRef.current = buffer;
                    setIsAudioReady(true);
                }
            } catch (e) {
                console.error("Failed to decode audio data", e);
                if (isActive) setIsAudioReady(false);
            }
        };

        setupAudio();

        return () => {
            isActive = false;
        };
    }, [assets.audioData]);
    
    // Slideshow timer effect
    useEffect(() => {
        if (isPlaying && !videoEnded) {
            const timer = setInterval(() => {
                setCurrentSceneIndex((prev) => {
                    if (prev >= assets.script.length - 1) {
                        setIsPlaying(false);
                        setVideoEnded(true);
                        return prev;
                    }
                    return prev + 1;
                });
            }, SCENE_DURATION);
            return () => clearInterval(timer);
        }
    }, [isPlaying, videoEnded, assets.script.length, SCENE_DURATION]);

    const playAudioFromStart = useCallback(() => {
        if (!audioBufferRef.current || !audioContextRef.current || !isAudioReady) return;

        audioSourceRef.current?.stop();
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        audioSourceRef.current = source;
    }, [isAudioReady]);

    const handlePlayPause = async () => {
        // Resume AudioContext on first user interaction
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (videoEnded) { // Replay
            setVideoEnded(false);
            setCurrentSceneIndex(0);
            setIsPlaying(true);
            playAudioFromStart();
        } else { // Play/Pause
            if (!isPlaying) {
                playAudioFromStart();
            } else {
                audioSourceRef.current?.stop();
            }
            setIsPlaying(!isPlaying);
        }
    };
    
    const handleDownload = useCallback(async () => {
        setActionStatus(s => ({ ...s, download: 'loading' }));
        try {
            const zip = new JSZip();
            const imgFolder = zip.folder("images");

            for (const scene of assets.script) {
                if (scene.image_url) {
                    const response = await fetch(scene.image_url);
                    const blob = await response.blob();
                    imgFolder.file(`scene_${scene.scene_number}.jpg`, blob);
                }
            }
            
            const scriptStr = JSON.stringify(assets.script, null, 2);
            zip.file("script.json", scriptStr);
            
            if(assets.audioData) {
                zip.file("voiceover.mp3", assets.audioData, {base64: true});
            }

            const content = await zip.generateAsync({ type: "blob" });
            
            const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = "choroai_assets.zip";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            setActionStatus(s => ({ ...s, download: 'success' }));
        } catch (error) {
            console.error("Failed to create zip:", error);
            setActionStatus(s => ({ ...s, download: 'error' }));
        }
    }, [assets]);

    const handleShare = useCallback(async () => {
        const currentScene = assets.script[currentSceneIndex];
        if (!currentScene.image_url) return;

        setActionStatus(s => ({ ...s, share: 'loading' }));
        try {
            const response = await fetch(currentScene.image_url);
            const blob = await response.blob();
            const file = new File([blob], `scene_${currentScene.scene_number}.jpg`, { type: 'image/jpeg' });
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'ChoroAI Video Scene',
                    text: currentScene.narration,
                    files: [file],
                });
                setActionStatus(s => ({ ...s, share: 'success' }));
            } else {
                await navigator.clipboard.writeText(`${currentScene.narration}\n\n${config.prompt}`);
                alert('Share API not available. Story copied to clipboard!');
                setActionStatus(s => ({ ...s, share: 'success' }));
            }
        } catch (error) {
            console.error('Sharing failed:', error);
            setActionStatus(s => ({ ...s, share: 'error' }));
        }
    }, [assets.script, currentSceneIndex, config.prompt]);

    const handleThumbnailDownload = useCallback(() => {
        const currentScene = assets.script[currentSceneIndex];
        if (!currentScene.image_url) return;
        
        const link = document.createElement('a');
        link.href = currentScene.image_url;
        link.download = `thumbnail_scene_${currentScene.scene_number}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [assets.script, currentSceneIndex]);

    const currentScene = assets.script[currentSceneIndex];

    const ActionButton: React.FC<{ icon: React.ReactNode, label: string, onClick?: () => void, status?: string }> = ({ icon, label, onClick, status }) => {
        const getIcon = () => {
            if (status === 'loading') return <Loader className="w-6 h-6 animate-spin"/>;
            if (status === 'error') return <AlertTriangle className="w-6 h-6 text-red-500"/>;
            return icon;
        };
        return (
            <button onClick={onClick} disabled={status === 'loading'} className="flex flex-col items-center space-y-1 text-slate-300 hover:text-brand-cyan transition-colors group disabled:opacity-50 disabled:cursor-wait">
                <div className="p-3 bg-slate-800 rounded-full border border-slate-700 group-hover:border-brand-cyan/50 group-hover:bg-brand-cyan/10">
                    {getIcon()}
                </div>
                <span className="text-xs font-medium">{label}</span>
            </button>
        );
    }

    return (
        <div className="w-full flex flex-col lg:flex-row gap-8 items-center justify-center">
            <div className="w-full lg:w-2/3 flex flex-col items-center">
                <div 
                    className={`relative w-full bg-black rounded-lg overflow-hidden border-2 border-slate-800 shadow-2xl shadow-brand-cyan/10`}
                    style={{ aspectRatio: config.aspectRatio.replace(':', '/') }}
                >
                    <AnimatePresence>
                        {currentScene && (
                            <motion.div
                                key={currentScene.scene_number}
                                className="absolute inset-0"
                                variants={slideVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 1.5, ease: 'easeInOut' }}
                            >
                                <motion.img
                                    src={currentScene.image_url}
                                    alt={currentScene.visual_description}
                                    className="w-full h-full object-cover"
                                    initial={{ scale: 1.1, opacity: 0.8 }}
                                    animate={{ scale: 1, opacity: 1, transition: { duration: SCENE_DURATION / 1000 + 1, ease: 'linear' } }}
                                />
                                {config.subtitles && (
                                    <motion.p
                                        key={`${currentScene.scene_number}-sub`}
                                        className="absolute bottom-5 left-5 right-5 text-center text-white text-lg md:text-xl lg:text-2xl font-bold p-2 bg-black/50 rounded-md"
                                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                                        variants={subtitleVariants}
                                    >
                                        {currentScene.narration}
                                    </motion.p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                     {!isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <button onClick={handlePlayPause} className="w-20 h-20 text-white bg-black/50 rounded-full flex items-center justify-center hover:bg-brand-cyan/20 transition-colors backdrop-blur-sm border border-white/20">
                                {videoEnded ? <RefreshCw className="w-10 h-10"/> : <Play className="w-10 h-10 ml-1"/>}
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full mt-4 p-2 bg-slate-900 rounded-lg flex items-center space-x-4">
                    <button onClick={handlePlayPause} className="p-2 text-white hover:text-brand-cyan transition">
                        {videoEnded ? <RefreshCw className="w-6 h-6"/> : isPlaying ? <Pause className="w-6 h-6"/> : <Play className="w-6 h-6"/>}
                    </button>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                       <motion.div
                          className="bg-brand-cyan h-1.5 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${((currentSceneIndex + 1) / assets.script.length) * 100}%` }}
                          transition={{ duration: 0.5 }}
                       />
                    </div>
                     <span className="text-sm text-slate-400">{currentSceneIndex + 1} / {assets.script.length}</span>
                </div>
            </div>

            <div className="w-full lg:w-1/3 p-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                <h3 className="text-2xl font-bold mb-6">Your Video is Ready!</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <ActionButton icon={<Download className="w-6 h-6"/>} label="Download" onClick={handleDownload} status={actionStatus.download} />
                    {/* FIX: Corrected typo from action-status to actionStatus */}
                    <ActionButton icon={<Share2 className="w-6 h-6"/>} label="Share" onClick={handleShare} status={actionStatus.share}/>
                    <ActionButton icon={<Repeat className="w-6 h-6"/>} label="Regenerate" onClick={onReset} />
                    <ActionButton icon={<Edit className="w-6 h-6"/>} label="Edit Script" onClick={onEditScript} />
                    <ActionButton icon={<Book className="w-6 h-6"/>} label="Next Episode" onClick={onGenerateNextEpisode} />
                    <ActionButton icon={<div className="w-6 h-6 text-2xl">🖼️</div>} label="Thumbnail" onClick={handleThumbnailDownload} />
                </div>
                <button onClick={onReset} className="w-full mt-8 py-2 px-4 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition">
                    Create Another Video
                </button>
            </div>
        </div>
    );
};

export default VideoPreview;