import React, { useState, useEffect } from 'react';
import { getLiveStats, getListenerReport, getPerformanceReport, getSongHistory } from '../services/azuracastService';
import { AzuraListeners, AzuraListenersReport, AzuraPerformanceReportItem, AzuraHistoryItem, Song } from '../types';

// Icons
const ListenersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M12 14a5 5 0 110-10 5 5 0 010 10z" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const MusicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const AdminDashboard: React.FC = () => {
    const [liveStats, setLiveStats] = useState<AzuraListeners | null>(null);
    const [listenerReport, setListenerReport] = useState<AzuraListenersReport | null>(null);
    const [topSongs, setTopSongs] = useState<AzuraPerformanceReportItem[]>([]);
    const [songHistory, setSongHistory] = useState<AzuraHistoryItem[]>([]);
    const [peakListeners, setPeakListeners] = useState(0);

    const [loading, setLoading] = useState({
        live: true, report: true, top: true, history: true
    });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(prev => ({ ...prev, report: true, top: true, history: true }));
                const [report, performance, history] = await Promise.all([
                    getListenerReport(),
                    getPerformanceReport(),
                    getSongHistory()
                ]);
                setListenerReport(report);
                setTopSongs(performance);
                setSongHistory(history);
            } catch (err) {
                setError("Failed to load initial station reports. The server might be unavailable or a CORS issue may be present.");
            } finally {
                setLoading(prev => ({ ...prev, report: false, top: false, history: false }));
            }
        };

        const pollLiveStats = async () => {
             try {
                const stats = await getLiveStats();
                setLiveStats(stats);
                setPeakListeners(prevPeak => Math.max(prevPeak, stats.current));
            } catch (err) {
                // Don't set a blocking error for the poller
                console.error("Failed to poll live stats");
            } finally {
                setLoading(prev => ({ ...prev, live: false }));
            }
        };

        fetchInitialData();
        pollLiveStats();
        const interval = setInterval(pollLiveStats, 20000); // Poll every 20 seconds

        return () => clearInterval(interval);
    }, []);

    const StatCard: React.FC<{ title: string; value: string | number; subtext: string; icon: React.ReactNode; }> = ({ title, value, subtext, icon }) => (
        <div className="bg-slate-800/50 p-6 rounded-lg flex items-center gap-4">
            <div className="p-3 bg-slate-700/50 rounded-full text-amber-400">{icon}</div>
            <div>
                <p className="text-sm text-slate-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500">{subtext}</p>
            </div>
        </div>
    );
    
    const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'});

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Admin Dashboard</h1>
                <p className="text-slate-400 mt-2 max-w-2xl">Real-time statistics and reports for Nam Radio Live.</p>
            </header>

            {error && (
                <div className="p-4 bg-red-500/10 text-red-300 rounded-lg border border-red-500/20">{error}</div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Live Listeners" value={loading.live ? '...' : liveStats?.current ?? 0} subtext="Right now" icon={<ListenersIcon />}/>
                <StatCard title="Peak Listeners" value={peakListeners} subtext="Today" icon={<ChartIcon />}/>
                <StatCard title="Avg. Listeners" value={loading.report ? '...' : listenerReport?.total.avg_listeners.toFixed(0) ?? 0} subtext="Last 24 hours" icon={<ListenersIcon />}/>
                <StatCard title="Total Listener Hours" value={loading.report ? '...' : listenerReport?.tlh.text ?? 'N/A'} subtext="Last 24 hours" icon={<ClockIcon />}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
                    <h2 className="text-2xl font-bold mb-4 tracking-wide text-white">Top 5 Played Songs</h2>
                    <p className="text-sm text-slate-400 mb-6">Most played tracks in the last 7 days.</p>
                    {loading.top ? <p className="text-center">Loading...</p> : (
                        <ul className="space-y-3">
                            {topSongs.map((item, index) => (
                                <li key={item.song.title + index} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="text-sm font-mono text-slate-500">{index + 1}.</span>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-white truncate">{item.song.title}</p>
                                            <p className="text-xs text-slate-400 truncate">{item.song.artist}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md">{item.play_count} plays</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-slate-700/50">
                    <h2 className="text-2xl font-bold mb-4 tracking-wide text-white">Recent Song History</h2>
                     <p className="text-sm text-slate-400 mb-6">The last 10 tracks played on air.</p>
                    {loading.history ? <p className="text-center">Loading...</p> : (
                         <ul className="space-y-3">
                            {songHistory.map((item) => (
                                <li key={item.played_at} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between gap-4">
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-white truncate">{item.song.title}</p>
                                        <p className="text-xs text-slate-400 truncate">{item.song.artist}</p>
                                    </div>
                                    <span className="text-sm font-mono text-slate-400">{formatTime(item.played_at)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard;