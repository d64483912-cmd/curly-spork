import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, ArrowUp, ArrowDown, Link2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Task } from './BabyAGI';

interface TaskEditorProps {
  task: Task;
  allTasks: Task[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskEditor = ({ task, allTasks, isOpen, onClose, onSave, onDelete }: TaskEditorProps) => {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState(task.priority.toString());
  const [category, setCategory] = useState(task.category || '');
  const [estimatedTime, setEstimatedTime] = useState(task.estimatedTime || '');
  const [dependencies, setDependencies] = useState<string[]>(task.dependencies || []);

  const handleSave = () => {
    onSave(task.id, {
      title,
      priority: parseInt(priority),
      category: category || undefined,
      estimatedTime: estimatedTime || undefined,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (onDelete && confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
      onClose();
    }
  };

  const toggleDependency = (depId: string) => {
    setDependencies(prev =>
      prev.includes(depId)
        ? prev.filter(id => id !== depId)
        : [...prev, depId]
    );
  };

  const availableTasks = allTasks.filter(t => t.id !== task.id && t.status !== 'completed');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-indigo-950/95 via-purple-900/95 to-pink-900/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            <Edit2 className="w-5 h-5 text-primary" />
            Edit Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground/80">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary/50"
              placeholder="Enter task title"
            />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-foreground/80">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">🔴 Critical (1)</SelectItem>
                  <SelectItem value="2">🟠 High (2)</SelectItem>
                  <SelectItem value="3">🟡 Medium (3)</SelectItem>
                  <SelectItem value="4">🟢 Low (4)</SelectItem>
                  <SelectItem value="5">⚪ Optional (5)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-foreground/80">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-primary/50"
                placeholder="e.g., Research"
              />
            </div>
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimatedTime" className="text-foreground/80">Estimated Time</Label>
            <Input
              id="estimatedTime"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-primary/50"
              placeholder="e.g., 2 hours, 30 min"
            />
          </div>

          {/* Dependencies */}
          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <Label className="text-foreground/80 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Dependencies
              </Label>
              <div className="bg-white/5 rounded-lg p-3 border border-white/10 max-h-40 overflow-y-auto space-y-2">
                {availableTasks.map(t => (
                  <motion.div
                    key={t.id}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                      dependencies.includes(t.id)
                        ? 'bg-primary/20 border border-primary/30'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => toggleDependency(t.id)}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      dependencies.includes(t.id) ? 'bg-primary border-primary' : 'border-white/30'
                    }`}>
                      {dependencies.includes(t.id) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-white rounded-full"
                        />
                      )}
                    </div>
                    <span className="text-sm text-foreground/80 flex-1">{t.title}</span>
                    <Badge variant="outline" className="text-xs">P{t.priority}</Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Delete Button */}
          {onDelete && (
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="w-full"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Task
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
