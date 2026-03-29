import { useState, useEffect, useCallback, useRef } from 'react';
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { isDemoMode } from './useApi';

export type LiveQuestion = {
  id: string;
  order: number;
  type: string;
  textAr: string;
  textEn: string;
  optionsJson: string | null;
};

export type LiveSessionState = {
  id: string;
  surveyId?: string;
  joinCode?: string;
  status: string;
  currentQuestionIndex: number;
  participantCount: number;
  acceptingVotes: boolean;
  questions?: LiveQuestion[];
  currentQuestion?: LiveQuestion | null;
};

type Tallies = Record<string, number>;

export interface UseLiveSurveyResult {
  state: LiveSessionState | null;
  tallies: Record<string, Tallies>;
  connected: boolean;
  error: string | null;
  nextQuestion: () => void;
  previousQuestion: () => void;
  toggleVoting: () => void;
  endSession: () => void;
  submitVote: (questionId: string, valueJson: string) => void;
  votedQuestions: Set<string>;
}

function getFingerprint(): string {
  let fp = sessionStorage.getItem('live_survey_fp');
  if (!fp) {
    fp = crypto.randomUUID();
    sessionStorage.setItem('live_survey_fp', fp);
  }
  return fp;
}

export function useLiveSurvey(
  mode: 'presenter' | 'participant',
  params: { sessionId?: string; presenterKey?: string; joinCode?: string },
): UseLiveSurveyResult {
  const [state, setState] = useState<LiveSessionState | null>(null);
  const [tallies, setTallies] = useState<Record<string, Tallies>>({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());
  const connRef = useRef<HubConnection | null>(null);
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Demo mode simulation
  const demoMode = isDemoMode();

  useEffect(() => {
    if (demoMode) {
      // Simulate a live session in demo mode
      const demoQuestions: LiveQuestion[] = [
        { id: 'q1', order: 1, type: 'Single', textAr: 'هل أنت راضٍ عن الخدمة؟', textEn: 'Are you satisfied with the service?', optionsJson: '["Yes","No","Neutral"]' },
        { id: 'q2', order: 2, type: 'Single', textAr: 'كيف تقيّم التجربة؟', textEn: 'How would you rate the experience?', optionsJson: '["Excellent","Good","Fair","Poor"]' },
      ];
      setState({
        id: params.sessionId ?? 'demo-session',
        surveyId: 'demo-survey',
        joinCode: 'ABC123',
        status: 'Active',
        currentQuestionIndex: 0,
        participantCount: 5,
        acceptingVotes: true,
        questions: demoQuestions,
        currentQuestion: demoQuestions[0],
      });
      setTallies({ q1: { Yes: 3, No: 1, Neutral: 1 }, q2: {} });
      setConnected(true);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) return;

    const conn = new HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/live-survey`)
      .withAutomaticReconnect([0, 1000, 2000, 5000, 10000])
      .configureLogging(LogLevel.Warning)
      .build();

    connRef.current = conn;

    // Event handlers
    conn.on('SessionState', (data: any) => {
      setState(data);
    });

    conn.on('QuestionChanged', (data: any) => {
      setState((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionIndex: data.currentQuestionIndex,
              acceptingVotes: data.acceptingVotes,
              status: data.status,
              currentQuestion: data.question,
            }
          : prev,
      );
      if (data.tallies && data.question?.id) {
        setTallies((prev) => ({ ...prev, [data.question.id]: data.tallies }));
      }
    });

    conn.on('VoteTallyUpdated', (data: { questionId: string; tallies: Tallies }) => {
      setTallies((prev) => ({ ...prev, [data.questionId]: data.tallies }));
    });

    conn.on('ParticipantCountChanged', (data: { count: number }) => {
      setState((prev) => (prev ? { ...prev, participantCount: data.count } : prev));
    });

    conn.on('VotingStateChanged', (data: { acceptingVotes: boolean }) => {
      setState((prev) => (prev ? { ...prev, acceptingVotes: data.acceptingVotes } : prev));
    });

    conn.on('SessionEnded', () => {
      setState((prev) => (prev ? { ...prev, status: 'Completed' } : prev));
    });

    conn.on('VoteRecorded', (data: { questionId: string }) => {
      setVotedQuestions((prev) => new Set(prev).add(data.questionId));
    });

    conn.on('Error', (msg: string) => {
      setError(msg);
    });

    conn.onclose(() => setConnected(false));
    conn.onreconnected(() => setConnected(true));

    conn
      .start()
      .then(async () => {
        setConnected(true);
        if (mode === 'presenter' && paramsRef.current.sessionId && paramsRef.current.presenterKey) {
          await conn.invoke('JoinAsPresenter', paramsRef.current.sessionId, paramsRef.current.presenterKey);
        } else if (mode === 'participant' && paramsRef.current.joinCode) {
          await conn.invoke('JoinAsParticipant', paramsRef.current.joinCode);
        }
      })
      .catch((err) => {
        console.warn('LiveSurveyHub connection failed:', err);
        setError('Connection failed');
      });

    return () => {
      conn.stop();
      connRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, params.sessionId, params.joinCode, demoMode]);

  const invoke = useCallback(
    async (method: string, ...args: any[]) => {
      const conn = connRef.current;
      if (!conn || conn.state !== HubConnectionState.Connected) return;
      try {
        await conn.invoke(method, ...args);
      } catch (err: any) {
        setError(err.message ?? 'Hub invoke failed');
      }
    },
    [],
  );

  const nextQuestion = useCallback(() => {
    if (demoMode) {
      setState((prev) => {
        if (!prev?.questions) return prev;
        const newIdx = Math.min(prev.currentQuestionIndex + 1, prev.questions.length - 1);
        return { ...prev, currentQuestionIndex: newIdx, currentQuestion: prev.questions[newIdx] };
      });
      return;
    }
    void invoke('NextQuestion', params.sessionId, params.presenterKey);
  }, [invoke, params.sessionId, params.presenterKey, demoMode]);

  const previousQuestion = useCallback(() => {
    if (demoMode) {
      setState((prev) => {
        if (!prev?.questions) return prev;
        const newIdx = Math.max(prev.currentQuestionIndex - 1, 0);
        return { ...prev, currentQuestionIndex: newIdx, currentQuestion: prev.questions[newIdx] };
      });
      return;
    }
    void invoke('PreviousQuestion', params.sessionId, params.presenterKey);
  }, [invoke, params.sessionId, params.presenterKey, demoMode]);

  const toggleVoting = useCallback(() => {
    if (demoMode) {
      setState((prev) => (prev ? { ...prev, acceptingVotes: !prev.acceptingVotes } : prev));
      return;
    }
    if (state) void invoke('SetVotingState', params.sessionId, params.presenterKey, !state.acceptingVotes);
  }, [invoke, params.sessionId, params.presenterKey, state, demoMode]);

  const endSession = useCallback(() => {
    if (demoMode) {
      setState((prev) => (prev ? { ...prev, status: 'Completed' } : prev));
      return;
    }
    void invoke('EndSession', params.sessionId, params.presenterKey);
  }, [invoke, params.sessionId, params.presenterKey, demoMode]);

  const submitVote = useCallback(
    (questionId: string, valueJson: string) => {
      if (demoMode) {
        setVotedQuestions((prev) => new Set(prev).add(questionId));
        const val = valueJson.replace(/"/g, '');
        setTallies((prev) => ({
          ...prev,
          [questionId]: { ...prev[questionId], [val]: (prev[questionId]?.[val] ?? 0) + 1 },
        }));
        return;
      }
      void invoke('SubmitVote', params.sessionId ?? state?.id, questionId, valueJson, getFingerprint());
    },
    [invoke, params.sessionId, state?.id, demoMode],
  );

  return { state, tallies, connected, error, nextQuestion, previousQuestion, toggleVoting, endSession, submitVote, votedQuestions };
}
