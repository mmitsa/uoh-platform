import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useApi } from '../hooks/useApi';
import { useAuth } from '../app/auth';
import { Button, useToast } from '../components/ui';
import {
  IconVideo, IconVideoOff, IconMicrophone, IconMicOff, IconScreenShare,
  IconPhone, IconChat, IconUser, IconMaximize, IconMinimize,
  IconHandRaised, IconRecord, IconSidebar, IconClock, IconArrowLeft,
  IconCheck, IconX, IconSend, IconMeetings, IconMapPin, IconCommittees,
  IconPaperclip,
} from '../components/icons';

/* ─── types ─── */
type MeetingDetail = {
  id: string;
  committeeId: string | null;
  committeeNameAr: string | null;
  committeeNameEn: string | null;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: string;
  startDateTimeUtc: string;
  endDateTimeUtc: string;
  status: string;
  location: string | null;
  onlinePlatform: string | null;
  onlineJoinUrl: string | null;
  recordingUrl: string | null;
  meetingRoomId: string | null;
  agenda: AgendaItem[];
  invitees: Invitee[];
};
type AgendaItem = { titleAr: string; titleEn: string; descriptionAr?: string; descriptionEn?: string; duration?: number; presenterName?: string };
type Invitee = { displayName: string; email: string; role: string };
type ChatMessage = { id: string; sender: string; avatar: string; text: string; time: string; isMine: boolean; reactions?: string[] };

/* ─── helpers ─── */
function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const AVATAR_COLORS = [
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-emerald-500 to-teal-600',
  'from-indigo-500 to-blue-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

const SPEAKING_DEMO = [0, 2, 4]; // indices that will "speak" in demo

/* ─── Phase type ─── */
type Phase = 'lobby' | 'live';

export function LiveMeetingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { get } = useApi();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';

  /* ─── Phase ─── */
  const [phase, setPhase] = useState<Phase>('lobby');

  /* ─── Meeting data ─── */
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);

  /* ─── Lobby controls ─── */
  const [lobbyMic, setLobbyMic] = useState(true);
  const [lobbyCam, setLobbyCam] = useState(true);

  /* ─── Meeting controls ─── */
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [recording, setRecording] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  /* ─── Sidebar ─── */
  const [sidebar, setSidebar] = useState<'none' | 'participants' | 'chat' | 'agenda'>('none');

  /* ─── Timer ─── */
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Agenda tracking ─── */
  const [currentAgendaIdx, setCurrentAgendaIdx] = useState(0);
  const [agendaItemElapsed, setAgendaItemElapsed] = useState(0);
  const agendaTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Speaking animation ─── */
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

  /* ─── Chat ─── */
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ─── Emoji reactions overlay ─── */
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number }[]>([]);

  /* ─── Iframe ref ─── */
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* ─── Load meeting ─── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await get<MeetingDetail>(`/api/v1/meetings/${id}`);
        setMeeting(res);
      } catch {
        toast.error(t('errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* ─── Timer (only in live) ─── */
  useEffect(() => {
    if (phase !== 'live') return;
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  /* ─── Agenda item timer ─── */
  useEffect(() => {
    if (phase !== 'live') return;
    setAgendaItemElapsed(0);
    if (agendaTimerRef.current) clearInterval(agendaTimerRef.current);
    agendaTimerRef.current = setInterval(() => setAgendaItemElapsed((p) => p + 1), 1000);
    return () => { if (agendaTimerRef.current) clearInterval(agendaTimerRef.current); };
  }, [phase, currentAgendaIdx]);

  /* ─── Simulated speaking indicator ─── */
  useEffect(() => {
    if (phase !== 'live' || !meeting) return;
    const interval = setInterval(() => {
      const rand = Math.random();
      if (rand < 0.3) setSpeakingIdx(null);
      else setSpeakingIdx(SPEAKING_DEMO[Math.floor(Math.random() * SPEAKING_DEMO.length)]);
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, meeting]);

  /* ─── Chat auto-scroll ─── */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ─── Seed demo chat ─── */
  useEffect(() => {
    if (!meeting || phase !== 'live') return;
    const demoMessages: ChatMessage[] = [
      { id: '1', sender: 'د. أحمد الشمري', avatar: 'أ', text: isAr ? 'السلام عليكم، مرحباً بالجميع' : 'Hello everyone, welcome!', time: '10:01', isMine: false },
      { id: '2', sender: user?.displayName ?? (isAr ? 'أنت' : 'You'), avatar: (user?.displayName ?? 'U').charAt(0), text: isAr ? 'وعليكم السلام' : 'Hi there!', time: '10:02', isMine: true },
      { id: '3', sender: 'أ. فاطمة العتيبي', avatar: 'ف', text: isAr ? 'جاهزين نبدأ' : 'Ready to start', time: '10:03', isMine: false, reactions: ['👍'] },
      { id: '4', sender: 'د. خالد المالكي', avatar: 'خ', text: isAr ? 'تمام، نبدأ بالبند الأول' : 'Ok, let\'s begin with item one', time: '10:04', isMine: false },
    ];
    setMessages(demoMessages);
  }, [meeting, isAr, phase, user]);

  /* ─── Send chat message ─── */
  const sendMessage = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: String(Date.now()),
      sender: user?.displayName ?? (isAr ? 'أنت' : 'You'),
      avatar: (user?.displayName ?? 'U').charAt(0),
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
    };
    setMessages((prev) => [...prev, msg]);
    setChatInput('');
  }, [chatInput, user, isAr, i18n.language]);

  /* ─── Send emoji reaction ─── */
  const sendReaction = useCallback((emoji: string) => {
    const newEmoji = { id: Date.now(), emoji, x: 20 + Math.random() * 60 };
    setFloatingEmojis((prev) => [...prev, newEmoji]);
    setTimeout(() => setFloatingEmojis((prev) => prev.filter((e) => e.id !== newEmoji.id)), 3000);
  }, []);

  /* ─── Fullscreen toggle ─── */
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  }, []);

  /* ─── Leave meeting ─── */
  const leaveMeeting = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (agendaTimerRef.current) clearInterval(agendaTimerRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    navigate('/meetings');
  }, [navigate]);

  /* ─── Join from lobby ─── */
  const joinMeeting = useCallback(() => {
    setMicOn(lobbyMic);
    setCameraOn(lobbyCam);
    setPhase('live');
  }, [lobbyMic, lobbyCam]);

  /* ─── Build embedded meeting URL ─── */
  const embedUrl = useMemo(() => {
    if (!meeting?.onlineJoinUrl) return null;
    return meeting.onlineJoinUrl;
  }, [meeting]);

  const dateFmt = new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });

  /* ─── Computed ─── */
  const totalAgendaDuration = useMemo(
    () => meeting?.agenda.reduce((sum, a) => sum + (a.duration ?? 0), 0) ?? 0,
    [meeting],
  );
  const currentAgendaItem = meeting?.agenda[currentAgendaIdx];
  const agendaProgress = meeting?.agenda.length ? ((currentAgendaIdx + 1) / meeting.agenda.length) * 100 : 0;

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-brand-900/30 border-t-brand-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <IconVideo className="h-6 w-6 text-brand-400" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-white">{t('liveMeeting.joining')}</p>
            <p className="mt-1 text-sm text-neutral-500">{t('liveMeeting.preparingRoom')}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── NOT FOUND ───
  if (!meeting) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-6 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="rounded-2xl bg-neutral-800/50 p-6">
          <IconMeetings className="h-16 w-16 text-neutral-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">{t('liveMeeting.notFound')}</p>
          <p className="mt-1 text-sm text-neutral-500">{t('liveMeeting.notFoundDesc')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/meetings')} className="border-neutral-700 text-neutral-300 hover:bg-neutral-800">{t('liveMeeting.backToMeetings')}</Button>
      </div>
    );
  }

  const isOnline = meeting.type === 'online' || meeting.type === 'hybrid';
  const title = isAr ? meeting.titleAr : meeting.titleEn;
  const committeeName = meeting.committeeNameAr && meeting.committeeNameEn
    ? (isAr ? meeting.committeeNameAr : meeting.committeeNameEn) : null;
  const allParticipants = [
    { displayName: user?.displayName ?? (isAr ? 'أنت' : 'You'), email: '', role: 'self' },
    ...meeting.invitees,
  ];

  // ═══════════════════════════════════════════════
  // ─── LOBBY / PRE-JOIN SCREEN ───
  // ═══════════════════════════════════════════════
  if (phase === 'lobby') {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-neutral-950 via-[#0a0a1a] to-neutral-950 p-4">
        {/* Background decorative orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -start-32 h-96 w-96 rounded-full bg-brand-600/10 blur-[120px]" />
          <div className="absolute -bottom-32 -end-32 h-96 w-96 rounded-full bg-purple-600/10 blur-[120px]" />
        </div>

        <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:gap-12">
          {/* Video preview */}
          <div className="flex-1">
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl shadow-black/50 ring-1 ring-white/5">
              {lobbyCam ? (
                <div className="flex h-full items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                  <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[0]} text-5xl font-bold text-white shadow-xl`}>
                    {(user?.displayName ?? 'U').charAt(0)}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 bg-neutral-900">
                  <IconVideoOff className="h-12 w-12 text-neutral-600" />
                  <p className="text-sm text-neutral-500">{t('liveMeeting.cameraOff')}</p>
                </div>
              )}

              {/* Preview controls */}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
                <button
                  onClick={() => setLobbyMic(!lobbyMic)}
                  className={`rounded-full p-3 backdrop-blur-sm transition-all ${lobbyMic ? 'bg-neutral-0/10 text-white hover:bg-neutral-0/20' : 'bg-red-500/90 text-white hover:bg-red-500'}`}
                >
                  {lobbyMic ? <IconMicrophone className="h-5 w-5" /> : <IconMicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setLobbyCam(!lobbyCam)}
                  className={`rounded-full p-3 backdrop-blur-sm transition-all ${lobbyCam ? 'bg-neutral-0/10 text-white hover:bg-neutral-0/20' : 'bg-red-500/90 text-white hover:bg-red-500'}`}
                >
                  {lobbyCam ? <IconVideo className="h-5 w-5" /> : <IconVideoOff className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Meeting info + join */}
          <div className="flex w-full flex-col items-center gap-6 lg:w-80 lg:items-start">
            <div className="text-center lg:text-start">
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {committeeName && (
                <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-neutral-400 lg:justify-start">
                  <IconCommittees className="h-4 w-4" />{committeeName}
                </p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                {dateFmt.format(new Date(meeting.startDateTimeUtc))}
              </p>
            </div>

            {/* Participants avatars */}
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">{t('liveMeeting.inThisMeeting')}</p>
              <div className="flex -space-x-2 rtl:space-x-reverse">
                {allParticipants.slice(0, 6).map((p, i) => (
                  <div
                    key={i}
                    className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} text-xs font-bold text-white ring-2 ring-neutral-950`}
                    title={p.displayName}
                  >
                    {p.displayName.charAt(0)}
                  </div>
                ))}
                {allParticipants.length > 6 && (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800 text-xs font-bold text-neutral-300 ring-2 ring-neutral-950">
                    +{allParticipants.length - 6}
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-xs text-neutral-500">
                {allParticipants.length} {t('liveMeeting.participants').toLowerCase()}
              </p>
            </div>

            {/* Join button */}
            <button
              onClick={joinMeeting}
              className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-600/25 transition-all hover:shadow-xl hover:shadow-brand-600/30"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <IconVideo className="h-5 w-5" />
                {t('liveMeeting.joinNow')}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-400 opacity-0 transition-opacity group-hover:opacity-100" />
            </button>

            <button
              onClick={() => navigate('/meetings')}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
            >
              {t('liveMeeting.backToMeetings')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // ─── LIVE MEETING SCREEN ───
  // ═══════════════════════════════════════════════
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-[#0a0a12]">
      {/* ═══ Top Bar - glassmorphism ═══ */}
      <div className="relative z-20 flex items-center justify-between border-b border-white/5 bg-black/40 px-4 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={leaveMeeting}
            className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-0/10 hover:text-white"
          >
            <IconArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-white">{title}</h1>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {committeeName && (
                <span className="flex items-center gap-1"><IconCommittees className="h-3 w-3" />{committeeName}</span>
              )}
              {meeting.location && (
                <span className="flex items-center gap-1"><IconMapPin className="h-3 w-3" />{meeting.location}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live timer pill */}
          <div className="flex items-center gap-2 rounded-full bg-neutral-0/5 px-3.5 py-1.5 ring-1 ring-white/10">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-500 shadow-sm shadow-green-500/50" />
            <span className="font-mono text-sm font-semibold tabular-nums text-green-400">{formatTimer(elapsed)}</span>
          </div>

          {/* Recording badge */}
          {recording && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 ring-1 ring-red-500/20">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-400">{t('liveMeeting.recording')}</span>
            </div>
          )}

          {/* Participants count */}
          <button
            onClick={() => setSidebar(sidebar === 'participants' ? 'none' : 'participants')}
            className="flex items-center gap-1.5 rounded-full bg-neutral-0/5 px-3 py-1.5 text-sm text-neutral-300 ring-1 ring-white/10 transition-all hover:bg-neutral-0/10"
          >
            <IconUser className="h-3.5 w-3.5" />
            <span className="font-medium">{allParticipants.length}</span>
          </button>

          {/* Agenda progress mini */}
          {meeting.agenda.length > 0 && (
            <div className="flex items-center gap-2 rounded-full bg-neutral-0/5 px-3 py-1.5 ring-1 ring-white/10">
              <IconSidebar className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-xs font-medium text-neutral-300">{currentAgendaIdx + 1}/{meeting.agenda.length}</span>
              <div className="h-1 w-12 overflow-hidden rounded-full bg-neutral-0/10">
                <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${agendaProgress}%` }} />
              </div>
            </div>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-2 text-neutral-400 transition-all hover:bg-neutral-0/10 hover:text-white"
          >
            {fullscreen ? <IconMinimize className="h-4 w-4" /> : <IconMaximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* ═══ Main Content ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ─── Video / Meeting Area ─── */}
        <div className="relative flex flex-1 flex-col">
          {/* Video container */}
          <div className="relative flex-1 overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0d0d1a] via-[#0a0a12] to-[#0d0d1a]" />

            {isOnline && embedUrl ? (
              <iframe
                ref={iframeRef}
                src={embedUrl}
                className="relative z-10 h-full w-full border-0"
                allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
                title={t('liveMeeting.meetingFrame')}
              />
            ) : (
              /* Participant video grid */
              <div className="relative z-10 flex h-full items-center justify-center p-4 sm:p-6">
                <div className={`grid w-full max-w-5xl gap-3 ${
                  allParticipants.length <= 2 ? 'grid-cols-1 sm:grid-cols-2' :
                  allParticipants.length <= 4 ? 'grid-cols-2' :
                  allParticipants.length <= 6 ? 'grid-cols-2 sm:grid-cols-3' :
                  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                }`}>
                  {allParticipants.map((p, idx) => {
                    const isSelf = idx === 0;
                    const isSpeaking = speakingIdx === idx;
                    const colorGrad = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                    return (
                      <div
                        key={idx}
                        className={`group relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-2xl transition-all duration-300 ${
                          isSpeaking
                            ? 'ring-2 ring-brand-500 shadow-lg shadow-brand-500/20'
                            : 'ring-1 ring-white/5'
                        } ${isSelf ? 'bg-gradient-to-br from-neutral-800/80 to-neutral-900/80' : 'bg-neutral-900/60'}`}
                      >
                        {/* Animated speaking border */}
                        {isSpeaking && (
                          <div className="absolute inset-0 rounded-2xl">
                            <div className="absolute inset-0 animate-pulse rounded-2xl bg-brand-500/5" />
                          </div>
                        )}

                        {/* Avatar */}
                        <div className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${colorGrad} text-2xl font-bold text-white shadow-lg sm:h-20 sm:w-20 sm:text-3xl`}>
                          {p.displayName.charAt(0)}
                          {/* Speaking wave animation */}
                          {isSpeaking && (
                            <>
                              <div className="absolute inset-0 animate-ping rounded-full bg-neutral-0/10" style={{ animationDuration: '1.5s' }} />
                              <div className="absolute -inset-1 animate-ping rounded-full bg-neutral-0/5" style={{ animationDuration: '2s' }} />
                            </>
                          )}
                        </div>

                        {/* Name & role */}
                        <p className="mt-2 max-w-[90%] truncate text-sm font-medium text-white">{p.displayName}</p>
                        {!isSelf && p.role && (
                          <span className="mt-0.5 rounded-full bg-neutral-0/5 px-2 py-0.5 text-[10px] text-neutral-400">
                            {p.role === 'chair' ? (isAr ? 'رئيس' : 'Chair') : p.role === 'secretary' ? (isAr ? 'أمين' : 'Secretary') : (isAr ? 'عضو' : 'Member')}
                          </span>
                        )}
                        {isSelf && <span className="mt-0.5 text-[10px] text-brand-400">{isAr ? 'أنت' : 'You'}</span>}

                        {/* Status icons */}
                        <div className="absolute bottom-2 start-2 flex gap-1">
                          {(isSelf ? micOn : true) ? (
                            <div className={`rounded-full p-1 ${isSpeaking ? 'bg-green-500/20' : 'bg-black/40'}`}>
                              <IconMicrophone className={`h-3 w-3 ${isSpeaking ? 'text-green-400' : 'text-neutral-400'}`} />
                            </div>
                          ) : (
                            <div className="rounded-full bg-red-500/20 p-1">
                              <IconMicOff className="h-3 w-3 text-red-400" />
                            </div>
                          )}
                        </div>

                        {/* Hand raised */}
                        {isSelf && handRaised && (
                          <div className="absolute top-2 end-2 animate-bounce rounded-full bg-amber-500 p-1.5 shadow-lg">
                            <IconHandRaised className="h-3.5 w-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current agenda item overlay */}
            {currentAgendaItem && (
              <div className="absolute bottom-4 start-4 z-20 max-w-sm rounded-xl bg-black/60 p-3 backdrop-blur-md ring-1 ring-white/10">
                <div className="flex items-start gap-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                    {currentAgendaIdx + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{isAr ? currentAgendaItem.titleAr : currentAgendaItem.titleEn}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-400">
                      {currentAgendaItem.presenterName && (
                        <span className="flex items-center gap-1"><IconUser className="h-3 w-3" />{currentAgendaItem.presenterName}</span>
                      )}
                      {currentAgendaItem.duration && (
                        <span className={`flex items-center gap-1 ${agendaItemElapsed > (currentAgendaItem.duration ?? 0) * 60 ? 'text-red-400' : ''}`}>
                          <IconClock className="h-3 w-3" />
                          {formatTimer(agendaItemElapsed)} / {currentAgendaItem.duration}{t('liveMeeting.min')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Screen sharing indicator */}
            {screenSharing && (
              <div className="absolute top-4 start-1/2 z-20 -translate-x-1/2 rounded-full bg-green-500/90 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
                <IconScreenShare className="me-1.5 inline-block h-4 w-4" />
                {t('liveMeeting.sharingScreen')}
              </div>
            )}

            {/* Floating emoji reactions */}
            {floatingEmojis.map((e) => (
              <div
                key={e.id}
                className="pointer-events-none absolute bottom-20 z-30 animate-bounce text-3xl"
                style={{ left: `${e.x}%`, animation: 'floatUp 3s ease-out forwards' }}
              >
                {e.emoji}
              </div>
            ))}
          </div>

          {/* ─── Bottom Controls Bar - glassmorphism ─── */}
          <div className="relative z-20 flex items-center justify-center gap-1.5 border-t border-white/5 bg-black/40 px-4 py-3 backdrop-blur-xl sm:gap-2.5">
            {/* Mic */}
            <button
              onClick={() => setMicOn(!micOn)}
              className={`group relative rounded-full p-3.5 transition-all ${
                micOn ? 'bg-neutral-0/10 text-white hover:bg-neutral-0/15' : 'bg-red-500 text-white hover:bg-red-400'
              }`}
              title={micOn ? t('liveMeeting.muteMic') : t('liveMeeting.unmuteMic')}
            >
              {micOn ? <IconMicrophone className="h-5 w-5" /> : <IconMicOff className="h-5 w-5" />}
              <span className="absolute -bottom-6 start-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-neutral-800 px-2 py-0.5 text-[10px] text-neutral-300 opacity-0 transition-opacity group-hover:opacity-100">
                {micOn ? t('liveMeeting.muteMic') : t('liveMeeting.unmuteMic')}
              </span>
            </button>

            {/* Camera */}
            <button
              onClick={() => setCameraOn(!cameraOn)}
              className={`group relative rounded-full p-3.5 transition-all ${
                cameraOn ? 'bg-neutral-0/10 text-white hover:bg-neutral-0/15' : 'bg-red-500 text-white hover:bg-red-400'
              }`}
              title={cameraOn ? t('liveMeeting.cameraOff') : t('liveMeeting.cameraOn')}
            >
              {cameraOn ? <IconVideo className="h-5 w-5" /> : <IconVideoOff className="h-5 w-5" />}
            </button>

            {/* Screen Share */}
            <button
              onClick={() => setScreenSharing(!screenSharing)}
              className={`group relative rounded-full p-3.5 transition-all ${
                screenSharing ? 'bg-brand-500 text-white hover:bg-brand-400' : 'bg-neutral-0/10 text-white hover:bg-neutral-0/15'
              }`}
            >
              <IconScreenShare className="h-5 w-5" />
            </button>

            {/* Hand Raise */}
            <button
              onClick={() => setHandRaised(!handRaised)}
              className={`group relative rounded-full p-3.5 transition-all ${
                handRaised ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-neutral-0/10 text-white hover:bg-neutral-0/15'
              }`}
            >
              <IconHandRaised className="h-5 w-5" />
            </button>

            {/* Record */}
            <button
              onClick={() => setRecording(!recording)}
              className={`group relative rounded-full p-3.5 transition-all ${
                recording ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-neutral-0/10 text-white hover:bg-neutral-0/15'
              }`}
            >
              <IconRecord className="h-5 w-5" />
            </button>

            {/* Reactions */}
            <div className="mx-1 h-8 w-px bg-neutral-0/10" />
            <div className="flex gap-1">
              {['👍', '👏', '❤️', '😂'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="rounded-full bg-neutral-0/5 p-2 text-lg transition-all hover:scale-110 hover:bg-neutral-0/10 active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <div className="mx-1 h-8 w-px bg-neutral-0/10" />

            {/* Chat */}
            <button
              onClick={() => { setSidebar(sidebar === 'chat' ? 'none' : 'chat'); setUnreadCount(0); }}
              className={`relative rounded-full p-3.5 transition-all ${
                sidebar === 'chat' ? 'bg-brand-500 text-white' : 'bg-neutral-0/10 text-white hover:bg-neutral-0/15'
              }`}
            >
              <IconChat className="h-5 w-5" />
              {unreadCount > 0 && sidebar !== 'chat' && (
                <span className="absolute -top-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0a0a12]">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Agenda */}
            <button
              onClick={() => setSidebar(sidebar === 'agenda' ? 'none' : 'agenda')}
              className={`rounded-full p-3.5 transition-all ${
                sidebar === 'agenda' ? 'bg-brand-500 text-white' : 'bg-neutral-0/10 text-white hover:bg-neutral-0/15'
              }`}
            >
              <IconSidebar className="h-5 w-5" />
            </button>

            <div className="mx-1 h-8 w-px bg-neutral-0/10" />

            {/* Leave */}
            <button
              onClick={leaveMeeting}
              className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-red-600/20 transition-all hover:bg-red-500 hover:shadow-xl hover:shadow-red-600/30"
            >
              <IconPhone className="h-5 w-5 rotate-[135deg]" />
              <span className="hidden sm:inline">{t('liveMeeting.leave')}</span>
            </button>
          </div>
        </div>

        {/* ═══ Sidebar ═══ */}
        {sidebar !== 'none' && (
          <div className="flex w-80 flex-col border-s border-white/5 bg-[#0e0e1a]/95 backdrop-blur-xl xl:w-96">
            {/* Sidebar header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
                {sidebar === 'participants' && <><IconUser className="h-4 w-4 text-brand-400" />{t('liveMeeting.participants')} <span className="text-neutral-500">({allParticipants.length})</span></>}
                {sidebar === 'chat' && <><IconChat className="h-4 w-4 text-brand-400" />{t('liveMeeting.chat')}</>}
                {sidebar === 'agenda' && <><IconSidebar className="h-4 w-4 text-brand-400" />{t('liveMeeting.agenda')}</>}
              </h2>
              <button
                onClick={() => setSidebar('none')}
                className="rounded-lg p-1.5 text-neutral-500 transition-all hover:bg-neutral-0/5 hover:text-white"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex flex-1 flex-col overflow-y-auto">
              {/* ── Participants ── */}
              {sidebar === 'participants' && (
                <div className="space-y-0.5 p-3">
                  {allParticipants.map((p, idx) => {
                    const isSelf = idx === 0;
                    const isSpeaking = speakingIdx === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                          isSpeaking ? 'bg-brand-500/10 ring-1 ring-brand-500/20' : 'hover:bg-neutral-0/5'
                        }`}
                      >
                        <div className="relative">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-sm font-bold text-white`}>
                            {p.displayName.charAt(0)}
                          </div>
                          {/* Online indicator */}
                          <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-[#0e0e1a]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-white">{p.displayName}</p>
                            {isSelf && <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-400">{isAr ? 'أنت' : 'YOU'}</span>}
                          </div>
                          <p className="text-xs text-neutral-500">
                            {isSelf ? (isAr ? 'المضيف' : 'Host') :
                              p.role === 'chair' ? (isAr ? 'رئيس اللجنة' : 'Committee Chair') :
                              p.role === 'secretary' ? (isAr ? 'أمين اللجنة' : 'Secretary') :
                              (isAr ? 'عضو' : 'Member')}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isSpeaking && (
                            <div className="flex items-center gap-0.5">
                              <div className="h-2.5 w-0.5 animate-pulse rounded-full bg-green-400" style={{ animationDelay: '0ms' }} />
                              <div className="h-3.5 w-0.5 animate-pulse rounded-full bg-green-400" style={{ animationDelay: '150ms' }} />
                              <div className="h-2 w-0.5 animate-pulse rounded-full bg-green-400" style={{ animationDelay: '300ms' }} />
                            </div>
                          )}
                          {(isSelf ? micOn : true)
                            ? <IconMicrophone className="h-3.5 w-3.5 text-neutral-500" />
                            : <IconMicOff className="h-3.5 w-3.5 text-red-400" />
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Chat ── */}
              {sidebar === 'chat' && (
                <div className="flex flex-1 flex-col">
                  <div className="flex-1 space-y-3 overflow-y-auto p-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-2.5 ${msg.isMine ? 'flex-row-reverse' : ''}`}>
                        {!msg.isMine && (
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${AVATAR_COLORS[messages.indexOf(msg) % AVATAR_COLORS.length]} text-[10px] font-bold text-white`}>
                            {msg.avatar}
                          </div>
                        )}
                        <div className={`max-w-[80%] ${msg.isMine ? 'items-end' : 'items-start'}`}>
                          {!msg.isMine && (
                            <p className="mb-0.5 text-[11px] font-medium text-neutral-500">{msg.sender}</p>
                          )}
                          <div
                            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                              msg.isMine
                                ? 'rounded-ee-md bg-brand-600 text-white'
                                : 'rounded-es-md bg-neutral-0/5 text-neutral-200 ring-1 ring-white/5'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <div className={`mt-0.5 flex items-center gap-2 ${msg.isMine ? 'justify-end' : ''}`}>
                            <span className="text-[10px] text-neutral-600">{msg.time}</span>
                            {msg.reactions && msg.reactions.length > 0 && (
                              <span className="rounded-full bg-neutral-0/5 px-1.5 py-0.5 text-xs">{msg.reactions.join('')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat input */}
                  <div className="border-t border-white/5 p-3">
                    <div className="flex items-center gap-2 rounded-xl bg-neutral-0/5 px-3 py-1 ring-1 ring-white/5 focus-within:ring-brand-500/50">
                      <button className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition-colors hover:text-neutral-300">
                        <IconPaperclip className="h-4 w-4" />
                      </button>
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                        placeholder={t('liveMeeting.typeMessage')}
                        className="flex-1 bg-transparent py-2 text-sm text-white placeholder-neutral-600 outline-none"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!chatInput.trim()}
                        className="shrink-0 rounded-lg bg-brand-600 p-2 text-white transition-all hover:bg-brand-500 disabled:opacity-30"
                      >
                        <IconSend className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Agenda ── */}
              {sidebar === 'agenda' && (
                <div className="flex flex-1 flex-col">
                  {/* Progress bar */}
                  {meeting.agenda.length > 0 && (
                    <div className="border-b border-white/5 px-4 py-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">{t('liveMeeting.agendaProgress')}</span>
                        <span className="font-semibold text-brand-400">{Math.round(agendaProgress)}%</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-0/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700" style={{ width: `${agendaProgress}%` }} />
                      </div>
                      <p className="mt-1.5 text-xs text-neutral-600">
                        {t('liveMeeting.totalDuration')}: {totalAgendaDuration} {t('liveMeeting.min')}
                      </p>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 overflow-y-auto p-3">
                    {meeting.agenda.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <IconSidebar className="h-10 w-10 text-neutral-700" />
                        <p className="mt-3 text-sm text-neutral-600">{t('liveMeeting.noAgenda')}</p>
                      </div>
                    ) : (
                      meeting.agenda.map((item, idx) => {
                        const isActive = idx === currentAgendaIdx;
                        const isDone = idx < currentAgendaIdx;
                        return (
                          <button
                            key={idx}
                            onClick={() => { setCurrentAgendaIdx(idx); setAgendaItemElapsed(0); }}
                            className={`w-full rounded-xl p-3 text-start transition-all ${
                              isActive
                                ? 'bg-brand-500/10 ring-1 ring-brand-500/30'
                                : isDone
                                  ? 'bg-green-500/5 ring-1 ring-green-500/10'
                                  : 'bg-neutral-0/[0.02] ring-1 ring-white/5 hover:bg-neutral-0/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                                isActive ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' :
                                isDone ? 'bg-green-500 text-white' :
                                'bg-neutral-0/10 text-neutral-500'
                              }`}>
                                {isDone ? <IconCheck className="h-3.5 w-3.5" /> : idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-sm font-medium ${isActive ? 'text-brand-300' : isDone ? 'text-green-400' : 'text-neutral-300'}`}>
                                  {isAr ? item.titleAr : item.titleEn}
                                </p>
                                {(item.descriptionAr || item.descriptionEn) && (
                                  <p className="mt-0.5 text-xs text-neutral-600">{isAr ? item.descriptionAr : item.descriptionEn}</p>
                                )}
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                                  {item.presenterName && (
                                    <span className="flex items-center gap-1 rounded-full bg-neutral-0/5 px-2 py-0.5 text-neutral-400">
                                      <IconUser className="h-3 w-3" />{item.presenterName}
                                    </span>
                                  )}
                                  {item.duration && (
                                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 ${
                                      isActive && agendaItemElapsed > item.duration * 60
                                        ? 'bg-red-500/10 text-red-400'
                                        : 'bg-neutral-0/5 text-neutral-500'
                                    }`}>
                                      <IconClock className="h-3 w-3" />
                                      {isActive ? `${formatTimer(agendaItemElapsed)} / ` : ''}{item.duration} {t('liveMeeting.min')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Navigation */}
                  {meeting.agenda.length > 0 && (
                    <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
                      <button
                        disabled={currentAgendaIdx === 0}
                        onClick={() => { setCurrentAgendaIdx((p) => Math.max(0, p - 1)); setAgendaItemElapsed(0); }}
                        className="rounded-lg bg-neutral-0/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-neutral-0/10 hover:text-white disabled:opacity-30"
                      >
                        {t('liveMeeting.prevItem')}
                      </button>
                      <span className="rounded-full bg-neutral-0/5 px-3 py-1 text-xs font-semibold text-neutral-400">
                        {currentAgendaIdx + 1} / {meeting.agenda.length}
                      </span>
                      <button
                        disabled={currentAgendaIdx >= meeting.agenda.length - 1}
                        onClick={() => { setCurrentAgendaIdx((p) => Math.min(meeting.agenda.length - 1, p + 1)); setAgendaItemElapsed(0); }}
                        className="rounded-lg bg-neutral-0/5 px-3 py-1.5 text-xs font-medium text-neutral-400 transition-all hover:bg-neutral-0/10 hover:text-white disabled:opacity-30"
                      >
                        {t('liveMeeting.nextItem')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CSS for floating emoji animation */}
      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
