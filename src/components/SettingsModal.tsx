import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, KeyRound, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const FREE_MODELS = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", label: "Llama 3.1 8B Instruct (free)" },
  { id: "google/gemma-7b-it:free", label: "Gemma 7B IT (free)" },
  { id: "anthropic/claude-3-haiku:free", label: "Claude 3 Haiku (free)" },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(FREE_MODELS[0].id);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem("openrouter_api_key") || "";
      const savedModel = localStorage.getItem("openrouter_model") || FREE_MODELS[0].id;
      setApiKey(savedKey);
      setModel(savedModel);
    } catch {
      // ignore
    }
  }, [isOpen]);

  const saveSettings = () => {
    try {
      localStorage.setItem("openrouter_api_key", apiKey.trim());
      localStorage.setItem("openrouter_model", model);
      toast.success("OpenRouter settings saved");
      onClose();
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-card backdrop-blur-xl rounded-2xl border border-white/10 p-6 z-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                OpenRouter Settings
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">API Key</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                    <KeyRound className="w-4 h-4 opacity-70" />
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-or-..."
                      className="w-full bg-transparent outline-none text-sm"
                    />
                  </div>
                  <Button variant="outline" onClick={() => {
                    navigator.clipboard.writeText(apiKey).then(() => toast.info("API key copied"));
                  }}>
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Get a free API key at openrouter.ai. Your key is stored locally in your browser.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {FREE_MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={saveSettings} className="flex-1 bg-gradient-to-r from-primary to-accent">Save</Button>
                <Button variant="outline" onClick={onClose}>Cancel</Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;