import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Download, Upload, Sparkles, RefreshCw, CheckCircle, ShieldCheck, Heart, Radio, Music, Award, Bookmark, MessageSquare, AlertCircle, Trash2 } from 'lucide-react';
import { ListeningStats, SongRequestRecord, DedicationRecord, Article, VibeType, UserStationDnaExport } from '../types';
import { generateListenerDnaPersonality } from '../services/geminiService';
import confetti from 'canvas-confetti';

interface StationDnaHubProps {
  username: string;
  listeningStats: ListeningStats;
  favoriteShows: number[];
  favoriteDjs: number[];
  songRequests: SongRequestRecord[];
  userVibe: VibeType | null;
  onRestoreDna: (importedDna: UserStationDnaExport) => void;
  onClearData?: () => void;
}

const StationDnaHub: React.FC<StationDnaHubProps> = ({
  username,
  listeningStats,
  favoriteShows,
  favoriteDjs,
  songRequests,
  userVibe,
  onRestoreDna,
  onClearData,
}) => {
  const [dnaArchetype, setDnaArchetype] = useState<{ archetype: string; title: string; description: string; sonicVibe: string } | null>(null);
  const [isGeneratingDna, setIsGeneratingDna] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'dna' | 'backup'>('overview');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate Station DNA export object
  const getExportData = (): UserStationDnaExport => ({
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    username,
    listeningStats,
    favoriteShows,
    favoriteDjs,
    songRequests,
    vibeVote: userVibe,
  });

  // Export as downloadable JSON file
  const handleDownloadBackup = () => {
    const data = getExportData();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nam-radio-dna-${username.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as UserStationDnaExport;
        if (parsed.listeningStats) {
          onRestoreDna(parsed);
          setImportStatus({ success: true, message: `Successfully restored listener profile for ${parsed.username || username}!` });
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } else {
          setImportStatus({ success: false, message: 'Invalid station DNA file format.' });
        }
      } catch (err) {
        setImportStatus({ success: false, message: 'Failed to parse JSON file. Please ensure it is a valid backup.' });
      }
    };
    reader.readAsText(file);
  };

  // Handle manual JSON paste import
  const handlePasteImport = () => {
    try {
      const parsed = JSON.parse(jsonText) as UserStationDnaExport;
      if (parsed.listeningStats) {
        onRestoreDna(parsed);
        setImportStatus({ success: true, message: 'Profile restored from pasted data successfully!' });
        setShowJsonModal(false);
        setJsonText('');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } else {
        setImportStatus({ success: false, message: 'Invalid station DNA data structure.' });
      }
    } catch (err) {
      setImportStatus({ success: false, message: 'Invalid JSON string provided.' });
    }
  };

  // AI Archetype generation
  const handleGenerateDna = async () => {
    setIsGeneratingDna(true);
    try {
      const result = await generateListenerDnaPersonality(listeningStats, username);
      setDnaArchetype(result);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDna(false);
    }
  };

  const totalMinutes = Math.round(listeningStats.totalListeningTime / 60);
  const totalHours = (listeningStats.totalListeningTime / 3600).toFixed(1);

  return (
    <section className="bg-slate-950/40 backdrop-blur-2xl rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-800/80 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display flex items-center gap-2">
              Station DNA Hub
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero Data Silos
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Your decentralized listener profile, listening memory, ratings, and cloud sync.
            </p>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center bg-slate-900/60 p-1 rounded-xl border border-slate-800/80 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'overview'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSubTab('dna')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'dna'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AI Sonic Persona
          </button>
          <button
            onClick={() => setActiveSubTab('backup')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeSubTab === 'backup'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sync & Backup
          </button>
        </div>
      </div>

      {/* Import Status Alert */}
      <AnimatePresence>
        {importStatus && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${
              importStatus.success
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {importStatus.success ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{importStatus.message}</span>
            </div>
            <button
              onClick={() => setImportStatus(null)}
              className="text-xs hover:underline font-mono ml-4"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab 1: Overview */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
              <p className="text-xs font-mono uppercase text-slate-500 font-semibold">Total Airtime</p>
              <p className="text-2xl font-extrabold text-white mt-1">{totalHours} <span className="text-sm font-normal text-slate-400">hrs</span></p>
              <p className="text-[11px] text-amber-400 mt-1">{totalMinutes} live minutes</p>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
              <p className="text-xs font-mono uppercase text-slate-500 font-semibold">Station Points</p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{listeningStats.points || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Level Points</p>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
              <p className="text-xs font-mono uppercase text-slate-500 font-semibold">Tracks Rated</p>
              <p className="text-2xl font-extrabold text-white mt-1">
                {(listeningStats.likedSongs?.length || 0) + (listeningStats.dislikedSongs?.length || 0)}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">{listeningStats.likedSongs?.length || 0} Liked Tracks</p>
            </div>

            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
              <p className="text-xs font-mono uppercase text-slate-500 font-semibold">Live Requests</p>
              <p className="text-2xl font-extrabold text-white mt-1">{songRequests?.length || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">{favoriteShows?.length || 0} Favorited Shows</p>
            </div>
          </div>

          {/* Connected Data Pillars (Zero Silos proof) */}
          <div className="bg-slate-900/30 rounded-xl p-5 border border-slate-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Cross-Platform Real-Time Sync Streams
              </h3>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ● Active & Synced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-2.5">
                <Music className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-200">Player & Stream History</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Synced with AzuraCast now playing, ratings history, and real-time audio dock.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-200">Chat & DJ Community</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Dedication broadcasts, level-up alerts, points accumulation, and trivia wins.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-2.5">
                <Bookmark className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-200">Content Hub & News</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Saved articles, summaries, local music events, and personalized show scouts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AI Sonic Persona */}
      {activeSubTab === 'dna' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900/40 to-amber-500/10 p-6 rounded-2xl border border-amber-500/20 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white font-display">
                Listener Sonic Archetype & DNA
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                Gemini analyzes your total broadcast hours, liked rhythms, favorite DJs, and station contributions to craft your one-of-a-kind musical persona.
              </p>
            </div>

            {dnaArchetype ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-950/80 rounded-xl p-5 border border-amber-500/30 text-left space-y-3 max-w-xl mx-auto"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      Archetype Profile
                    </span>
                    <h4 className="text-lg font-bold text-white">{dnaArchetype.archetype}</h4>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-500/30">
                    {dnaArchetype.title}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {dnaArchetype.description}
                </p>

                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <p className="text-xs font-mono text-slate-400 uppercase font-semibold">Sonic Spectrum:</p>
                  <p className="text-xs text-amber-300 mt-0.5 font-medium">{dnaArchetype.sonicVibe}</p>
                </div>
              </motion.div>
            ) : null}

            <button
              onClick={handleGenerateDna}
              disabled={isGeneratingDna}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGeneratingDna ? 'Analyzing Musical DNA...' : dnaArchetype ? 'Recalculate Persona' : 'Generate My Sonic Persona'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Backup, Export & Portability (No Data Silos) */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Card */}
            <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Download className="w-5 h-5" />
                  <h4>Export Listener Profile (JSON)</h4>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Download an unencrypted, portable snapshot of your points, liked tracks, favorite DJs, and station history. Keep it on your device or transfer it anywhere.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handleDownloadBackup}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Backup File
                </button>
                <button
                  onClick={() => {
                    setJsonText(JSON.stringify(getExportData(), null, 2));
                    setShowJsonModal(true);
                  }}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-all"
                >
                  View JSON Raw
                </button>
              </div>
            </div>

            {/* Import / Restore Card */}
            <div className="p-5 bg-slate-900/50 rounded-xl border border-slate-800/80 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Upload className="w-5 h-5" />
                  <h4>Restore / Import Station DNA</h4>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Switching phones, clearing cache, or using a new browser? Upload your backup file to restore all your points, level badges, and favorites instantly.
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,application/json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose JSON File to Restore
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white font-display">Station DNA JSON Data</h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Close
              </button>
            </div>

            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-amber-500/50"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(jsonText);
                  setImportStatus({ success: true, message: 'JSON copied to clipboard!' });
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handlePasteImport}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                Apply / Restore Data
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default StationDnaHub;
