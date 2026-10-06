const rows = {
  title: ['Discover music', '发现音乐', '音楽を探す', '음악 찾기', 'Découvrir la musique', 'Открыть музыку'],
  add: ['Add Album', '添加专辑', 'アルバム追加', '앨범 추가', 'Ajouter un album', 'Добавить альбом'],
  search: ['Search albums or artists…', '搜索专辑或音乐人…', 'アルバム・アーティストを検索…', '앨범 또는 아티스트 검색…', 'Rechercher un album ou artiste…', 'Поиск альбомов или исполнителей…'],
  all: ['All genres', '全部曲风', 'すべてのジャンル', '모든 장르', 'Tous les genres', 'Все жанры'],
  name: ['Title', '专辑名', 'タイトル', '제목', 'Titre', 'Название'],
  artist: ['Artist', '音乐人', 'アーティスト', '아티스트', 'Artiste', 'Исполнитель'],
  genre: ['Genre', '曲风', 'ジャンル', '장르', 'Genre', 'Жанр'],
  year: ['Release year', '发行年份', '発売年', '발매 연도', 'Année de sortie', 'Год выпуска'],
  cover: ['Cover image URL (optional)', '封面图片链接（可选）', 'ジャケットURL（任意）', '표지 이미지 URL (선택)', 'URL de la pochette (facultatif)', 'URL обложки (необязательно)'],
  description: ['Description', '介绍', '紹介', '소개', 'Description', 'Описание'],
  empty: ['No matching albums.', '没有匹配的专辑。', '一致するアルバムがありません。', '일치하는 앨범이 없습니다.', 'Aucun album correspondant.', 'Нет подходящих альбомов.'],
  loading: ['Loading…', '加载中…', '読み込み中…', '불러오는 중…', 'Chargement…', 'Загрузка…'],
  saving: ['Adding…', '添加中…', '追加中…', '추가 중…', 'Ajout…', 'Добавление…'],
  failed: ['Could not complete this action. Please try again.', '操作未完成，请重试。', '操作を完了できませんでした。再試行してください。', '완료하지 못했습니다. 다시 시도하세요.', 'Impossible de terminer. Réessayez.', 'Не удалось выполнить действие. Повторите попытку.'],
  retry: ['Retry', '重试', '再試行', '다시 시도', 'Réessayer', 'Повторить'],
  latest: ['Browse the latest 100 albums.', '浏览最近添加的100张专辑。', '最新の100枚のアルバムを表示。', '최근 추가된 앨범 100개를 표시합니다.', 'Parcourir les 100 derniers albums.', 'Последние 100 альбомов.'],
};
export default function discoveryCopy(lang) {
  const index = Math.max(0, ['en', 'zh', 'ja', 'ko', 'fr', 'ru'].indexOf(lang));
  return Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, values[index]]));
}