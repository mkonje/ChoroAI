
import React from 'react';
import { motion } from 'framer-motion';
import { GENERATION_STEPS } from '../constants';
import type { GenerationProgress } from '../types';
import { CheckCircle, Loader, Edit3, Film, ImageIcon, Mic, Music, Settings, Subtitles } from './icons/Icons';

interface GenerationProgressProps {
    progress: GenerationProgress;
}

const iconMap: Record<string, React.ElementType> = {
    script: Edit3,
    image: ImageIcon,
    transitions: Film,
    subtitles: Subtitles,
    voiceover: Mic,
    music: Music,
    render: Settings,
};

const GenerationProgressComponent: React.FC<GenerationProgressProps> = ({ progress }) => {
    
    const getStatusIcon = (stepId: number) => {
        if (stepId < progress.step) {
            return <CheckCircle className="w-6 h-6 text-green-400" />;
        }
        if (stepId === progress.step) {
            return <Loader className="w-6 h-6 text-brand-cyan animate-spin" />;
        }
        return <div className="w-6 h-6 border-2 border-slate-600 rounded-full" />;
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800">
            <h2 className="text-3xl font-bold text-center mb-8">Bringing Your Story to Life...</h2>
            
            <div className="space-y-4 mb-8">
                {GENERATION_STEPS.map((step) => {
                    const IconComponent = iconMap[step.icon];
                    const isCompleted = step.id < progress.step;
                    const isInProgress = step.id === progress.step;

                    return (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: step.id * 0.1 }}
                            className={`flex items-center space-x-4 p-3 rounded-lg transition-all ${
                                isInProgress ? 'bg-slate-800/50' : ''
                            } ${isCompleted ? 'opacity-70' : 'opacity-100'}`}
                        >
                            <div className={`transition-transform duration-500 ${isInProgress ? 'scale-110' : ''}`}>
                                {getStatusIcon(step.id)}
                            </div>
                            <div className="flex-1">
                                <p className={`font-medium ${
                                    isCompleted ? 'text-slate-400 line-through' : 
                                    isInProgress ? 'text-brand-cyan' : 'text-slate-200'
                                }`}>
                                    {step.text}
                                </p>
                                {isInProgress && <p className="text-sm text-slate-400">{progress.message}</p>}
                            </div>
                            {IconComponent && <IconComponent className={`w-6 h-6 ${isCompleted ? 'text-slate-500' : 'text-slate-400'}`} />}
                        </motion.div>
                    );
                })}
            </div>

            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <motion.div
                    className="bg-brand-cyan h-2.5 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress.progress}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>
            <p className="text-center text-sm text-slate-400 mt-2">{Math.round(progress.progress)}% Complete</p>
        </div>
    );
};

export default GenerationProgressComponent;
