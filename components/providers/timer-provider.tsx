"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

interface TimerState {
  taskId: string;
  startTime: Date;
  taskName: string;
}

interface TimerContextType {
  activeTimer: TimerState | null;
  elapsed: string; // "00:00:00"
  startTimer: (taskId: string, taskName: string) => Promise<void>;
  stopTimer: () => Promise<void>;
  loading: boolean;
}

const TimerContext = createContext<TimerContextType>({
  activeTimer: null,
  elapsed: "00:00:00",
  startTimer: async () => {},
  stopTimer: async () => {},
  loading: false,
});

export const useTimer = () => useContext(TimerContext);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<TimerState | null>(null);
  const [elapsed, setElapsed] = useState("00:00:00");
  const [loading, setLoading] = useState(false);

  // Fetch initial state
  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const res = await fetch("/api/timer");
        if (res.ok) {
          const data = await res.json();
          if (data.activeTimer && data.activeTimer.taskId && data.activeTimer.startTime) {
             const parsedStart = new Date(data.activeTimer.startTime);
             if (!isNaN(parsedStart.getTime())) {
               setActiveTimer({
                  ...data.activeTimer,
                  startTime: parsedStart,
               });
             }
          }
        }
      } catch (err) {
        console.error("Failed to fetch timer", err);
      }
    };
    fetchTimer();
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer) {
      const update = () => {
        const now = new Date();
        const diff = now.getTime() - activeTimer.startTime.getTime();
        const seconds = Math.floor(diff / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      };
      update(); // immediate
      interval = setInterval(update, 1000);
    } else {
        setElapsed("00:00:00");
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const startTimer = async (taskId: string, taskName: string) => {
    setLoading(true);
    try {
        const res = await fetch("/api/timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start", taskId }),
        });
        if (res.ok) {
            const data = await res.json();
            setActiveTimer({
                ...data.activeTimer,
                startTime: new Date(data.activeTimer.startTime),
                taskName: data.activeTimer.taskName || taskName
            });
            toast.success(`Timer started for "${taskName}"`);
        } else {
            toast.error("Failed to start timer");
        }
    } catch (error) {
        toast.error("Error starting timer");
    } finally {
        setLoading(false);
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;
    setLoading(true);
    try {
        const res = await fetch("/api/timer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "stop" }),
        });
        if (res.ok) {
            const data = await res.json();
            setActiveTimer(null);
            toast.success(`Timer stopped. Logged ${data.duration.toFixed(2)} hours.`);
        } else {
            toast.error("Failed to stop timer");
        }
    } catch (error) {
        toast.error("Error stopping timer");
    } finally {
        setLoading(false);
    }
  };

  return (
    <TimerContext.Provider value={{ activeTimer, elapsed, startTimer, stopTimer, loading }}>
      {children}
    </TimerContext.Provider>
  );
}
