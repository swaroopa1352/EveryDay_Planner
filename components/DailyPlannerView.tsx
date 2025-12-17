'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, X, Star, FileText, Bell, Trash2, LogOut, Calendar } from 'lucide-react';
import { TodoItem, ReminderItem } from '@/lib/types';

interface DailyPlannerViewProps {
  date: string;
  onBack: () => void;
  onLogout: () => void;
}

export default function DailyPlannerView({ date, onBack, onLogout }: DailyPlannerViewProps) {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [mustDos, setMustDos] = useState<TodoItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<TodoItem | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isViewState, setIsViewState] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{taskId: number, type: string} | null>(null);
  const [moveToDate, setMoveToDate] = useState('');
  const [showReminderTimePicker, setShowReminderTimePicker] = useState<number | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  // Convert date to YYYY-MM-DD format
  const formatDateForStorage = (dateStr: string) => {
    const [monthStr, dayStr, yearStr] = dateStr.split(/[\s,]+/);
    const monthMap: { [key: string]: string } = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
    };
    const month = monthMap[monthStr];
    const day = dayStr.padStart(2, '0');
    return `${yearStr}-${month}-${day}`;
  };

  const storageDate = formatDateForStorage(date);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // NOTE: Reminder checking is now handled globally in PlannerApp component
  // This ensures reminders trigger on ANY page, not just the planner where they were created

  useEffect(() => {
    setHasSaved(false);
    loadPlan();
  }, [date]);

  const loadPlan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/plans?date=${storageDate}`);
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.plan) {
          const plan = data.plan;
          const hasData = 
            (Array.isArray(plan.todos) && plan.todos.some((t: TodoItem) => t.text.trim())) ||
            (Array.isArray(plan.mustDos) && plan.mustDos.some((m: TodoItem) => m.text.trim())) ||
            (Array.isArray(plan.reminders) && plan.reminders.some((r: ReminderItem) => r.text.trim()));

          if (hasData) {
            setTodos(plan.todos || []);
            setMustDos(plan.mustDos || []);
            // Ensure all reminders have notified field set to false
            const remindersWithNotified = (plan.reminders || []).map((r: ReminderItem) => ({
              ...r,
              notified: false // Always reset notified to false when loading
            }));
            setReminders(remindersWithNotified);
            setIsViewState(true);
          } else {
            initializeEmptyState();
          }
        } else {
          initializeEmptyState();
        }
      } else {
        initializeEmptyState();
      }
    } catch (error) {
      console.log('No saved plan found, initializing empty state');
      initializeEmptyState();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeEmptyState = () => {
    setTodos([{ id: 1, text: '', completed: false }]);
    setMustDos([{ id: 1, text: '', completed: false }]);
    setReminders([{ id: 1, text: '' }]);
    setIsViewState(false);
  };

  const addItem = (list: TodoItem[], setList: React.Dispatch<React.SetStateAction<TodoItem[]>>) => {
    const newId = Math.max(...list.map(item => item.id), 0) + 1;
    setList([...list, { id: newId, text: '', completed: false }]);
    setIsDirty(true);
  };

  const addReminder = () => {
    const newId = Math.max(...reminders.map(item => item.id), 0) + 1;
    setReminders([...reminders, { id: newId, text: '', reminderDate: '', reminderTime: '', notified: false }]);
    setIsDirty(true);
  };

  const updateItem = (id: number, text: string, list: TodoItem[], setList: React.Dispatch<React.SetStateAction<TodoItem[]>>) => {
    setList(list.map(item => item.id === id ? { ...item, text } : item));
    setIsDirty(true);
  };

  const updateReminder = (id: number, field: string, value: string) => {
    setReminders(reminders.map(item => item.id === id ? { ...item, [field]: value } : item));
    setIsDirty(true);
  };

  const toggleComplete = (id: number, list: TodoItem[], setList: React.Dispatch<React.SetStateAction<TodoItem[]>>) => {
    setList(list.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
    setIsDirty(true);
  };

  const removeItem = (id: number, list: TodoItem[], setList: React.Dispatch<React.SetStateAction<TodoItem[]>>) => {
    if (list.length > 1) {
      setList(list.filter(item => item.id !== id));
      setIsDirty(true);
    } else {
      setList([{ ...list[0], text: '', completed: false }]);
      setIsDirty(true);
    }
  };

  const removeReminder = (id: number) => {
    setReminders(reminders.filter(item => item.id !== id));
    setIsDirty(true);
  };

  const handleDragStart = (item: TodoItem, from: string) => {
    setDraggedItem(item);
    setDraggedFrom(from);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (to: string) => {
    if (!draggedItem || draggedFrom === to) return;

    if (draggedFrom === 'todo') {
      setTodos(todos.filter(item => item.id !== draggedItem.id));
    } else if (draggedFrom === 'mustdo') {
      setMustDos(mustDos.filter(item => item.id !== draggedItem.id));
    }

    if (to === 'todo') {
      setTodos([...todos, { ...draggedItem, id: Math.max(...todos.map(t => t.id), 0) + 1 }]);
    } else if (to === 'mustdo') {
      setMustDos([...mustDos, { ...draggedItem, id: Math.max(...mustDos.map(m => m.id), 0) + 1 }]);
    }

    setDraggedItem(null);
    setDraggedFrom(null);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: storageDate,
          todos: todos.filter(t => t.text.trim()),
          mustDos: mustDos.filter(m => m.text.trim()),
          reminders: reminders.filter(r => r.text.trim()),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save plan');
      }

      setIsDirty(false);
      setHasSaved(true);
      setIsViewState(true);
      console.log('Plan saved successfully');
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save plan. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsTemplate = () => {
    const template = {
      todos: todos.filter(t => t.text.trim()).map(t => ({ ...t, completed: false })),
      mustDos: mustDos.filter(m => m.text.trim()).map(m => ({ ...m, completed: false }))
    };
    localStorage.setItem('dailyTaskTemplate', JSON.stringify(template));
    setShowTemplateDialog(false);
    alert('✅ Template saved! You can now load these tasks on any day.');
  };

  const loadTemplate = () => {
    const templateStr = localStorage.getItem('dailyTaskTemplate');
    if (!templateStr) {
      alert('No template found. Save a template first!');
      return;
    }
    
    const template = JSON.parse(templateStr);
    
    // Add template tasks to existing tasks with new IDs
    const maxTodoId = Math.max(...todos.map(t => t.id), 0);
    const maxMustDoId = Math.max(...mustDos.map(m => m.id), 0);
    
    const newTodos = template.todos.map((t: TodoItem, index: number) => ({
      ...t,
      id: maxTodoId + index + 1,
      completed: false
    }));
    
    const newMustDos = template.mustDos.map((m: TodoItem, index: number) => ({
      ...m,
      id: maxMustDoId + index + 1,
      completed: false
    }));
    
    setTodos([...todos, ...newTodos]);
    setMustDos([...mustDos, ...newMustDos]);
    setIsDirty(true);
    setShowTemplateDialog(false);
    alert('✅ Template loaded!');
  };

  const handleBackClick = () => {
    if (isDirty) {
      setShowExitDialog(true);
    } else {
      onBack();
    }
  };

  const handleSaveAndExit = async () => {
    await handleSave();
    setShowExitDialog(false);
    onBack();
  };

  const handleDiscardChanges = () => {
    setShowExitDialog(false);
    onBack();
  };

  const handleMoveTask = async (taskId: number, taskType: string) => {
    if (!moveToDate) return;
    
    try {
      // Get the task to move
      let taskToMove: TodoItem | null = null;
      if (taskType === 'todo') {
        taskToMove = todos.find(t => t.id === taskId) || null;
      } else if (taskType === 'mustDo') {
        taskToMove = mustDos.find(t => t.id === taskId) || null;
      }
      
      if (!taskToMove || taskToMove.completed) return;
      
      // Load the target date's plan
      const res = await fetch(`/api/plans?date=${moveToDate}`);
      let targetPlan = { todos: [], mustDos: [], reminders: [] };
      
      if (res.ok) {
        const data = await res.json();
        if (data.plan) {
          targetPlan = data.plan;
        }
      }
      
      // Add task to target date
      if (taskType === 'todo') {
        targetPlan.todos = [...(targetPlan.todos || []), { ...taskToMove, completed: false }];
      } else if (taskType === 'mustDo') {
        targetPlan.mustDos = [...(targetPlan.mustDos || []), { ...taskToMove, completed: false }];
      }
      
      // Save to target date
      await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: moveToDate,
          todos: targetPlan.todos,
          mustDos: targetPlan.mustDos,
          reminders: targetPlan.reminders,
        }),
      });
      
      // Remove from current date
      if (taskType === 'todo') {
        setTodos(todos.filter(t => t.id !== taskId));
      } else if (taskType === 'mustDo') {
        setMustDos(mustDos.filter(t => t.id !== taskId));
      }
      
      setIsDirty(true);
      setShowDatePicker(null);
      setMoveToDate('');
      
      // Auto-save current plan
      await handleSave();
    } catch (error) {
      console.error('Failed to move task:', error);
      alert('Failed to move task. Please try again.');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
            <p className="text-gray-600 mt-4 text-center">Loading your plan...</p>
          </div>
        </div>
      )}

      {/* Move Task Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Move Task to Another Date</h3>
            <p className="text-gray-600 mb-6">Select a date to reschedule this task</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date:</label>
                <input
                  type="date"
                  value={moveToDate}
                  onChange={(e) => setMoveToDate(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleMoveTask(showDatePicker.taskId, showDatePicker.type)}
                  disabled={!moveToDate}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  Move Task
                </button>
                <button
                  onClick={() => {
                    setShowDatePicker(null);
                    setMoveToDate('');
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Task Templates</h2>
            <p className="text-gray-600 mb-6">
              Save your current To-Do and Must-Do tasks as a template to reuse on other days.
            </p>
            <div className="space-y-3">
              <button
                onClick={saveAsTemplate}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                💾 Save Current Tasks as Template
              </button>
              <button
                onClick={loadTemplate}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                📥 Load Template into Today
              </button>
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Task Templates</h2>
            <p className="text-gray-600 mb-6">
              Save your current To-Do and Must-Do tasks as a template to reuse on other days.
            </p>
            <div className="space-y-3">
              <button
                onClick={saveAsTemplate}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                💾 Save Current Tasks as Template
              </button>
              <button
                onClick={loadTemplate}
                className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition"
              >
                📥 Load Template into Today
              </button>
              <button
                onClick={() => setShowTemplateDialog(false)}
                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog */}
      {showExitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Unsaved Changes</h3>
            <p className="text-gray-600 mb-6">
              You have unsaved changes to your plan. What would you like to do?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSaveAndExit}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
              >
                Save & Exit
              </button>
              <button
                onClick={handleDiscardChanges}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Discard Changes
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Stay on Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={handleBackClick} 
            className="text-indigo-600 hover:text-indigo-800 transition p-2 hover:bg-white rounded-lg"
          >
            <ChevronLeft size={28} />
          </button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-800">Plan Your Day</h1>
            <p className="text-xl text-indigo-600 font-semibold mt-1">{date}</p>
            {isViewState && (
              <p className="text-sm text-gray-500 mt-1">Previously saved plan</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateDialog(true)}
              className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition p-2 rounded-lg flex items-center gap-2 font-semibold border border-indigo-300"
              title="Task Templates"
            >
              <Star size={20} />
              <span className="hidden sm:inline">Templates</span>
            </button>
            <button
              onClick={onLogout}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 transition p-2 rounded-lg flex items-center gap-2 font-semibold"
              title="Logout"
            >
              <LogOut size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Three Column Dashboard */}
      <div className="max-w-7xl mx-auto grid grid-cols-3 gap-6 mb-8">
        
        {/* To-Do Column */}
        <div 
          className="bg-blue-50 rounded-2xl shadow-lg p-6 flex flex-col h-[400px]"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('todo')}
        >
          <div className="flex items-center gap-3 mb-6">
            <FileText className="text-blue-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">To-Do</h2>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {todos.map((todo) => (
              <div
                key={todo.id}
                draggable
                onDragStart={() => handleDragStart(todo, 'todo')}
                onMouseEnter={() => setHoveredTask(`todo-${todo.id}`)}
                onMouseLeave={() => setHoveredTask(null)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-move relative"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleComplete(todo.id, todos, setTodos)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => updateItem(todo.id, e.target.value, todos, setTodos)}
                    placeholder="Enter task..."
                    className={`flex-1 px-2 py-1 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none bg-transparent ${
                      todo.completed ? 'line-through text-gray-400' : ''
                    }`}
                  />
                  <div className="flex gap-1 items-center w-[50px] justify-end flex-shrink-0">
                    <button
                      onClick={() => setShowDatePicker({taskId: todo.id, type: 'todo'})}
                      className={`text-blue-400 hover:text-blue-600 transition ${
                        !todo.completed && todo.text.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      title="Move to another date"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => removeItem(todo.id, todos, setTodos)}
                      className={`text-gray-400 hover:text-red-500 transition ${
                        hoveredTask === `todo-${todo.id}` || todos.length === 1 ? 'opacity-100' : 'opacity-0'
                      }`}
                      title={todos.length === 1 ? "Clear text" : "Delete task"}
                    >
                      {todos.length === 1 ? <X size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(todos, setTodos)}
            className="w-full mt-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Task
          </button>
        </div>

        {/* Must Do Column */}
        <div 
          className="bg-orange-50 rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 flex flex-col h-[400px]"
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('mustdo')}
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="text-orange-600 fill-orange-600" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Must Do</h2>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {mustDos.map((mustDo) => (
              <div
                key={mustDo.id}
                draggable
                onDragStart={() => handleDragStart(mustDo, 'mustdo')}
                onMouseEnter={() => setHoveredTask(`mustdo-${mustDo.id}`)}
                onMouseLeave={() => setHoveredTask(null)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-move relative"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={mustDo.completed}
                    onChange={() => toggleComplete(mustDo.id, mustDos, setMustDos)}
                    className="mt-1 w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={mustDo.text}
                    onChange={(e) => updateItem(mustDo.id, e.target.value, mustDos, setMustDos)}
                    placeholder="Critical task..."
                    className={`flex-1 px-2 py-1 border-b-2 border-gray-200 focus:border-orange-500 focus:outline-none bg-transparent ${
                      mustDo.completed ? 'line-through text-gray-400' : ''
                    }`}
                  />
                  <div className="flex gap-1 items-center w-[50px] justify-end flex-shrink-0">
                    <button
                      onClick={() => setShowDatePicker({taskId: mustDo.id, type: 'mustDo'})}
                      className={`text-orange-400 hover:text-orange-600 transition ${
                        !mustDo.completed && mustDo.text.trim() ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                      title="Move to another date"
                    >
                      <Calendar size={18} />
                    </button>
                    <button
                      onClick={() => removeItem(mustDo.id, mustDos, setMustDos)}
                      className={`text-gray-400 hover:text-red-500 transition ${
                        hoveredTask === `mustdo-${mustDo.id}` || mustDos.length === 1 ? 'opacity-100' : 'opacity-0'
                      }`}
                      title={mustDos.length === 1 ? "Clear text" : "Delete task"}
                    >
                      {mustDos.length === 1 ? <X size={18} /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => addItem(mustDos, setMustDos)}
            className="w-full mt-4 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Task
          </button>
        </div>

        {/* Reminders Column */}
        <div className="bg-gray-100 rounded-2xl shadow-lg p-6 flex flex-col h-[400px]">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="text-gray-700" size={24} />
            <h2 className="text-2xl font-bold text-gray-800">Reminders</h2>
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                onMouseEnter={() => setHoveredTask(`reminder-${reminder.id}`)}
                onMouseLeave={() => setHoveredTask(null)}
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition relative"
              >
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="text"
                      value={reminder.text}
                      onChange={(e) => updateReminder(reminder.id, 'text', e.target.value)}
                      placeholder="Add reminder or note..."
                      className="flex-1 px-2 py-1 border-b-2 border-gray-200 focus:border-gray-500 focus:outline-none bg-transparent"
                    />
                    {reminder.text.trim() && (
                      <button
                        onClick={() => setShowReminderTimePicker(showReminderTimePicker === reminder.id ? null : reminder.id)}
                        className="text-gray-500 hover:text-gray-700 transition flex-shrink-0"
                        title="Set reminder time"
                      >
                        <Bell size={18} />
                      </button>
                    )}
                    <div className="w-[24px] flex items-center justify-end flex-shrink-0">
                      <button
                        onClick={() => removeReminder(reminder.id)}
                        className={`text-gray-400 hover:text-red-500 transition ${
                          hoveredTask === `reminder-${reminder.id}` ? 'opacity-100' : 'opacity-0'
                        }`}
                        title="Delete reminder"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Time picker popup */}
                  {showReminderTimePicker === reminder.id && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Remind on</label>
                          <input
                            type="date"
                            value={reminder.reminderDate || ''}
                            onChange={(e) => updateReminder(reminder.id, 'reminderDate', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">At time</label>
                          <input
                            type="time"
                            value={reminder.reminderTime || ''}
                            onChange={(e) => updateReminder(reminder.id, 'reminderTime', e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setShowReminderTimePicker(null)}
                        className="w-full py-1.5 text-xs bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        Done
                      </button>
                    </div>
                  )}
                  
                  {/* Display scheduled reminder info - clickable to edit */}
                  {reminder.reminderDate && reminder.text.trim() && (
                    <button
                      onClick={() => setShowReminderTimePicker(reminder.id)}
                      className="pl-2 text-xs text-gray-600 flex items-center gap-1 hover:text-gray-800 transition"
                    >
                      <Bell size={12} />
                      <span>
                        {(() => {
                          const [year, month, day] = reminder.reminderDate.split('-').map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                        })()}
                        {reminder.reminderTime && ` at ${reminder.reminderTime}`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addReminder}
            className="w-full mt-4 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Add Reminder
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="max-w-7xl mx-auto">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-lg font-bold hover:bg-indigo-700 transition shadow-lg disabled:bg-gray-400"
        >
          {isSaving ? 'Saving...' : isDirty ? 'Save Plan' : hasSaved ? 'Plan Saved ✓' : 'Save Plan'}
        </button>
      </div>
    </div>
  );
}
