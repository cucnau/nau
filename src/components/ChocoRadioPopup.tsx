import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { RadioManager, TrackDef } from '../lib/radioManager';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Play, Pause, Volume2, 
  VolumeX, Disc, CloudRain, Flame, 
  Waves, Wind, Music, ShieldAlert, Radio,
  Trash2, Plus, FileAudio, Shuffle, Repeat,
  Repeat1, SkipForward, SkipBack
} from 'lucide-react';

// Help parse any Spotify link (track, playlist, album, artist) into a working embed URL
function parseSpotifyEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/open\.spotify\.com\/(track|playlist|album|artist)\/([a-zA-Z0-9]+)/);
  if (match) {
    const type = match[1];
    const id = match[2];
    return `https://open.spotify.com/embed/${type}/${id}`;
  }
  return null;
}

export function ChocoRadioPopup() {
  const { isChocoRadioOpen, setChocoRadioOpen, theme } = useStore();
  const isDark = theme === 'dark';

  const [isPlaying, setIsPlaying] = useState(RadioManager.isPlaying);
  const [muted, setMuted] = useState(RadioManager.muted);
  const [activeTrackId, setActiveTrackId] = useState(RadioManager.activeTrackId);
  const [tracks, setTracks] = useState<TrackDef[]>(RadioManager.tracks);
  const [playMode, setPlayMode] = useState(RadioManager.playMode);

  const [rainVol, setRainVol] = useState(RadioManager.rainVol);
  const [fireVol, setFireVol] = useState(RadioManager.fireVol);
  const [wavesVol, setWavesVol] = useState(RadioManager.wavesVol);
  const [windVol, setWindVol] = useState(RadioManager.windVol);

  // Custom song addition states
  const [customTitle, setCustomTitle] = useState('');
  const [customType, setCustomType] = useState<'spotify' | 'file'>('spotify');
  const [spotifyLink, setSpotifyLink] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Sync state with RadioManager
  useEffect(() => {
    const unsub = RadioManager.subscribe(() => {
      setIsPlaying(RadioManager.isPlaying);
      setMuted(RadioManager.muted);
      setActiveTrackId(RadioManager.activeTrackId);
      setTracks(RadioManager.tracks);
      setPlayMode(RadioManager.playMode);
      
      setRainVol(RadioManager.rainVol);
      setFireVol(RadioManager.fireVol);
      setWavesVol(RadioManager.wavesVol);
      setWindVol(RadioManager.windVol);
    });
    return unsub;
  }, []);

  if (!isChocoRadioOpen) return null;

  const handleTogglePlay = () => {
    RadioManager.togglePlay();
  };

  const handleToggleMute = () => {
    RadioManager.toggleMute();
  };

  const handleSelectTrack = (id: string) => {
    RadioManager.selectTrack(id);
  };

  const handleVolChange = (type: 'rain' | 'fire' | 'waves' | 'wind', val: number) => {
    RadioManager.setVolume(type, val);
  };

  const handlePlayNext = () => {
    RadioManager.playNextTrack();
  };

  const handlePlayPrev = () => {
    RadioManager.playPrevTrack();
  };

  const handleTogglePlayMode = () => {
    RadioManager.togglePlayMode();
  };

  const activeTrack = tracks.find(t => t.id === activeTrackId) || tracks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setChocoRadioOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
      />

      {/* Main Dialog Modal */}
      <motion.div
        initial={{ scale: 0.95, y: 15, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 15, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className="relative bg-[#FFFDF9] dark:bg-[#1A1412] w-full max-w-lg rounded-[2.5rem] overflow-hidden border-4 border-[#3E2723] dark:border-[#5D4037] shadow-[0_4px_0_0_#3E2723] dark:shadow-[0_4px_0_0_#0D0907] flex flex-col max-h-[92vh] z-10"
      >
        {/* Close triggers */}
        <button
          onClick={() => setChocoRadioOpen(false)}
          className="absolute top-5 right-5 w-9 h-9 bg-white dark:bg-[#2C221D] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-xl flex items-center justify-center hover:bg-[#F5E6D3] dark:hover:bg-[#342823] shadow-[0_3px_0_0_#3E2723] dark:shadow-[0_2px_0_0_#0D0907] transition-all active:translate-y-1 active:shadow-none z-10 cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto flex-1 p-6 scrollbar-thin">
          <div className="text-center mt-3 select-none">
            <h1 className="text-2xl font-black text-[#3E2723] dark:text-[#ECE5DC] uppercase tracking-wide flex items-center justify-center gap-2">
              <Radio className="w-6 h-6 text-rose-500 animate-pulse" /> Choco Radio
            </h1>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
              Giai điệu lofi ấm áp kết hợp các âm thanh môi trường xung quanh do chính bạn hòa phối.
            </p>
          </div>

          {/* Vinyl & Visualizer Section */}
          <div className="flex flex-col items-center justify-center py-5">
            <div className="relative">
              {/* Spinning Vinyl Record Disc */}
              <motion.div 
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={isPlaying ? { repeat: Infinity, duration: 12, ease: "linear" } : {}}
                className="w-36 h-36 rounded-full bg-stone-900 border-4 border-stone-800 shadow-xl flex items-center justify-center relative select-none"
              >
                {/* Vinyl Grooves groove */}
                <div className="absolute inset-2 rounded-full border border-stone-700/60" />
                <div className="absolute inset-5 rounded-full border border-stone-700/60" />
                <div className="absolute inset-8 rounded-full border border-stone-700/40" />
                <div className="absolute inset-11 rounded-full border border-stone-700/30" />

                {/* center labeling label */}
                <div className="w-12 h-12 rounded-full bg-[#E6D4BF] border-[2px] border-stone-900 flex items-center justify-center text-[8px] font-black text-[#5D4037] text-center select-none leading-none px-1 overflow-hidden truncate">
                  CHOCO
                </div>

                {/* Center dot pin */}
                <div className="absolute w-2 h-2 rounded-full bg-[#1A1412] border border-[#FFFDF9]" />
              </motion.div>

              {/* Tonearm needle */}
              <motion.div 
                animate={isPlaying ? { rotate: 18 } : { rotate: -10 }}
                transition={{ duration: 0.8 }}
                style={{ originX: "80%", originY: "10%" }}
                className="absolute -top-3 -right-3 w-16 h-20 pointer-events-none transform origin-top-right select-none"
              >
                <div className="absolute right-3 top-2 w-4 h-4 rounded-full bg-stone-700 border-2 border-stone-500" />
                <div className="absolute right-5 top-5 w-1 bg-stone-500 h-12 transform -rotate-12 outline-none" />
                <div className="absolute right-8 top-16 w-2.5 h-3.5 bg-stone-600 rounded-sm transform rotate-45" />
              </motion.div>
            </div>

            {/* Now Playing Title */}
            <div className="text-center mt-4 px-4 w-full">
              <h3 className="font-extrabold text-sm text-[#3E2723] dark:text-[#ECE5DC] truncate max-w-xs mx-auto">
                {activeTrack ? activeTrack.title : "Chucu Cozy Rhodes"}
              </h3>
              <p className="text-[11px] text-[#8D6E63] dark:text-stone-400 mt-1 line-clamp-1 max-w-xs mx-auto leading-relaxed h-5">
                {activeTrack ? activeTrack.desc : ""}
              </p>
            </div>

            {/* Spotify Player Embed Widget */}
            {activeTrack && activeTrack.isSpotify && activeTrack.spotifyEmbedUrl && (
              <div className="w-full max-w-sm mt-3 bg-black/5 dark:bg-black/35 rounded-2xl overflow-hidden p-0.5 border border-[#3E2723]/10 dark:border-stone-800">
                <iframe
                  src={activeTrack.spotifyEmbedUrl}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allowFullScreen={false}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-xl block"
                />
              </div>
            )}
          </div>

          {/* Control Bar buttons */}
          <div className="flex flex-col items-center gap-2 mb-5 select-none">
            <div className="flex items-center justify-center gap-2.5">
              {/* Mute Button */}
              <button
                type="button"
                onClick={handleToggleMute}
                title="Bật/Tắt âm"
                className="p-2.5 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-2xl hover:bg-[#F5E6D3] hover:scale-105 active:scale-95 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
              >
                {muted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
              </button>

              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePlayPrev}
                title="Bài trước"
                className="p-2.5 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-2xl hover:bg-[#F5E6D3] hover:scale-105 active:scale-95 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
              >
                <SkipBack className="w-4 h-4 text-[#3E2723] dark:text-[#ECE5DC] fill-current" />
              </button>

              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                title={isPlaying ? "Tạm dừng" : "Phát nhạc"}
                className="p-4 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/45 dark:hover:bg-amber-900 border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-full scale-105 hover:scale-110 active:scale-95 shadow-[0_3px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-[#3E2723] dark:fill-amber-300" /> : <Play className="w-5 h-5 fill-[#3E2723] dark:fill-amber-300 ml-0.5" />}
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={handlePlayNext}
                title="Bài tiếp theo"
                className="p-2.5 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-2xl hover:bg-[#F5E6D3] hover:scale-105 active:scale-95 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
              >
                <SkipForward className="w-4 h-4 text-[#3E2723] dark:text-[#ECE5DC] fill-current" />
              </button>

              {/* Play Mode Button */}
              <button
                type="button"
                onClick={handleTogglePlayMode}
                title="Chế độ phát"
                className="p-2.5 bg-[#FFFDF9] dark:bg-[#251E1B] border-[3px] border-[#3E2723] dark:border-[#4E342E] rounded-2xl hover:bg-[#F5E6D3] hover:scale-105 active:scale-95 shadow-[0_2px_0_0_#3E2723] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-[#3E2723] dark:text-[#ECE5DC]"
              >
                {playMode === 'loop_all' && <Repeat className="w-4 h-4 text-indigo-500" />}
                {playMode === 'loop_one' && <Repeat1 className="w-4 h-4 text-orange-500" />}
                {playMode === 'shuffle' && <Shuffle className="w-4 h-4 text-emerald-500" />}
              </button>
            </div>

            {/* Play Mode Indicator Label */}
            <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">
              {playMode === 'loop_all' && "🔁 Lặp toàn danh sách"}
              {playMode === 'loop_one' && "🔂 Lặp duy nhất 1 bài"}
              {playMode === 'shuffle' && "🔀 Phát ngẫu nhiên danh sách"}
            </span>
          </div>

          {/* Ambient Mixer sliders */}
          <div className="p-4 rounded-3xl bg-[#F5E6D3]/40 dark:bg-[#251E1B]/30 border-2 border-[#D7CCC8]/60 dark:border-[#5D4037]/20 mb-5 flex flex-col gap-3 font-sans">
            <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-1 select-none">
              🎚️ Bộ Trộn Âm Thanh Môi Trường (Ambient Mixer)
            </span>

            <div className="grid grid-cols-2 gap-4">
              {/* Rain noise */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#5D4037] dark:text-stone-300">
                  <span className="flex items-center gap-1"><CloudRain className="w-3.5 h-3.5 text-blue-400" /> Tiếng mưa</span>
                  <span className="text-[10px] text-stone-500">{rainVol}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={rainVol}
                  onChange={(e) => handleVolChange('rain', Number(e.target.value))}
                  className="w-full accent-[#8D6E63] h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Fire noise */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#5D4037] dark:text-stone-300">
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> Lò sưởi</span>
                  <span className="text-[10px] text-stone-500">{fireVol}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={fireVol}
                  onChange={(e) => handleVolChange('fire', Number(e.target.value))}
                  className="w-full accent-[#8D6E63] h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Ocean sound */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#5D4037] dark:text-stone-300">
                  <span className="flex items-center gap-1"><Waves className="w-3.5 h-3.5 text-teal-400" /> Biển cả</span>
                  <span className="text-[10px] text-stone-500">{wavesVol}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={wavesVol}
                  onChange={(e) => handleVolChange('waves', Number(e.target.value))}
                  className="w-full accent-[#8D6E63] h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Wind sound */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-bold text-[#5D4037] dark:text-stone-300">
                  <span className="flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Gió rừng</span>
                  <span className="text-[10px] text-stone-500">{windVol}%</span>
                </div>
                <input 
                  type="range" min="0" max="100" value={windVol}
                  onChange={(e) => handleVolChange('wind', Number(e.target.value))}
                  className="w-full accent-[#8D6E63] h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Playlist selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-stone-500 tracking-wider flex items-center gap-1 select-none">
              🎶 Danh Sách Giai Điệu ({tracks.length})
            </span>

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {tracks.map((t) => {
                const isActive = t.id === activeTrackId;
                return (
                  <div key={t.id} className="relative flex items-center group/track w-full">
                    <button
                      onClick={() => handleSelectTrack(t.id)}
                      className={`flex-1 p-3 rounded-2xl border-2 flex items-center justify-between text-left transition-all hover:translate-x-0.5 cursor-pointer max-w-full pr-12 ${
                        isActive 
                          ? 'bg-[#F5E6D3]/70 dark:bg-[#342823] border-[#8D6E63] shadow-sm' 
                          : 'bg-white dark:bg-[#1E1815] border-[#3E2723]/10 dark:border-stone-800 hover:border-[#8D6E63]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {t.isSpotify ? (
                          <div className="w-7 h-7 rounded-lg bg-green-400/10 border border-green-500/20 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-green-500">SP</span>
                          </div>
                        ) : t.isExternal ? (
                          <div className="w-7 h-7 rounded-lg bg-orange-400/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            {t.isLocalFile ? (
                              <FileAudio className="w-3.5 h-3.5 text-orange-500" />
                            ) : (
                              <Music className="w-3.5 h-3.5 text-orange-500" />
                            )}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-indigo-400/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <Disc className="w-3.5 h-3.5 text-indigo-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-[#3E2723] dark:text-[#ECE5DC] truncate">
                              {t.title}
                            </span>
                            {t.isSpotify && (
                              <span className="text-[8px] font-bold bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300 px-1.5 py-0.2 rounded-full border border-green-200 dark:border-green-900 leading-tight">
                                Spotify
                              </span>
                            )}
                            {t.isLocalFile && (
                              <span className="text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded-full border border-amber-200 dark:border-amber-900 leading-tight">
                                File
                              </span>
                            )}
                            {t.isExternal && !t.isSpotify && !t.isLocalFile && (
                              <span className="text-[8px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 px-1.5 py-0.2 rounded-full border border-orange-200 dark:border-orange-900 leading-tight">
                                Live Stream
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-stone-500 truncate mt-0.5">
                            {t.desc}
                          </p>
                        </div>
                      </div>

                      {isActive && (
                        <div className="flex gap-0.5 items-end justify-center h-4 shrink-0 px-1">
                          <span className="w-0.75 bg-[#8D6E63] rounded-t animate-bounce" style={{ height: '70%', animationDelay: '0.1s' }} />
                          <span className="w-0.75 bg-[#8D6E63] rounded-t animate-bounce" style={{ height: '95%', animationDelay: '0.3s' }} />
                          <span className="w-0.75 bg-[#8D6E63] rounded-t animate-bounce" style={{ height: '40%', animationDelay: '0.5s' }} />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bottom utility */}
        <div className="p-4 bg-[#F1E4D6]/50 dark:bg-[#1E1714] border-t-2 border-[#3E2723]/10 dark:border-stone-800 flex items-center justify-center shrink-0">
          <button
            onClick={() => setChocoRadioOpen(false)}
            className="w-full bg-[#8D6E63] text-white py-2.5 rounded-2xl font-black uppercase text-xs tracking-wider shadow-[0_3px_0_0_#5D4037] hover:bg-[#5D4037] hover:scale-102 active:scale-98 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer text-center"
          >
            📻 Đóng cửa sổ & Giữ nhạc chạy ở nền
          </button>
        </div>
      </motion.div>
    </div>
  );
}
