import { Objective, Task } from "@/components/BabyAGI";

/**
 * Build a comprehensive Markdown report for a completed objective.
 */
export function buildObjectiveReport(objective: Objective): string {
  const completed = objective.tasks.filter(t => t.status === "completed").length;
  const total = objective.tasks.length;
  const startedAt = new Date(objective.createdAt).toISOString();
  const finishedAt = objective.tasks.length
    ? new Date(Math.max(...objective.tasks.map(t => t.completedAt || t.createdAt))).toISOString()
    : startedAt;

  const lines: string[] = [];
  lines.push(`# Objective Report: ${objective.title}`);
  lines.push("");
  if (objective.description) {
    lines.push(`> ${objective.description}`);
    lines.push("");
  }
  lines.push(`- Status: ${objective.status}`);
  lines.push(`- Created: ${startedAt}`);
  lines.push(`- Completed: ${finishedAt}`);
  lines.push(`- Tasks: ${completed}/${total} completed`);
  lines.push("");

  if (objective.aiInsights) {
    lines.push("## AI Insights");
    lines.push(objective.aiInsights);
    lines.push("");
  }

  lines.push("## Summary");
  const categories = summarizeByCategory(objective.tasks);
  const avgDurations = averageDurationsByCategory(objective.tasks);
  lines.push(`- Categories present: ${Array.from(categories.keys()).length}`);
  if (categories.size > 0) {
    lines.push("");
    lines.push("| Category | Count | Avg Duration (min) |");
    lines.push("|---|---:|---:|");
    Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const minutes = avgDurations.get(cat) ?? 0;
        lines.push(`| ${cat} | ${count} | ${Math.round(minutes)} |`);
      });
    lines.push("");
  }

  lines.push("## Task Breakdown");
  lines.push("");
  lines.push("| # | Title | Status | Priority | Category | Est. Time | Created | Completed |");
  lines.push("|---:|---|---|---:|---|---|---|---|");
  objective.tasks
    .sort((a, b) => a.createdAt - b.createdAt)
    .forEach((t, i) => {
      const created = new Date(t.createdAt).toLocaleString();
      const completed = t.completedAt ? new Date(t.completedAt).toLocaleString() : "";
      lines.push(
        `| ${i + 1} | ${escapePipe(t.title)} | ${t.status} | ${t.priority} | ${t.category ?? ""} | ${t.estimatedTime ?? ""} | ${created} | ${completed} |`
      );
      if (t.subtasks && t.subtasks.length > 0) {
        t.subtasks.forEach((st, j) => {
          const sCreated = new Date(st.createdAt).toLocaleString();
          const sCompleted = st.completedAt ? new Date(st.completedAt).toLocaleString() : "";
          lines.push(
            `| ${i + 1}.${j + 1} | ${escapePipe(st.title)} | ${st.status} | ${st.priority} | ${st.category ?? ""} | ${st.estimatedTime ?? ""} | ${sCreated} | ${sCompleted} |`
          );
        });
      }
    });
  lines.push("");

  lines.push("## Learnings & Recommendations");
  lines.push("- Identify blocked tasks early and surface dependencies.");
  lines.push("- Use timed auto-evaluation to periodically reassess priorities.");
  lines.push("- Capture reflections to improve future planning and estimation.");
  lines.push("");

  return lines.join("\n");
}

function summarizeByCategory(tasks: Task[]): Map<string, number> {
  const map = new Map<string, number>();
  const all = flattenTasks(tasks);
  all.forEach(t => {
    if (t.category) map.set(t.category, (map.get(t.category) || 0) + 1);
  });
  return map;
}

function averageDurationsByCategory(tasks: Task[]): Map<string, number> {
  const totals = new Map<string, { sumMs: number; count: number }>();
  const all = flattenTasks(tasks);
  all.forEach(t => {
    if (!t.category) return;
    if (!(t.createdAt && t.completedAt)) return;
    const dur = t.completedAt - t.createdAt;
    const current = totals.get(t.category) || { sumMs: 0, count: 0 };
    totals.set(t.category, { sumMs: current.sumMs + dur, count: current.count + 1 });
  });
  const avg = new Map<string, number>();
  totals.forEach((v, k) => {
    avg.set(k, v.sumMs / v.count / 60000); // minutes
  });
  return avg;
}

function flattenTasks(tasks: Task[]): Task[] {
  const out: Task[] = [];
  const walk = (ts: Task[]) => {
    ts.forEach(t => {
      out.push(t);
      if (t.subtasks && t.subtasks.length) walk(t.subtasks);
    });
  };
  walk(tasks);
  return out;
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, "\\|");
}