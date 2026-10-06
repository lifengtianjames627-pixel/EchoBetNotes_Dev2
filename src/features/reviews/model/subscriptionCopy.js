const copy = {
  en: { subscribe: 'Subscribe', subscribed: 'Subscribed', add: 'Subscribe to this reviewer', remove: 'Unsubscribe from this reviewer', failed: 'Could not update your subscription. Please try again.', loadFailed: 'Could not load your subscription.', retry: 'Retry' },
  zh: { subscribe: '关注', subscribed: '已关注', add: '关注这位乐评人', remove: '取消关注这位乐评人', failed: '关注状态未能更新，请重试。', loadFailed: '无法加载关注状态。', retry: '重试' },
  ja: { subscribe: 'フォロー', subscribed: 'フォロー中', add: 'このレビュアーをフォロー', remove: 'このレビュアーのフォローを解除', failed: 'フォロー状態を更新できませんでした。再試行してください。', loadFailed: 'フォロー状態を読み込めませんでした。', retry: '再試行' },
  ko: { subscribe: '팔로우', subscribed: '팔로우 중', add: '이 리뷰어 팔로우', remove: '이 리뷰어 팔로우 취소', failed: '팔로우 상태를 변경하지 못했습니다. 다시 시도하세요.', loadFailed: '팔로우 상태를 불러오지 못했습니다.', retry: '다시 시도' },
  fr: { subscribe: 'Suivre', subscribed: 'Abonné', add: 'Suivre ce critique', remove: 'Ne plus suivre ce critique', failed: 'Impossible de modifier votre abonnement. Réessayez.', loadFailed: 'Impossible de charger votre abonnement.', retry: 'Réessayer' },
  ru: { subscribe: 'Подписаться', subscribed: 'Вы подписаны', add: 'Подписаться на автора', remove: 'Отписаться от автора', failed: 'Не удалось изменить подписку. Повторите попытку.', loadFailed: 'Не удалось загрузить подписку.', retry: 'Повторить' },
};
export default function subscriptionCopy(lang) { return copy[lang] || copy.en; }