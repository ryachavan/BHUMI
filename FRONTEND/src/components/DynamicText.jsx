import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

// Simple in-memory cache to avoid redundant API calls
const translationCache = {};

export default function DynamicText({ text }) {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (!text) {
      setTranslatedText('');
      return;
    }
    
    // Use the primary language code (e.g., 'hi' from 'hi-IN' if applicable)
    const lang = language?.split('-')[0] || 'en';
    
    if (lang === 'en') {
      setTranslatedText(text);
      return;
    }
    
    const cacheKey = `${lang}_${text}`;
    if (translationCache[cacheKey]) {
      setTranslatedText(translationCache[cacheKey]);
      return;
    }

    let isMounted = true;
    
    const fetchTranslation = async () => {
      try {
        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
        const data = await res.json();
        const result = data[0].map(x => x[0]).join('');
        
        translationCache[cacheKey] = result;
        if (isMounted) {
          setTranslatedText(result);
        }
      } catch (err) {
        console.error("Dynamic translation failed:", err);
        if (isMounted) {
          setTranslatedText(text); // Fallback to original text
        }
      }
    };

    fetchTranslation();
    
    return () => {
      isMounted = false;
    };
  }, [text, language]);

  return <>{translatedText}</>;
}
