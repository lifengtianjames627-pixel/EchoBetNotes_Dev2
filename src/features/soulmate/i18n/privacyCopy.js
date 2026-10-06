const rows = {
  upload: ['Upload a private poster', '上传私有海报', '非公開ポスターをアップロード', '비공개 포스터 업로드', 'Importer une affiche privée', 'Загрузить приватную афишу'],
  uploading: ['Uploading…', '上传中…', 'アップロード中…', '업로드 중…', 'Importation…', 'Загрузка…'],
  imageHint: ['PNG, JPEG or WebP · up to 5 MB. Visible only to authorized viewers.', 'PNG、JPEG 或 WebP，最大5 MB；仅授权用户可查看。', 'PNG・JPEG・WebP、最大5 MB。許可された利用者のみ閲覧可能。', 'PNG, JPEG, WebP · 최대 5 MB. 허용된 사용자만 볼 수 있습니다.', 'PNG, JPEG ou WebP · 5 Mo max. Accès réservé aux personnes autorisées.', 'PNG, JPEG или WebP · до 5 МБ. Доступ только с разрешением.'],
  invalidImage: ['Choose a PNG, JPEG or WebP image under 5 MB.', '请选择不超过5 MB的PNG、JPEG或WebP图片。', '5 MB以下のPNG・JPEG・WebPを選択してください。', '5 MB 이하의 PNG, JPEG, WebP를 선택하세요.', 'Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum.', 'Выберите PNG, JPEG или WebP размером до 5 МБ.'],
  unavailable: ['This image is unavailable.', '此图片暂不可用。', '画像を表示できません。', '이미지를 볼 수 없습니다.', 'Cette image est indisponible.', 'Изображение недоступно.'],
  remove: ['Remove image', '移除图片', '画像を削除', '이미지 제거', 'Retirer l’image', 'Убрать изображение'],
  search: ['Search by nickname…', '搜索昵称…', 'ニックネームで検索…', '닉네임으로 검색…', 'Rechercher un pseudo…', 'Поиск по псевдониму…'],
  profileUnavailable: ['This profile is unavailable or no longer exists.', '该资料暂不可用，或已不存在。', 'このプロフィールは表示できないか、存在しません。', '이 프로필을 볼 수 없거나 더 이상 존재하지 않습니다.', 'Ce profil est indisponible ou n’existe plus.', 'Профиль недоступен или больше не существует.'],
};
export default function privacyCopy(lang) {
  const i = Math.max(0, ['en', 'zh', 'ja', 'ko', 'fr', 'ru'].indexOf(lang));
  return Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v[i]]));
}