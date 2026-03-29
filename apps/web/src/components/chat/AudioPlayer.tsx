import { useState, useRef, useCallback, useEffect } from 'react';
import { IconPlay, IconPause } from '../icons';

interface AudioPlayerProps {
  src: string;
  isOwn: boolean;
}

export function AudioPlayer({ src, isOwn }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 py-0.5">
      <button
        type="button"
        onClick={togglePlay}
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors',
          isOwn ? 'bg-neutral-0/20 hover:bg-neutral-0/30' : 'bg-neutral-200 hover:bg-neutral-300',
        ].join(' ')}
      >
        {playing ? <IconPause className="h-3.5 w-3.5" /> : <IconPlay className="h-3.5 w-3.5" />}
      </button>
      <div className="flex min-w-[100px] flex-1 items-center gap-2">
        <div className={`h-1 flex-1 rounded-full ${isOwn ? 'bg-neutral-0/20' : 'bg-neutral-200'}`}>
          <div
            className={`h-1 rounded-full transition-all ${isOwn ? 'bg-neutral-0' : 'bg-brand-600'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-[10px] tabular-nums opacity-70">
          {formatDur(duration)}
        </span>
      </div>
    </div>
  );
}
