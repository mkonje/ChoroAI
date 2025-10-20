import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Scene } from '../types';

interface ScriptEditorProps {
    initialScript: Scene[];
    onSave: (newScript: Scene[]) => void;
    onCancel: () => void;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ initialScript, onSave, onCancel }) => {
    const [script, setScript] = useState<Scene[]>(initialScript);

    const handleTextChange = (index: number, field: 'narration' | 'visual_description', value: string) => {
        const newScript = [...script];
        newScript[index] = { ...newScript[index], [field]: value };
        setScript(newScript);
    };

    return (
        <motion.div 
            className="w-full max-w-5xl mx-auto p-8 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold">Edit Your Story Script</h2>
                <div className="flex justify-end gap-4">
                    <button 
                        onClick={onCancel} 
                        className="px-6 py-2 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onSave(script)} 
                        className="px-6 py-2 bg-brand-cyan text-slate-900 font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Save & Return to Preview
                    </button>
                </div>
            </div>
            
            <p className="text-slate-400 mb-8">
                Modify the narration for subtitles and voiceover, or change the visual descriptions to alter the generated images in a future regeneration.
            </p>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                {script.map((scene, index) => (
                    <div key={scene.scene_number} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <h3 className="text-lg font-bold text-brand-cyan mb-3">Scene {scene.scene_number}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-slate-400 mb-2 block">Narration</label>
                                <textarea
                                    value={scene.narration}
                                    onChange={(e) => handleTextChange(index, 'narration', e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-cyan focus:outline-none transition resize-y"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-400 mb-2 block">Visual Description (for AI Image Gen)</label>
                                <textarea
                                    value={scene.visual_description}
                                    onChange={(e) => handleTextChange(index, 'visual_description', e.target.value)}
                                    rows={4}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:ring-2 focus:ring-brand-cyan focus:outline-none transition resize-y"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ScriptEditor;