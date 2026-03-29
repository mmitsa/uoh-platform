import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import { useApi, isDemoMode } from '../../hooks/useApi';
import type { WidgetDef, WidgetPlacement, DashboardStats } from './types';
import {
  DEMO_AVAILABLE_WIDGETS,
  DEMO_DEFAULT_LAYOUT,
} from '../demoData';

/* ---------- state ---------- */

interface DashboardState {
  widgets: WidgetPlacement[];
  availableWidgets: WidgetDef[];
  stats: DashboardStats | null;
  isEditMode: boolean;
  isLibraryOpen: boolean;
  isDirty: boolean;
  isLoading: boolean;
  committeeFilter: string | null;
}

const initialState: DashboardState = {
  widgets: [],
  availableWidgets: [],
  stats: null,
  isEditMode: false,
  isLibraryOpen: false,
  isDirty: false,
  isLoading: true,
  committeeFilter: null,
};

/* ---------- actions ---------- */

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: { widgets: WidgetPlacement[]; availableWidgets: WidgetDef[]; stats: DashboardStats } }
  | { type: 'SET_WIDGETS'; payload: WidgetPlacement[] }
  | { type: 'ADD_WIDGET'; payload: WidgetPlacement }
  | { type: 'REMOVE_WIDGET'; payload: string }
  | { type: 'REORDER_WIDGETS'; payload: WidgetPlacement[] }
  | { type: 'UPDATE_WIDGET_CONFIG'; payload: { id: string; config: Record<string, unknown> } }
  | { type: 'TOGGLE_EDIT_MODE' }
  | { type: 'TOGGLE_LIBRARY' }
  | { type: 'MARK_SAVED' }
  | { type: 'MARK_DIRTY' }
  | { type: 'SET_COMMITTEE_FILTER'; payload: string | null }
  | { type: 'SET_STATS'; payload: DashboardStats };

function reducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_DATA':
      return {
        ...state,
        widgets: action.payload.widgets,
        availableWidgets: action.payload.availableWidgets,
        stats: action.payload.stats,
        isLoading: false,
      };
    case 'SET_WIDGETS':
      return { ...state, widgets: action.payload, isDirty: false };
    case 'ADD_WIDGET':
      return { ...state, widgets: [...state.widgets, action.payload], isDirty: true };
    case 'REMOVE_WIDGET':
      return { ...state, widgets: state.widgets.filter(w => w.id !== action.payload), isDirty: true };
    case 'REORDER_WIDGETS':
      return { ...state, widgets: action.payload, isDirty: true };
    case 'UPDATE_WIDGET_CONFIG':
      return {
        ...state,
        widgets: state.widgets.map(w =>
          w.id === action.payload.id ? { ...w, config: action.payload.config } : w,
        ),
        isDirty: true,
      };
    case 'TOGGLE_EDIT_MODE':
      return { ...state, isEditMode: !state.isEditMode, isLibraryOpen: state.isEditMode ? false : state.isLibraryOpen };
    case 'TOGGLE_LIBRARY':
      return { ...state, isLibraryOpen: !state.isLibraryOpen };
    case 'MARK_SAVED':
      return { ...state, isDirty: false };
    case 'MARK_DIRTY':
      return { ...state, isDirty: true };
    case 'SET_COMMITTEE_FILTER':
      return { ...state, committeeFilter: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

/* ---------- context ---------- */

interface DashboardContextValue extends DashboardState {
  dispatch: React.Dispatch<Action>;
  addWidget: (widgetKey: string) => void;
  removeWidget: (id: string) => void;
  updateWidgetConfig: (id: string, config: Record<string, unknown>) => void;
  toggleEditMode: () => void;
  toggleLibrary: () => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
  refetchStats: () => Promise<void>;
  setCommitteeFilter: (committeeId: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
  return ctx;
}

/* ---------- provider ---------- */

const DEMO_LAYOUT_KEY = 'uoh_dashboard_layout';

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const api = useApi();
  const demo = isDemoMode();

  // Load initial data
  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      if (demo) {
        const stats = (await api.get<DashboardStats>('/api/v1/dashboard/stats'));
        const savedLayout = localStorage.getItem(DEMO_LAYOUT_KEY);
        const widgets: WidgetPlacement[] = savedLayout
          ? JSON.parse(savedLayout)
          : DEMO_DEFAULT_LAYOUT;

        dispatch({
          type: 'SET_DATA',
          payload: { widgets, availableWidgets: DEMO_AVAILABLE_WIDGETS, stats },
        });
      } else {
        const [stats, widgetDefs, layoutRes] = await Promise.all([
          api.get<DashboardStats>('/api/v1/dashboard/stats'),
          api.get<WidgetDef[]>('/api/v1/dashboard/widgets'),
          api.get<{ widgetsJson: string }>('/api/v1/dashboard/layout'),
        ]);
        const widgets: WidgetPlacement[] = JSON.parse(layoutRes.widgetsJson || '[]');
        dispatch({ type: 'SET_DATA', payload: { widgets, availableWidgets: widgetDefs, stats } });
      }
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

  const addWidget = useCallback((widgetKey: string) => {
    const def = state.availableWidgets.find(w => w.key === widgetKey);
    if (!def) return;
    const id = `${widgetKey}-${Date.now()}`;
    const maxY = state.widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    dispatch({
      type: 'ADD_WIDGET',
      payload: { id, widgetKey, x: 0, y: maxY, w: def.defaultWidth, h: def.defaultHeight },
    });
  }, [state.availableWidgets, state.widgets]);

  const removeWidget = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_WIDGET', payload: id });
  }, []);

  const updateWidgetConfig = useCallback((id: string, config: Record<string, unknown>) => {
    dispatch({ type: 'UPDATE_WIDGET_CONFIG', payload: { id, config } });
  }, []);

  const toggleEditMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_EDIT_MODE' });
  }, []);

  const toggleLibrary = useCallback(() => {
    dispatch({ type: 'TOGGLE_LIBRARY' });
  }, []);

  const saveLayout = useCallback(async () => {
    if (demo) {
      localStorage.setItem(DEMO_LAYOUT_KEY, JSON.stringify(state.widgets));
    } else {
      await api.put('/api/v1/dashboard/layout', { widgetsJson: JSON.stringify(state.widgets) });
    }
    dispatch({ type: 'MARK_SAVED' });
  }, [demo, state.widgets, api]);

  const resetLayout = useCallback(async () => {
    if (demo) {
      localStorage.removeItem(DEMO_LAYOUT_KEY);
    } else {
      await api.post('/api/v1/dashboard/layout/reset');
    }
    await loadData();
  }, [demo, api]);

  const refetchStats = useCallback(async () => {
    try {
      const filterParam = state.committeeFilter ? `?committeeId=${state.committeeFilter}` : '';
      const stats = await api.get<DashboardStats>(`/api/v1/dashboard/stats${filterParam}`);
      dispatch({ type: 'SET_STATS', payload: stats });
    } catch { /* ignore */ }
  }, [api, state.committeeFilter]);

  const setCommitteeFilter = useCallback((committeeId: string | null) => {
    dispatch({ type: 'SET_COMMITTEE_FILTER', payload: committeeId });
  }, []);

  // Refetch stats when committee filter changes
  useEffect(() => {
    if (!state.isLoading) {
      void refetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.committeeFilter]);

  return (
    <DashboardContext.Provider value={{
      ...state,
      dispatch,
      addWidget,
      removeWidget,
      updateWidgetConfig,
      toggleEditMode,
      toggleLibrary,
      saveLayout,
      resetLayout,
      refetchStats,
      setCommitteeFilter,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
