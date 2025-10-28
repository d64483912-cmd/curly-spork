import { Task, Objective } from '@/components/BabyAGI';

export interface AIContext {
  recentTasks: Task[];
  completedObjectives: Objective[];
  insights: string[];
  learnings: Map<string, string>;
}

class AIContextManager {
  private context: AIContext = {
    recentTasks: [],
    completedObjectives: [],
    insights: [],
    learnings: new Map(),
  };

  private readonly MAX_RECENT_TASKS = 20;
  private readonly MAX_INSIGHTS = 10;

  /**
   * Add a completed task to recent history
   */
  addCompletedTask(task: Task) {
    this.context.recentTasks.unshift(task);
    if (this.context.recentTasks.length > this.MAX_RECENT_TASKS) {
      this.context.recentTasks.pop();
    }
    this.saveToStorage();
  }

  /**
   * Add a completed objective with its tasks
   */
  addCompletedObjective(objective: Objective) {
    this.context.completedObjectives.unshift(objective);
    if (this.context.completedObjectives.length > 5) {
      this.context.completedObjectives.pop();
    }
    this.saveToStorage();
  }

  /**
   * Add an AI-generated insight
   */
  addInsight(insight: string) {
    if (!this.context.insights.includes(insight)) {
      this.context.insights.unshift(insight);
      if (this.context.insights.length > this.MAX_INSIGHTS) {
        this.context.insights.pop();
      }
      this.saveToStorage();
    }
  }

  /**
   * Store a key learning
   */
  addLearning(key: string, value: string) {
    this.context.learnings.set(key, value);
    this.saveToStorage();
  }

  /**
   * Get context relevant to a new objective
   */
  getRelevantContext(objective: string): string {
    const parts: string[] = [];

    // Add recent successful patterns
    if (this.context.completedObjectives.length > 0) {
      parts.push('Recent successful patterns:');
      this.context.completedObjectives.slice(0, 3).forEach((obj, i) => {
        const completionRate = (obj.tasks.filter(t => t.status === 'completed').length / obj.tasks.length) * 100;
        parts.push(`${i + 1}. "${obj.title}" - ${completionRate.toFixed(0)}% completion, ${obj.tasks.length} tasks`);
      });
    }

    // Add relevant insights
    if (this.context.insights.length > 0) {
      parts.push('\nKey insights:');
      this.context.insights.slice(0, 5).forEach((insight, i) => {
        parts.push(`${i + 1}. ${insight}`);
      });
    }

    // Add task category patterns
    const categoryStats = this.getTaskCategoryStats();
    if (categoryStats.size > 0) {
      parts.push('\nCommon task categories:');
      const topCategories = Array.from(categoryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      topCategories.forEach(([category, count]) => {
        parts.push(`- ${category}: ${count} tasks`);
      });
    }

    return parts.join('\n');
  }

  /**
   * Get statistics about task categories
   */
  private getTaskCategoryStats(): Map<string, number> {
    const stats = new Map<string, number>();
    this.context.recentTasks.forEach(task => {
      if (task.category) {
        stats.set(task.category, (stats.get(task.category) || 0) + 1);
      }
    });
    return stats;
  }

  /**
   * Get average task completion time by category
   */
  getAverageTimeByCategory(): Map<string, number> {
    const timeByCategory = new Map<string, { total: number; count: number }>();
    
    this.context.recentTasks.forEach(task => {
      if (task.category && task.completedAt && task.createdAt) {
        const duration = task.completedAt - task.createdAt;
        const current = timeByCategory.get(task.category) || { total: 0, count: 0 };
        timeByCategory.set(task.category, {
          total: current.total + duration,
          count: current.count + 1,
        });
      }
    });

    const averages = new Map<string, number>();
    timeByCategory.forEach((value, key) => {
      averages.set(key, value.total / value.count);
    });

    return averages;
  }

  /**
   * Suggest task priority based on historical data
   */
  suggestPriority(taskTitle: string, category?: string): number {
    // Default priority
    let suggestedPriority = 3;

    // Check if similar tasks exist and use their priority
    const similarTasks = this.context.recentTasks.filter(task => {
      const similarity = this.calculateSimilarity(taskTitle.toLowerCase(), task.title.toLowerCase());
      return similarity > 0.5 || (category && task.category === category);
    });

    if (similarTasks.length > 0) {
      const avgPriority = similarTasks.reduce((sum, task) => sum + task.priority, 0) / similarTasks.length;
      suggestedPriority = Math.round(avgPriority);
    }

    return Math.max(1, Math.min(5, suggestedPriority));
  }

  /**
   * Simple similarity calculation (Jaccard similarity)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Get context for task generation
   */
  getTaskGenerationContext(objective: string, description: string): string {
    const relevantContext = this.getRelevantContext(objective);
    const categoryTimes = this.getAverageTimeByCategory();

    let context = `Historical Context:\n${relevantContext}\n\n`;

    if (categoryTimes.size > 0) {
      context += 'Average completion times:\n';
      categoryTimes.forEach((time, category) => {
        const minutes = Math.round(time / 60000);
        context += `- ${category}: ~${minutes} minutes\n`;
      });
    }

    return context;
  }

  /**
   * Save context to localStorage
   */
  private saveToStorage() {
    try {
      const serialized = {
        recentTasks: this.context.recentTasks,
        completedObjectives: this.context.completedObjectives,
        insights: this.context.insights,
        learnings: Array.from(this.context.learnings.entries()),
      };
      localStorage.setItem('ai-context', JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save AI context:', error);
    }
  }

  /**
   * Load context from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('ai-context');
      if (stored) {
        const data = JSON.parse(stored);
        this.context = {
          recentTasks: data.recentTasks || [],
          completedObjectives: data.completedObjectives || [],
          insights: data.insights || [],
          learnings: new Map(data.learnings || []),
        };
      }
    } catch (error) {
      console.error('Failed to load AI context:', error);
    }
  }

  /**
   * Clear all context
   */
  clear() {
    this.context = {
      recentTasks: [],
      completedObjectives: [],
      insights: [],
      learnings: new Map(),
    };
    localStorage.removeItem('ai-context');
  }

  /**
   * Get the full context
   */
  getContext(): AIContext {
    return this.context;
  }
}

// Singleton instance
export const aiContextManager = new AIContextManager();

// Load context on initialization
if (typeof window !== 'undefined') {
  aiContextManager.loadFromStorage();
}
