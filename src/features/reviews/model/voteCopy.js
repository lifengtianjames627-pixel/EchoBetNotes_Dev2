const errors = {
  en: 'Could not save your vote. Your counts have not changed. Please try again.',
  zh: '投票未能保存，显示计数没有改变，请重试。',
  ja: '投票を保存できませんでした。表示数は変更されていません。再試行してください。',
  ko: '투표를 저장하지 못했습니다. 표시된 집계는 변경되지 않았습니다. 다시 시도하세요.',
  fr: 'Impossible d’enregistrer votre vote. Les compteurs affichés sont inchangés. Réessayez.',
  ru: 'Не удалось сохранить голос. Отображаемые счётчики не изменились. Повторите попытку.',
};
export default function voteCopy(lang) {
  return errors[lang] || errors.en;
}