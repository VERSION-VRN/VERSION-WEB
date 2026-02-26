"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import dynamic from 'next/dynamic';
import { ToastType } from '@/components/Toast';

const Toast = dynamic(() => import('@/components/Toast'), { ssr: false });

interface TaskRecord {
    id: string;
    filename: string;
    status: string;
    task_type: string;
}

export function NotificationCenter() {
    const { user } = useAuth();
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const notifiedTasks = useRef<Set<string>>(new Set());
    const isFirstRun = useRef(true);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        // El componente Toast interno maneja su propia desaparición, 
        // pero necesitamos limpiar el estado aquí para permitir nuevos toasts.
    };

    useEffect(() => {
        if (!user) return;

        const checkTasks = async () => {
            try {
                const tasks = await apiFetch<TaskRecord[]>('/all-videos');

                if (!tasks || !Array.isArray(tasks)) return;

                const finishedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');

                // En la primera corrida, solo llenamos el Set para no disparar notificaciones viejas
                if (isFirstRun.current) {
                    finishedTasks.forEach(t => notifiedTasks.current.add(t.id));
                    isFirstRun.current = false;
                    return;
                }

                for (const task of finishedTasks) {
                    if (!notifiedTasks.current.has(task.id)) {
                        const type: ToastType = task.status === 'completed' ? 'success' : 'error';
                        const emoji = task.status === 'completed' ? '✨' : '❌';
                        const action = task.status === 'completed' ? 'completado' : 'fallido';

                        showToast(`${emoji} Tarea "${task.filename}" ha ${action}.`, type);
                        notifiedTasks.current.add(task.id);

                        // Solo mostramos una notificación a la vez para no saturar
                        break;
                    }
                }
            } catch (error) {
                if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('Network Error'))) {
                    showToast("⚠️ Error de conexión: Verifica que el backend y el túnel (localtunnel) estén encendidos.", "error");
                } else {
                    console.error("NotificationCenter error:", error);
                }
            }
        };

        const interval = setInterval(checkTasks, 15000); // Check every 15s
        checkTasks(); // Immediate check

        return () => clearInterval(interval);
    }, [user]);

    if (!toast) return null;

    return (
        <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
        />
    );
}
