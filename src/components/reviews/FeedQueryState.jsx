import React from 'react';
import { useLang } from '@/i18n/LanguageContext';

const copy = {
  en: ['Loading reviews…', 'Reviews could not be loaded. Your content has not been deleted.', 'Try again'],
  zh: ['正在加载乐评…', '乐评暂时无法加载，内容并未被删除。', '重试'],
  ja: ['レビューを読み込み中…', 'レビューを読み込めませんでした。内容は削除されていません。', '再試行'],
  ko: ['리뷰 불러오는 중…', '리뷰를 불러오지 못했습니다. 콘텐츠는 삭제되지 않았습니다.', '다시 시도'],
  fr: ['Chargement des critiques…', 'Impossible de charger les critiques. Votre contenu n’a pas été supprimé.', 'Réessayer'],
  ru: ['Загрузка рецензий…', 'Не удалось загрузить рецензии. Ваш контент не удалён.', 'Повторить'],
};

export default function FeedQueryState({ loading = false, retry }) {
  const { lang } = useLang();
  const text = copy[lang] || copy.en;
  return (
    <div role={loading ? 'status' : 'alert'} className="mx-auto max-w-5xl px-6 py-12 text-center text-sm text-muted-foreground">
      <p>{text[loading ? 0 : 1]}</p>
      {!loading && <button type="button" onClick={retry} className="mt-3 rounded-md border border-border px-4 py-2 text-foreground">{text[2]}</button>}
    </div>
  );
}