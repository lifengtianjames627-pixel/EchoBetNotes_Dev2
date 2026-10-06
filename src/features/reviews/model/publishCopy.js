const messages = {
  en: ['Checking and publishing…', 'This content does not meet the community guidelines. Please revise it.', 'Could not publish. Please try again.'],
  zh: ['审核并发布中…', '内容不符合社区规范，请修改后重试。', '发布失败，请重试。'],
  ja: ['確認・公開中…', 'コミュニティ規則に合わない内容です。修正してください。', '公開できませんでした。再試行してください。'],
  ko: ['검토 및 게시 중…', '커뮤니티 규칙에 맞지 않는 내용입니다. 수정해 주세요.', '게시하지 못했습니다. 다시 시도하세요.'],
  fr: ['Vérification et publication…', 'Ce contenu ne respecte pas les règles de la communauté. Veuillez le modifier.', 'Échec de publication. Réessayez.'],
  ru: ['Проверка и публикация…', 'Содержание не соответствует правилам сообщества. Измените его.', 'Не удалось опубликовать. Повторите попытку.'],
};
export default function publishCopy(lang) {
  const [pending, blocked, failed] = messages[lang] || messages.en;
  return { pending, blocked, failed };
}