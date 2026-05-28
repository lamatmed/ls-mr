'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import ar from '../../locales/ar.json'
import fr from '../../locales/fr.json'
import pt from '../../locales/pt.json'
import en from '../../locales/en.json'
import es from '../../locales/es.json'
import { getCompany } from '../utlis/actions'

export type Language = 'ar' | 'fr' | 'pt' | 'en' | 'es'

const translations = { ar, fr, pt, en, es }

export type Translations = typeof ar

interface LanguageContextType {
  lang: Language
  setLang: (lang: Language) => void
  t: Translations
  currency: string
  setCurrency: (c: string) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'ar',
  setLang: () => {},
  t: ar,
  currency: 'MRU',
  setCurrency: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('ar')
  const [currency, setCurrency] = useState('MRU')

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language | null
    if (saved && ['ar', 'fr', 'pt', 'en', 'es'].includes(saved)) {
      setLangState(saved)
    }
    getCompany().then(c => { if (c?.currency) setCurrency(c.currency) })
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLangState, t: translations[lang], currency, setCurrency }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
