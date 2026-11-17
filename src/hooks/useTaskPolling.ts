"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { VideoTaskResponse } from "@/lib/types";

interface UseTaskPollingOptions {
  pollingIntervalMs?: number;
  onCompleted?: (task: VideoTaskResponse) => void;
  onFailed?: (task: VideoTaskResponse) => void;
}

export function useTaskPolling(options: UseTaskPollingOptions = {}) {
  const {
    pollingIntervalMs = 3000,
    onCompleted,
    onFailed,
  } = options;

  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<VideoTaskResponse | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompletedRef = useRef(onCompleted);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
    onFailedRef.current = onFailed;
  }, [onCompleted, onFailed]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/status/${id}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("تعذر جلب حالة المهمة من الخادم");
        }

        const data = await response.json();
        if (data.success && data.task) {
          const currentTask: VideoTaskResponse = data.task;
          setTask(currentTask);

          if (currentTask.status === "COMPLETED") {
            setIsPolling(false);
            clearTimer();
            if (onCompletedRef.current) {
              onCompletedRef.current(currentTask);
            }
          } else if (currentTask.status === "FAILED") {
            setIsPolling(false);
            clearTimer();
            setError(currentTask.errorMessage || "فشلت عملية التحريك");
            if (onFailedRef.current) {
              onFailedRef.current(currentTask);
            }
          }
        }
      } catch (err) {
        console.error("[useTaskPolling] Error:", err);
        // Do not abort polling on transient network hiccups, but record notice
      }
    },
    [clearTimer]
  );

  const startPolling = useCallback(
    (id: string, initialTask?: VideoTaskResponse) => {
      clearTimer();
      setTaskId(id);
      setIsPolling(true);
      setError(null);
      if (initialTask) {
        setTask(initialTask);
      }

      // Initial immediate fetch
      fetchStatus(id);

      // Start interval
      timerRef.current = setInterval(() => {
        fetchStatus(id);
      }, pollingIntervalMs);
    },
    [clearTimer, fetchStatus, pollingIntervalMs]
  );

  const stopPolling = useCallback(() => {
    clearTimer();
    setIsPolling(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTaskId(null);
    setTask(null);
    setIsPolling(false);
    setError(null);
  }, [clearTimer]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    taskId,
    task,
    isPolling,
    error,
    startPolling,
    stopPolling,
    reset,
    setTask,
  };
}
