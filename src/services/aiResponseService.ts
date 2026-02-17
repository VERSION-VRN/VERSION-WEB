'use client';

export const getAIResponse = (userInput: string) => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('gancho') || lowerInput.includes('hook')) {
        return "Para ganar la atención en los primeros 5 segundos (Hook), el Master recomienda: \n\n1. Una pregunta impactante.\n2. Un dato sorprendente o contradictorio.\n3. Mostrar el resultado final de inmediato.\n\nEjemplo: '¿Sabías que el 90% de los canales fallan por no aplicar esta métrica?' or 'He probado [estrategia] por 30 días y este es el resultado inesperado'.";
    }

    if (lowerInput.includes('nicho')) {
        return "La hoja de ruta para elegir un nicho es:\n\n1. Define pasiones y habilidades.\n2. Investiga la demanda en Google Trends y YouTube Analytics.\n3. Define un público objetivo (edad, intereses).\n4. Analiza qué está haciendo la competencia y qué puedes mejorar tú.";
    }

    if (lowerInput.includes('guion') || lowerInput.includes('guión')) {
        return "Estructura técnica recomendada por el sistema:\n\n- **Hook (Gancho):** Los primeros 5 segundos son vitales.\n- **Story (Historia):** Desarrolla el mensaje de forma clara.\n- **Call-to-Action (CTA):** Instruye a la audiencia (Suscribirse, comentar).\n\n¿Quieres que te dé un ejemplo de estructura para un Short o para un video largo de 15 minutos?";
    }

    if (lowerInput.includes('miniatura')) {
        return "Claves para una miniatura VIRAL según VERSION AI:\n\n1. **Contraste:** Usa colores como rojo, amarillo o naranja.\n2. **Texto:** 3 a 5 palabras grandes y legibles.\n3. **Emoción:** Expresiones faciales exageradas.\n4. **Misterio:** Un elemento que genere curiosidad sin revelar todo.";
    }

    if (lowerInput.includes('voz') || lowerInput.includes('audio')) {
        return "Para el audio profesional en el Paso 3:\n\n- **Entorno:** Reduce ruidos con paneles o graba en lugares silenciosos.\n- **Herramientas IA:** ElevenLabs es la recomendación del sistema para narración neuronal.\n- **Música:** Usa Suno, Pixabay o la biblioteca de YouTube para evitar el Copyright.";
    }

    if (lowerInput.includes('seo') || lowerInput.includes('etiquetas') || lowerInput.includes('título')) {
        return "Para optimizar el SEO:\n\n1. Usa **VidiQ** o **Keywords Everywhere** para hallar palabras clave.\n2. El título debe contener la keyword principal al inicio.\n3. La descripción debe ser atractiva y optimizada para buscadores.\n4. No olvides los capítulos de video para mejorar la retención.";
    }

    if (lowerInput.includes('hola') || lowerInput.includes('buenas') || lowerInput.includes('que tal')) {
        return "Hola, Rebelde. Soy VERSION AI, tu estratega. Estoy monitoreando tu flujo de trabajo. ¿Necesitas optimizar algo ahora mismo?";
    }

    return "Entendido. Para darte los datos exactos del Master en YouTube, ¿puedes decirme si necesitas ayuda con el Paso 1 (Canal), Paso 2 (Estrategia/Guion), Paso 3 (Recursos) o Paso 4 (Producción/SEO)?";
};

export const getContextualSkillResponse = (pathname: string) => {
    if (pathname.includes('/thumbnails')) {
        return "Estoy detectando que estás en el Editor de Miniaturas. ¿Quieres que analice si el contraste y el texto son óptimos para el CTR?";
    }
    if (pathname.includes('/seo')) {
        return "Sistema SEO detectado. Puedo auditar tus palabras clave actuales si me las proporcionas aquí.";
    }
    if (pathname.includes('/writer')) {
        return "Escritura de guion activa. ¿Necesitas que genere 3 ganchos (hooks) diferentes para este tema?";
    }
    if (pathname.includes('/editor')) {
        return "Producción de video en curso. Recuerda que la retención depende de los cortes dinámicos que hagamos en el Paso 4.";
    }
    return null;
};
