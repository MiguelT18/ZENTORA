import React from "react";

interface ChatSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatSuggestions({ onSuggestionClick }: ChatSuggestionsProps) {
  const suggestions = [
    "¿Cómo está el mercado hoy?",
    "¿Qué acciones recomiendas?",
    "¿Cuáles son las tendencias actuales?",
    "Analiza esta empresa para mí",
  ];

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-bl from-primary to-secondary p-3 rounded-full w-fit mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary mb-2">
          ¡Hola! Soy Nexa, tu asistente de mercados
        </h3>
        <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm leading-relaxed max-w-md mx-auto">
          Pregúntame cualquier cosa sobre mercados financieros, análisis de la gráfica actual,
          tendencias del mercado, o solicita recomendaciones basadas en el contexto actual. Te
          proporcionaré análisis detallados con ejemplos específicos.
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-light-text-muted dark:text-dark-text-muted text-center mb-4">
          Ejemplos de preguntas que puedes hacer:
        </p>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left text-sm text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary transition-colors p-3 rounded-lg bg-light-bg-surface dark:bg-dark-bg-surface cursor-pointer border border-light-bg-surface dark:border-dark-bg-surface hover:border-secondary/50 dark:hover:border-primary/50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
