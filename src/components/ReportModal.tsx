import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download } from "lucide-react";
import { Objective } from "@/components/BabyAGI";
import { buildObjectiveReport } from "@/lib/report";
import { Button } from "@/components/ui/button";

interface ReportModalProps {
  objective: Objective | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ objective, isOpen, onClose }) => {
  if (!objective) return null;

  const markdown = buildObjectiveReport(objective);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = objective.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    a.href = url;
    a.download = `objective-report-${safeTitle}-${objective.id}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl bg-card backdrop-blur-xl rounded-2xl border border-white/10 p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Objective Report
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">{objective.title}</div>
                <div className="text-xs text-muted-foreground">Report is auto-generated in Markdown</div>
              </div>
              <Button onClick={handleDownload} className="inline-flex items-center gap-2">
                <Download className="w-4 h-4" /> Download .md
              </Button>
            </div>

            <div className="bg-white/5 rounded-lg border border-white/10 p-4 max-h-[50vh] overflow-auto font-mono text-sm whitespace-pre-wrap">
              {markdown}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;