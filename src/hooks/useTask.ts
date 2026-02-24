'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@/lib/api';

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'awaiting_review' | 'not_found';

export interface TaskResult {
    video_rel_path?: string;
    video_path?: string;
    script_rel_path?: string;
    [key: string]: any;
}

export interface TaskState {
    status: TaskStatus;
    progress: number;
    message: string;
    error: string | null;
    result: TaskResult | null;
    script_content?: string;
    params?: any;
}

interface UseTaskOptions {
    interval?: number;
    onCompleted?: (result: TaskResult) => void;
    onError?: (error: string) => void;
    onAwaitingReview?: (content: string) => void;
    immediate?: boolean;
}

export function useTask(taskId: string | null, options: UseTaskOptions = {}) {
    const {
        interval = 2500,
        onCompleted,
        onError,
        onAwaitingReview,
        immediate = true
    } = options;

    const [state, setState] = useState<TaskState>({
        status: 'pending',
        progress: 0,
        message: 'Iniciando...',
        error: null,
        result: null
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isActive = !!taskId && !['completed', 'failed', 'cancelled'].includes(state.status);

    const poll = useCallback(async () => {
        if (!taskId) return;

        try {
            const data = await apiFetch<any>(`/status/${taskId}`);

            if (!data || data.status === 'not_found') {
                setState(prev => ({ ...prev, status: 'not_found', error: 'Tarea no encontrada' }));
                return;
            }

            const newState: TaskState = {
                status: data.status,
                progress: data.progress || 0,
                message: data.message || '',
                error: data.status === 'failed' ? data.message : null,
                result: data.result || null,
                script_content: data.script_content,
                params: data.params
            };

            setState(newState);

            if (data.status === 'completed' && data.result) {
                onCompleted?.(data.result);
                stopPolling();
            } else if (data.status === 'failed' || data.status === 'cancelled') {
                onError?.(data.message || 'La tarea falló');
                stopPolling();
            } else if (data.status === 'awaiting_review') {
                onAwaitingReview?.(data.script_content || '');
                stopPolling();
            }
        } catch (err) {
            console.error('[useTask] Polling error:', err);
            // Don't stop polling on network error, just wait for next interval
        }
    }, [taskId, onCompleted, onError, onAwaitingReview]);

    const stopPolling = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        stopPolling();
        if (taskId) {
            poll(); // Initial check
            timerRef.current = setInterval(poll, interval);
        }
    }, [taskId, interval, poll, stopPolling]);

    useEffect(() => {
        if (immediate && taskId && !['completed', 'failed', 'cancelled'].includes(state.status)) {
            startPolling();
        }
        return () => stopPolling();
    }, [taskId, immediate, startPolling, stopPolling]);

    const reset = useCallback(() => {
        stopPolling();
        setState({
            status: 'pending',
            progress: 0,
            message: 'Iniciando...',
            error: null,
            result: null
        });
    }, [stopPolling]);

    return {
        ...state,
        isActive,
        startPolling,
        stopPolling,
        reset,
        refresh: poll
    };
}
