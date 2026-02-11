# Guía de Despliegue: Version-Web + Backend de Video

Esta solución conecta tu web (Next.js) con tu motor de video (Python).

## 🌍 Arquitectura
1. **Frontend (Version-Web)**: Se despliega en **Vercel**.
2. **Backend (Video Editor App)**: Se despliega en **Render** (usando el nuevo `backend_api.py`).

---

## 🚀 PASO 1: Backend (Render)

1. **Subir cambios a GitHub**: Asegúrate de que `backend_api.py`, `requirements.txt` y `video_processor.py` estén en tu repositorio de GitHub (en la carpeta del editor de video).
2. Ve a [Render.com](https://render.com) y crea un **Web Service**.
3. Conecta tu repo.
4. **Configuración**:
   - **Root Directory**: `.` (o la carpeta donde esté `backend_api.py`)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python backend_api.py` (o `uvicorn backend_api:app --host 0.0.0.0 --port $PORT`)
   - **Environment Variables**:
     - `GROQ_API_KEY`: Tu clave de Groq.
     - `PYTHON_VERSION`: `3.10` (recomendado).

5. **Deploy**: Espera a que termine. Render te dará una URL (ej: `https://video-editor-api.onrender.com`).
   - Prueba que funciona visitando `https://video-editor-api.onrender.com/health`. Debería decir `{"status":"ok"}`.

---

## 🎨 PASO 2: Frontend (Vercel)

1. Ve a la carpeta `version-web`.
2. Sube código a GitHub.
3. Ve a [Vercel.com](https://vercel.com) y crea un **New Project**.
4. Importa el repo de `version-web`.
5. **Environment Variables** (IMPORTANTE):
   - Agrega una variable llamada `NEXT_PUBLIC_API_URL`.
   - Valor: La URL de tu backend en Render (ej: `https://video-editor-api.onrender.com`). **Sin barra al final**.
6. **Deploy**.

---

## ✅ Verificación

1. Abre tu web desplegada en Vercel.
2. Ve al editor.
3. Deberías ver las opciones de voces cargadas desde el servidor.
4. Intenta generar un video de prueba.
