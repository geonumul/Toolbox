import React, { createContext, useContext, useState } from 'react';
import { en } from '../i18n/en';
import { ko } from '../i18n/ko';

export type Lang = 'ko' | 'en';

type Translations = typeof ko;

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextType>({
  lang: 'ko',
  setLang: () => {},
  t: ko,
});

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLang] = useState<Lang>('ko');
  const t = lang === 'ko' ? ko : (en as unknown as Translations);
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
