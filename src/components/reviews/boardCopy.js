// System copy for the reviews board sections and the per-review translate
// control. Interface only — review text itself is never auto-translated.
const COPY = {
  picks: ["Editors' Picks", '编辑精选', '編集部おすすめ', '에디터 추천', 'Choix de la rédaction', 'Выбор редакции'],
  picksHint: ['Reviews our editors liked', '编辑点赞过的乐评', '編集部がいいねしたレビュー', '에디터가 좋아한 리뷰', 'Critiques aimées par la rédaction', 'Рецензии, отмеченные редакцией'],
  popular: ['Popular Albums', '热门专辑', '人気アルバム', '인기 앨범', 'Albums populaires', 'Популярные альбомы'],
  popularHint: ['Ranked by views and review likes', '按浏览量与乐评点赞数排名', '閲覧数とレビューのいいね数で順位付け', '조회수와 리뷰 좋아요로 순위', 'Classés par vues et likes de critiques', 'По просмотрам и лайкам рецензий'],
  recent: ['Recent Reviews', '最新乐评', '最新レビュー', '최신 리뷰', 'Critiques récentes', 'Последние рецензии'],
  empty: ['Nothing here yet.', '这里还没有内容。', 'まだ何もありません。', '아직 내용이 없습니다.', 'Rien pour le moment.', 'Пока ничего нет.'],
  views: ['views', '次浏览', '回閲覧', '조회', 'vues', 'просмотров'],
  likes: ['likes', '个赞', 'いいね', '좋아요', 'likes', 'лайков'],
  translate: ['Translate', '翻译', '翻訳', '번역', 'Traduire', 'Перевести'],
  showOriginal: ['Show original', '显示原文', '原文を表示', '원문 보기', "Voir l'original", 'Показать оригинал'],
  translating: ['Translating…', '翻译中…', '翻訳中…', '번역 중…', 'Traduction…', 'Перевод…'],
  translateFailed: ['Translation failed', '翻译失败', '翻訳に失敗しました', '번역 실패', 'Échec de la traduction', 'Не удалось перевести'],
  machine: ['Machine translation', '机器翻译', '機械翻訳', '기계 번역', 'Traduction automatique', 'Машинный перевод'],
};

const ORDER = ['en', 'zh', 'ja', 'ko', 'fr', 'ru'];

export default function boardCopy(lang) {
  const i = Math.max(0, ORDER.indexOf(lang));
  return Object.fromEntries(Object.entries(COPY).map(([k, v]) => [k, v[i] || v[0]]));
}