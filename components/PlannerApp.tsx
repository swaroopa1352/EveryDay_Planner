'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Clock, ChevronLeft, Calendar, Plus, X, Star, FileText, Bell, Trash2, Eye, EyeOff, LogOut } from 'lucide-react';
import DailyPlannerView from './DailyPlannerView';
import { ReminderItem } from '@/lib/types';

export default function PlannerApp() {
  const [screen, setScreen] = useState('welcome_screen');
  const [userData, setUserData] = useState({
    name: '',
    gender: '',
    pin: '',
    confirmPin: '',
    dayStartTime: '',
    timeFormat: ''
  });
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [loginStep, setLoginStep] = useState<'name' | 'pin'>('name');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 2 + i);
  const months = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  // Check for existing session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Auto-submit PIN when 4-6 digits are entered
  useEffect(() => {
    if (loginStep === 'pin' && pinInput.length >= 4 && pinInput.length <= 6 && !isLoading) {
      handleLogin();
    }
  }, [pinInput, loginStep]);

  // Global reminder checker - runs even when not on daily planner page
  useEffect(() => {
    if (!currentUser) return; // Only check reminders when logged in

    const checkAllReminders = async () => {
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      console.log('🌍 GLOBAL REMINDER CHECK at:', currentDate, currentTime);
      console.log('👤 Current user:', currentUser?.name);

      try {
        // Generate array of dates to check (past 7 days + today + next 30 days)
        // This ensures we catch reminders created on previous days' planners
        const datesToCheck: string[] = [];
        for (let i = -7; i <= 30; i++) {
          const checkDate = new Date();
          checkDate.setDate(checkDate.getDate() + i);
          datesToCheck.push(checkDate.toISOString().split('T')[0]);
        }

        console.log(`📅 Checking ${datesToCheck.length} dates for reminders (${datesToCheck[0]} to ${datesToCheck[datesToCheck.length - 1]})...`);

        // Fetch all plans in parallel
        const fetchPromises = datesToCheck.map(date => 
          fetch(`/api/plans?date=${date}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );

        const results = await Promise.all(fetchPromises);
        
        // Collect all reminders from all dates
        let allReminders: Array<{reminder: ReminderItem, planDate: string, plan: any}> = [];
        results.forEach((data, index) => {
          if (data && data.plan && data.plan.reminders) {
            data.plan.reminders.forEach((reminder: ReminderItem) => {
              allReminders.push({
                reminder,
                planDate: datesToCheck[index],
                plan: data.plan
              });
            });
          }
        });

        console.log(`📋 Found ${allReminders.length} total reminders across all dates`);

        // Check each reminder
        allReminders.forEach(({ reminder, planDate, plan }) => {
          // Check localStorage to avoid duplicate notifications
          const notifiedKey = `notified_${reminder.reminderDate}_${reminder.reminderTime}_${reminder.id}`;
          
          console.log(`Checking reminder "${reminder.text}" - Date: ${reminder.reminderDate}, Time: ${reminder.reminderTime}, Current: ${currentDate} ${currentTime}`);
          
          if (
            reminder.reminderDate &&
            reminder.reminderTime &&
            reminder.reminderDate === currentDate &&
            reminder.reminderTime === currentTime &&
            !reminder.notified &&
            !localStorage.getItem(notifiedKey) &&
            reminder.text.trim()
          ) {
            console.log('🔔 GLOBAL REMINDER TRIGGERED:', reminder.text);

            // Play notification sound - Pleasant bell chime
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.6;
              audio.play().catch(err => console.error('Audio play failed:', err));
            } catch (err) {
              console.error('Audio creation failed:', err);
            }

            // Show alert
            setTimeout(() => {
              alert(`⏰ REMINDER!\n\n${reminder.text}\n\nScheduled for: ${reminder.reminderTime}`);
            }, 100);

            // Show browser notification if available
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('⏰ Reminder', {
                body: reminder.text,
                icon: '/favicon.ico',
                tag: `reminder-${reminder.id}`,
                requireInteraction: true
              });
            }

            // Mark as notified in localStorage
            localStorage.setItem(notifiedKey, 'true');

            // Update the reminder in database (on the plan where it was originally saved)
            fetch(`/api/plans?date=${planDate}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...plan,
                reminders: plan.reminders.map((r: ReminderItem) => 
                  r.id === reminder.id ? { ...r, notified: true } : r
                )
              })
            }).catch(err => console.error('Failed to update reminder:', err));
          }
        });
      } catch (error) {
        console.error('Failed to check reminders:', error);
      }
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check immediately and then every 10 seconds
    checkAllReminders();
    const interval = setInterval(checkAllReminders, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setUserData(prev => ({
          ...prev,
          name: data.user.name,
          gender: data.user.gender,
          dayStartTime: data.user.dayStartTime,
          timeFormat: data.user.timeFormat
        }));
        setScreen('login');
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setCurrentUser(null);
      setUserData({
        name: '',
        gender: '',
        pin: '',
        confirmPin: '',
        dayStartTime: '',
        timeFormat: ''
      });
      setPinInput('');
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDate(null);
      setLoginStep('name');
      setScreen('welcome_screen');
      // Show logout toast
      setToastMessage('You have been logged out successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setUserData({ ...userData, [field]: value });
    setError('');
  };

  const validatePin = () => {
    if (userData.pin.length < 4 || userData.pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return false;
    }
    if (!/^\d+$/.test(userData.pin)) {
      setError('PIN must contain only numbers');
      return false;
    }
    return true;
  };

  const handleNameSubmit = async () => {
    if (!userData.name.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setError('');
    
    // Check if user exists by attempting to verify the name
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          pin: '0000', // Dummy PIN just to check if user exists
        }),
      });

      const data = await res.json();
      
      // If user not found
      if (res.status === 404 || data.error?.includes('not found')) {
        setError('User not found. Check your name or sign up as a New User.');
        setIsLoading(false);
        return;
      }
      
      // User exists, move to PIN entry
      setLoginStep('pin');
      setError('');
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!userData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!userData.gender) {
      setError('Please select your gender');
      return;
    }
    if (!validatePin()) return;
    if (userData.pin !== userData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    // Register user immediately
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          gender: userData.gender,
          pin: userData.pin,
          dayStartTime: userData.dayStartTime || '09:00',
          timeFormat: userData.timeFormat || '12h',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      // Set current user and redirect to current month calendar
      setCurrentUser(data.user);
      const now = new Date();
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth());
      setScreen('calendarView');
      setError('');
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      userData.name.trim() &&
      userData.gender &&
      userData.pin.length >= 4 &&
      userData.pin.length <= 6 &&
      userData.pin === userData.confirmPin &&
      /^\d+$/.test(userData.pin)
    );
  };

  const handleLogin = async () => {
    if (!pinInput || pinInput.length < 4) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          pin: pinInput,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid PIN. Please try again.');
        setPinInput('');
        setIsLoading(false);
        return;
      }

      setCurrentUser(data.user);
      setScreen('welcomeBack');
      setPinInput('');
      setError('');
      setLoginStep('name'); // Reset for next login
      setTimeout(() => {
        const now = new Date();
        setSelectedYear(now.getFullYear());
        setSelectedMonth(now.getMonth());
        setScreen('calendarView');
      }, 2000);
    } catch (error) {
      setError('Login failed. Please try again.');
      setPinInput('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferences = async () => {
    if (!userData.dayStartTime || !userData.timeFormat) {
      setError('Please complete all preferences');
      return;
    }

    // Now register the user with all data
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userData.name,
          gender: userData.gender,
          pin: userData.pin,
          dayStartTime: userData.dayStartTime,
          timeFormat: userData.timeFormat,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setIsLoading(false);
        return;
      }

      setCurrentUser(data.user);
      setScreen('login');
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setScreen('monthSelection');
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setScreen('calendarView');
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handleDateSelect = (day: number) => {
    setSelectedDate(day);
    setScreen('dailyPlanner');
  };

  const renderCalendar = () => {
    if (selectedYear === null || selectedMonth === null) return null;
    
    const today = new Date();
    const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth();
    const currentDay = today.getDate();
    
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = isCurrentMonth && day === currentDay;
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-12 rounded-lg transition flex items-center justify-center font-medium ${
            isToday
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-200'
              : 'hover:bg-indigo-100 text-gray-700 hover:text-indigo-700'
          }`}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {screen !== 'dailyPlanner' && (
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          
          {/* Sign-In Choice Screen - Initial Entry */}
          {screen === 'welcome_screen' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-3">Welcome to Every Day Planner</h1>
                <p className="text-gray-600 text-lg">Plan your days, achieve your goals</p>
              </div>

              <div className="space-y-4 pt-4">
                <button
                  onClick={() => setScreen('registration')}
                  className="w-full bg-indigo-600 text-white py-5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  I&apos;m a New User <ArrowRight size={24} />
                </button>
                
                <button
                  onClick={() => setScreen('login')}
                  className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-5 rounded-xl font-bold text-lg hover:bg-indigo-50 transition-all transform hover:scale-105 flex items-center justify-center gap-3 shadow-lg"
                >
                  I&apos;m an Existing User <ArrowRight size={24} />
                </button>
              </div>
            </div>
          )}

          {/* New User Sign-Up Form */}
          {screen === 'registration' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Your Account</h1>
                <p className="text-gray-600">Join Every Day Planner and boost your productivity</p>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    value={userData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 pt-6 pb-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    placeholder=" "
                  />
                  <label
                    htmlFor="name"
                    className={`absolute left-4 transition-all pointer-events-none ${
                      userData.name || focusedField === 'name'
                        ? 'top-2 text-xs text-indigo-600'
                        : 'top-4 text-base text-gray-500'
                    }`}
                  >
                    Full Name
                  </label>
                </div>

                <div className="relative">
                  <select
                    id="gender"
                    value={userData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    onFocus={() => setFocusedField('gender')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 pt-6 pb-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition appearance-none"
                  >
                    <option value=""></option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-Binary">Non-Binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <label
                    htmlFor="gender"
                    className={`absolute left-4 transition-all pointer-events-none ${
                      userData.gender || focusedField === 'gender'
                        ? 'top-2 text-xs text-indigo-600'
                        : 'top-4 text-base text-gray-500'
                    }`}
                  >
                    Gender
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    id="pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={userData.pin}
                    onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocusedField('pin')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 pt-6 pb-2 pr-12 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    placeholder=" "
                  />
                  <label
                    htmlFor="pin"
                    className={`absolute left-4 transition-all pointer-events-none ${
                      userData.pin || focusedField === 'pin'
                        ? 'top-2 text-xs text-indigo-600'
                        : 'top-4 text-base text-gray-500'
                    }`}
                  >
                    Create PIN (4-6 digits)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showConfirmPin ? 'text' : 'password'}
                    id="confirmPin"
                    inputMode="numeric"
                    maxLength={6}
                    value={userData.confirmPin}
                    onChange={(e) => handleInputChange('confirmPin', e.target.value.replace(/\D/g, ''))}
                    onFocus={() => setFocusedField('confirmPin')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 pt-6 pb-2 pr-12 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition"
                    placeholder=" "
                  />
                  <label
                    htmlFor="confirmPin"
                    className={`absolute left-4 transition-all pointer-events-none ${
                      userData.confirmPin || focusedField === 'confirmPin'
                        ? 'top-2 text-xs text-indigo-600'
                        : 'top-4 text-base text-gray-500'
                    }`}
                  >
                    Re-enter PIN
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPin(!showConfirmPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  This PIN will be your secure password for all future logins.
                </p>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  onClick={handleRegistration}
                  disabled={!isFormValid() || isLoading}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2 ${
                    isFormValid() && !isLoading
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'} <ArrowRight size={20} />
                </button>
                
                <button
                  onClick={() => setScreen('welcome_screen')}
                  className="w-full py-2 text-gray-600 hover:text-gray-800 transition text-sm"
                >
                  ← Back to Sign-In Choice
                </button>
              </div>
            </div>
          )}

          {/* Welcome Screen */}
          {screen === 'welcome' && (
            <div className="text-center space-y-6 animate-fade-in">
              <CheckCircle size={80} className="text-green-500 mx-auto animate-bounce" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Hi {userData.name}!</h2>
                <p className="text-gray-600 text-lg">Your productivity journey starts now!</p>
                <p className="text-gray-500 text-sm mt-2">Setting up your preferences...</p>
              </div>
            </div>
          )}

          {/* Preferences Screen */}
          {screen === 'preferences' && (
            <div className="space-y-6">
              <div className="text-center">
                <Clock size={60} className="text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Quick Setup</h2>
                <p className="text-gray-600">Let&apos;s personalize your planner</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">What time does your day typically start?</label>
                  <select
                    value={userData.dayStartTime}
                    onChange={(e) => handleInputChange('dayStartTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Select start time</option>
                    <option value="5:00 AM">5:00 AM</option>
                    <option value="6:00 AM">6:00 AM</option>
                    <option value="7:00 AM">7:00 AM</option>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time format preference</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleInputChange('timeFormat', '12-hour')}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                        userData.timeFormat === '12-hour'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      12-hour
                      <div className="text-xs text-gray-500 mt-1">9:00 AM</div>
                    </button>
                    <button
                      onClick={() => handleInputChange('timeFormat', '24-hour')}
                      className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                        userData.timeFormat === '24-hour'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      24-hour
                      <div className="text-xs text-gray-500 mt-1">09:00</div>
                    </button>
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  onClick={handlePreferences}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  Complete Setup <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Existing User Login - Two Step Process */}
          {screen === 'login' && (
            <div className="space-y-6">
              {/* Screen 4A: User Identification (Enter Full Name) */}
              {loginStep === 'name' && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Enter your credentials to login</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={userData.name}
                        onChange={(e) => {
                          handleInputChange('name', e.target.value);
                          setError('');
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && userData.name.trim() && handleNameSubmit()}
                        className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition text-lg"
                        placeholder="Enter your name"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm text-center animate-shake">{error}</p>
                    )}

                    <button
                      onClick={handleNameSubmit}
                      disabled={!userData.name.trim() || isLoading}
                      className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                        userData.name.trim() && !isLoading
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isLoading ? 'Checking...' : 'Next'}
                    </button>

                    <div className="flex justify-center">
                      <button
                        onClick={() => setScreen('welcome_screen')}
                        className="text-gray-600 hover:text-gray-800 transition text-sm"
                      >
                        ← Back to Sign-In Choice
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Screen 4B: PIN Verification */}
              {loginStep === 'pin' && (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                    <p className="text-gray-600">Hi {userData.name}, enter your PIN to continue</p>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type={showLoginPin ? 'text' : 'password'}
                        inputMode="numeric"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => {
                          setPinInput(e.target.value.replace(/\D/g, ''));
                          setError('');
                        }}
                        className="w-full px-4 py-4 pr-12 border-2 border-indigo-500 rounded-lg focus:border-indigo-600 focus:outline-none text-center text-3xl tracking-widest transition"
                        placeholder="••••"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPin(!showLoginPin)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showLoginPin ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>

                    {error && (
                      <p className="text-red-500 text-sm text-center animate-shake">{error}</p>
                    )}

                    <div className="flex justify-center gap-4 text-sm">
                      <button className="text-indigo-600 hover:text-indigo-700">
                        Forgot PIN?
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setLoginStep('name');
                        setPinInput('');
                        setError('');
                      }}
                      className="w-full py-2 text-gray-600 hover:text-gray-800 transition text-sm"
                    >
                      ← Change Name
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Welcome Back Screen */}
          {screen === 'welcomeBack' && (
            <div className="text-center space-y-6 animate-fade-in">
              <CheckCircle size={80} className="text-indigo-600 mx-auto animate-bounce" />
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Hi {userData.name},</h2>
                <p className="text-gray-600 text-lg">Welcome back. Let&apos;s get it done.</p>
                <p className="text-gray-500 text-sm mt-2">Loading your planner...</p>
              </div>
            </div>
          )}

          {/* Month Selection */}
          {screen === 'monthSelection' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  ← Logout
                </button>
                <div className="text-sm text-gray-600">Hi, {userData.name}!</div>
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setSelectedYear(selectedYear! - 1)}
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg p-2 transition"
                  title="Previous year"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="text-center min-w-[120px]">
                  <h2 className="text-3xl font-bold text-gray-800">{selectedYear}</h2>
                  <p className="text-gray-600 text-sm">Select a month</p>
                </div>
                
                <button
                  onClick={() => setSelectedYear(selectedYear! + 1)}
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg p-2 transition"
                  title="Next year"
                >
                  <ChevronLeft size={20} className="rotate-180" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {months.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className="py-6 px-4 bg-gray-50 hover:bg-indigo-50 rounded-lg font-semibold text-gray-800 hover:text-indigo-700 transition border-2 border-transparent hover:border-indigo-300"
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar View */}
          {screen === 'calendarView' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setScreen('monthSelection')}
                  className="text-indigo-600 hover:text-indigo-700"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex-1 text-center">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedMonth !== null && months[selectedMonth]} {selectedYear}
                  </h2>
                  <p className="text-gray-600 text-sm">Select a day</p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <div
                    key={index}
                    className="h-10 flex items-center justify-center font-bold text-indigo-600"
                  >
                    {day}
                  </div>
                ))}
                {renderCalendar()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Planner Full Screen */}
      {screen === 'dailyPlanner' && selectedYear !== null && selectedMonth !== null && selectedDate !== null && (
        <DailyPlannerView 
          date={`${months[selectedMonth]} ${selectedDate}, ${selectedYear}`}
          onBack={() => setScreen('calendarView')}
          onLogout={handleLogout}
        />
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-slide-in">
          <div className="bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle size={24} />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
