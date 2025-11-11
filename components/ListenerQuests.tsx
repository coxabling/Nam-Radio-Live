import React from 'react';
import { Quest } from '../types';

interface ListenerQuestsProps {
    quests: Quest[];
}

const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>);
const QuestIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>);

const ListenerQuests: React.FC<ListenerQuestsProps> = ({ quests }) => {
    if (!quests || quests.length === 0) {
        return (
            <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
                <h2 className="text-2xl font-bold mb-6 tracking-wide text-white flex items-center gap-3">
                    <QuestIcon />
                    Daily Listener Quests
                </h2>
                <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                    <p className="text-slate-400">DJ Alex is preparing your quests for today...</p>
                    <p className="text-sm text-slate-500 mt-1">Check back soon!</p>
                </div>
            </section>
        );
    }
    
    return (
        <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-lg border border-slate-700/50">
            <h2 className="text-2xl font-bold mb-6 tracking-wide text-white flex items-center gap-3">
                <QuestIcon />
                Daily Listener Quests
            </h2>
            <div className="space-y-4">
                {quests.map(quest => {
                    const progressPercentage = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0;
                    const isCompleted = quest.status === 'completed';

                    return (
                        <div key={quest.id} className={`p-4 rounded-lg transition-all ${isCompleted ? 'bg-green-500/10' : 'bg-slate-800/50'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <p className={`font-semibold ${isCompleted ? 'text-green-300' : 'text-white'}`}>{quest.description}</p>
                                <div className={`flex-shrink-0 text-sm font-bold px-2 py-1 rounded-md ${isCompleted ? 'bg-green-500/20 text-green-300' : 'bg-amber-500/20 text-amber-300'}`}>
                                    +{quest.reward} Points
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-4">
                                <div className="w-full bg-slate-700 rounded-full h-2.5">
                                    <div className={`${isCompleted ? 'bg-green-500' : 'bg-amber-500'} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${progressPercentage}%` }}></div>
                                </div>
                                <div className="flex-shrink-0 text-xs font-mono w-16 text-right">
                                    {isCompleted ? (
                                        <span className="text-green-400 flex items-center justify-end gap-1"><CheckIcon /> Done!</span>
                                    ) : (
                                        <span className="text-slate-400">{Math.floor(quest.progress)} / {quest.target}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default ListenerQuests;
