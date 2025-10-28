import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Sparkles,
  Brain,
  Zap,
  CheckCircle2,
  Circle,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Target,
  ListTodo,
  TrendingUp,
  X,
  Download,
  BarChart3,
  Loader2,
  MessageSquare,
  RefreshCw,
  Lightbulb,
  Users,
  Edit2,
  Link2,
  FileText,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';
import { supabase, SUPABASE_CONFIGURED } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Analytics from './Analytics';
import { PlanningChat } from './PlanningChat';
import { AgentSelector } from './AgentSelector';
import { KnowledgePanel } from './KnowledgePanel';
import { SubtaskTree } from './SubtaskTree';
import { TeamCollaboration } from './TeamCollaboration';
import { PerformanceInsights } from './PerformanceInsights';
import { TaskEditor } from './TaskEditor';
import { aiContextManager } from '@/lib/aiContext';
import { ParticleBackground } from './ParticleBackground';
import ReportModal from './ReportModal';
import SettingsModal from './SettingsModal';

// Types
export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'executing' | 'completed';
  priority: number;
  createdAt: number;
  completedAt?: number;
  result?: string;
  category?: string;
  estimatedTime?: string;
  parentId?: string;
  depth?: number;
  subtasks?: Task[];
  dependencies?: string[];
  hasSubtasks?: boolean;
  subtaskCount?: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  status: 'active' | 'paused' | 'completed';
  createdAt: number;
  aiInsights?: string;
}

interface Store {
  objectives: Objective[];
  currentObjective: Objective | null;
  isProcessing: boolean;
  addObjective: (title: string, description: string) => void;
  setCurrentObjective: (id: string) => void;
  deleteObjective: (id: string) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resetObjective: (id: string) => void;
  completeTask: (taskId: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
}

// Zustand Store
const useStore = create<Store>()(
  persist(
    (set, get) => ({
      objectives: [],
      currentObjective: null,
      isProcessing: false,

      addObjective: (title, description) => {
        const newObjective: Objective = {
          id: Date.now().toString(),
          title,
          description,
          tasks: [],
          status: 'active',
          createdAt: Date.now(),
        };
        set((state) => ({
          objectives: [newObjective, ...state.objectives],
          currentObjective: newObjective,
        }));
      },

      setCurrentObjective: (id) => {
        const obj = get().objectives.find((o) => o.id === id);
        if (obj) set({ currentObjective: obj });
      },

      deleteObjective: (id) => {
        set((state) => ({
          objectives: state.objectives.filter((o) => o.id !== id),
          currentObjective: state.currentObjective?.id === id ? null : state.currentObjective,
        }));
      },

      startProcessing: () => set({ isProcessing: true }),
      pauseProcessing: () => set({ isProcessing: false }),

      resetObjective: (id) => {
        set((state) => ({
          objectives: state.objectives.map((obj) =>
            obj.id === id ? { ...obj, tasks: [], status: 'active' as const } : obj,
          ),
          currentObjective:
            state.currentObjective?.id === id
              ? { ...state.currentObjective, tasks: [], status: 'active' as const }
              : state.currentObjective,
        }));
      },

      completeTask: (taskId) => {
        set((state) => {
          if (!state.currentObjective) return state;

          const updatedTasks = state.currentObjective.tasks.map((task) =>
            task.id === taskId ? { ...task, status: 'completed' as const, c