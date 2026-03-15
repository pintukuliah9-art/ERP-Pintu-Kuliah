import React, { useState } from 'react';
import { Icon } from './Icon';
import { GeminiService } from '../services/geminiService';
import { DivisionType, Tool } from '../types';

interface SmartAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (tool: any) => void;
    divisionName: string;
}

export const SmartAddModal: React.FC<SmartAddModalProps> = ({ isOpen, onClose, onAdd, divisionName }) => {
    const [input, setInput] = useState('');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [preview, setPreview] = useState<Partial<Tool> | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!input) return;
        setIsLoading(true);
        const config = await GeminiService.generateToolConfig(input, divisionName);
        setPreview(config);
        setIsLoading(false);
    };

    const handleConfirm = () => {
        if (preview) {
            onAdd({
                ...preview,
                url: url || '#',
                divisionId: divisionName as DivisionType
            });
            onClose();
            // Reset
            setInput('');
            setUrl('');
            setPreview(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                             <Icon name="Sparkles" className="animate-pulse" />
                             <h2 className="text-xl font-bold">AI Smart Add</h2>
                        </div>
                        <button onClick={onClose} className="text-white/80 hover:text-white"><Icon name="X" size={20}/></button>
                    </div>
                    <p className="text-white/80 text-sm mt-2">Describe the tool, and AI will categorize and design it for you.</p>
                </div>

                <div className="p-6 space-y-4">
                    {!preview ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">What is this tool?</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none resize-none h-24"
                                    placeholder="e.g., Link for the Q3 Marketing Campaign Spreadsheet..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL (Optional)</label>
                                <input 
                                    type="url"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                    placeholder="https://..."
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={handleGenerate}
                                disabled={isLoading || !input}
                                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Icon name="Loader2" className="animate-spin" /> : <Icon name="Wand2" />}
                                Generate Configuration
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <h3 className="text-sm text-gray-500 uppercase tracking-wide font-bold mb-2">Preview</h3>
                                <div className="inline-flex flex-col items-center p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 w-32">
                                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md mb-2 ${preview.color}`}>
                                        <Icon name={preview.icon || 'Link'} size={24} />
                                    </div>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 text-center">{preview.name}</span>
                                    <span className="mt-1 text-[9px] px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        {preview.category}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setPreview(null)}
                                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Try Again
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-500/30"
                                >
                                    Confirm & Add
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};