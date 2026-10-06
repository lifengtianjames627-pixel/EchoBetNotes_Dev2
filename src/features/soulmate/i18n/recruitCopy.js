const rows = {
  board: ['Recruitment', '招募看板', '募集掲示板', '모집 게시판', 'Recrutement', 'Поиск музыкантов'],
  participation: ['Members must be at least 13 years old. Recruitment, profiles and messaging are not separated by age, and we do not verify anyone’s age or identity. Keep contact in-app; users under 18 should get a parent or guardian’s agreement before meeting anyone in person. Safety notices do not verify members or guarantee offline safety.', '成员须年满13岁。招募、资料及私信不按年龄分组，平台不核验成员的年龄或身份。请保留站内联系；未满18岁者在线下见面前应征得家长或监护人的同意。安全提示不等于身份核验，也不保证线下安全。', '会員は13歳以上である必要があります。募集・プロフィール・メッセージは年齢で分けず、年齢や身元を確認しません。連絡はアプリ内で行い、18歳未満の方は会う前に保護者の同意を得てください。安全の案内は身元や対面活動の安全を保証しません。', '회원은 만 13세 이상이어야 합니다. 모집, 프로필, 메시지는 연령별로 분리하지 않으며 나이나 신원을 인증하지 않습니다. 연락은 앱 내에서 하고, 18세 미만은 만나기 전에 보호자 동의를 받으세요. 안전 안내가 신원이나 오프라인 안전을 보장하지는 않습니다.', 'Les membres doivent avoir au moins 13 ans. Annonces, profils et messages ne sont pas séparés par âge et nous ne vérifions ni âge ni identité. Échangez dans l’app ; les moins de 18 ans doivent obtenir l’accord d’un parent ou tuteur avant une rencontre. Les consignes ne garantissent ni identité ni sécurité hors ligne.', 'Участникам должно быть не менее 13 лет. Объявления, профили и сообщения не разделяются по возрасту; возраст и личность не проверяются. Общайтесь в приложении; до 18 лет получите согласие родителя или опекуна перед встречей. Памятка не гарантирует личность участников или безопасность встречи.'],
  saving: ['Saving…', '正在保存…', '保存中…', '저장 중…', 'Enregistrement…', 'Сохранение…'],
  failed: ['Could not complete this action. Please try again.', '操作未完成，请重试。', '操作を完了できませんでした。再試行してください。', '완료하지 못했습니다. 다시 시도하세요.', 'Impossible de terminer. Réessayez.', 'Не удалось выполнить действие. Повторите попытку.'],
  retry: ['Retry', '重试', '再試行', '다시 시도', 'Réessayer', 'Повторить'],
  pending: ['Submitted for review. It will appear after approval.', '已提交审核，通过后才会公开展示。', '審査に提出しました。承認後に表示されます。', '검토를 요청했습니다. 승인 후 표시됩니다.', 'Soumis à la modération. Visible après approbation.', 'Отправлено на проверку. Появится после одобрения.'],
  contact: ['Remove contact details; use in-app chat only.', '请移除站外联系方式，仅通过站内私信联系。', '連絡先を削除し、アプリ内チャットをご利用ください。', '연락처를 삭제하고 앱 내 채팅을 이용하세요.', 'Retirez les coordonnées et utilisez la messagerie intégrée.', 'Удалите контактные данные и используйте чат приложения.'],
  blocked: ['Please revise this post to follow community guidelines.', '请按社区规范修改内容后重试。', 'コミュニティ規則に沿って内容を修正してください。', '커뮤니티 규칙에 맞게 수정하세요.', 'Modifiez cette annonce selon les règles de la communauté.', 'Измените объявление согласно правилам сообщества.'],
  recruitment: ['Recruitment moderation', '招募审核', '募集の審査', '모집 검토', 'Modération des annonces', 'Проверка объявлений'],
  approve: ['Approve', '通过', '承認', '승인', 'Approuver', 'Одобрить'],
  reject: ['Reject', '拒绝', '却下', '거부', 'Refuser', 'Отклонить'],
  empty: ['No recruitment posts in this category.', '此分类暂无招募帖子。', 'この分類の募集はありません。', '이 분류에 모집 글이 없습니다.', 'Aucune annonce dans cette catégorie.', 'В этой категории нет объявлений.'],
};
export default function recruitCopy(lang) {
  const index = Math.max(0, ['en', 'zh', 'ja', 'ko', 'fr', 'ru'].indexOf(lang));
  return Object.fromEntries(Object.entries(rows).map(([key, values]) => [key, values[index]]));
}