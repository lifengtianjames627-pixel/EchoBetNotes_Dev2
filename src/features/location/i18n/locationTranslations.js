export const LOCATION_TRANSLATIONS = {
  en: {
    'location.networkTitle': 'Allow network-based discovery',
    'location.networkDescription': 'Optional: use a hashed public network address for matching and send your public IP to ipwho.is for an approximate location. A shared network does not prove proximity. Turn off later in Messages.',
    'chat.wifiShort': 'Optional network matching · details',
    'chat.sameWifi': 'Shared public network',
    'chat.wifiNote': 'Matching requires both members to enable network discovery in profile setup. A shared public network may be a VPN or shared provider, not the same Wi-Fi or a nearby place. Device locations and manual pins are estimates.',
    'home.peopleAroundHint': 'Discover members through shared locations, opted-in network matches or the community board.',
    'location.close': 'Close', 'location.failed': 'Could not save your location choice. Please try again.', 'location.saving': 'Saving your choice…',
    'consent.session': 'This visit only', 'consent.sessionDesc': 'Used in this open app only to sort your list; not saved to your profile or shared as your pin. Refreshing or closing ends this choice.',
    'consent.alwaysDesc': 'Save until you turn it off. Device location may refresh on later visits; manual pins stay where you put them.',
    'consent.agreement': `1. Purpose and choices. Device location or a manual map pin is optional and used for nearby discovery. Choose this visit only or save until turned off. Declining does not prevent in-app messaging.

2. Data. Accepted coordinates are rounded to 3 decimal places (roughly 100 m) before use. Visit-only coordinates stay in app memory and are sent to the server only to sort your list; they are not saved to your profile or shared as your pin. Saved coordinates include source, collection time and device accuracy when available. Browser location may use GPS, Wi-Fi or network estimates; manual pins are not verified.

3. Visibility. Nearby discovery returns rounded distances and saved map pins rounded to 2 decimal places (roughly 1 km). These are approximate grids, not guarantees of anonymity. Avoid placing a pin at your home or school.

4. Network and maps. Network discovery is a separate opt-in in profile setup. When enabled, a hashed public network address is stored for matching and the public IP may be sent to ipwho.is for an approximate position. A shared network does not prove a shared Wi-Fi or physical proximity. OpenStreetMap receives tile requests when you open a map. Device permission does not enable network discovery.

5. Withdrawal and safety. “Turn off” or “Don't allow” removes saved coordinates, clears the visit-only position and disables network discovery. Normal messaging remains available. If under 18, use with a parent or guardian's knowledge, stay in-app and do not share an exact meeting location publicly.`,
    'loc.privacy': 'Nearby maps use approximate pins and rounded distances. Avoid sharing a home or school location.',
    'picker.help': 'Choose an approximate area, not your home or school. Saved pins may be shown to other members at roughly 1 km precision.',
    'loc.desktopHint': 'Browser location may use GPS, Wi-Fi or network estimates. You can choose an approximate area on the map instead.',
  },
  zh: {
    'location.networkTitle': '允许基于网络发现成员',
    'location.networkDescription': '可选：使用公共网络地址的哈希进行匹配，并将公共 IP 发送给 ipwho.is 获取大致位置；同一网络不代表实际靠近，可稍后在消息页关闭。',
    'chat.wifiShort': '网络匹配为可选功能 · 查看说明',
    'chat.sameWifi': '共享公共网络',
    'chat.wifiNote': '双方均在资料设置中开启网络发现后才匹配。相同公共网络可能来自 VPN 或共享服务商，不代表同一 Wi-Fi 或实际靠近；设备定位和手动图钉也只是估计。',
    'home.peopleAroundHint': '通过已共享位置、自愿开启的网络匹配或社区海报发现成员。',
    'location.close': '关闭窗口', 'location.failed': '位置设置保存失败，请重试。', 'location.saving': '正在保存选择…',
    'consent.session': '仅本次访问', 'consent.sessionDesc': '仅在当前打开的应用内用于排序，不保存到资料或作为你的图钉共享；刷新或关闭后结束。',
    'consent.alwaysDesc': '保存直到你主动关闭；后续访问可刷新设备位置，手动图钉不会自动移动。',
    'consent.agreement': `1. 用途与选择。设备定位或手动图钉均为可选，用于附近成员发现。你可选择仅本次访问或保存到主动关闭；拒绝不影响站内私信。

2. 数据。坐标使用前保留三位小数（约 100 米）。仅本次的位置只放在应用内存中，发送到服务端用于当前列表排序，不保存到个人资料，也不作为你的图钉共享。长期保存的位置包含来源、时间及可用的设备精度。浏览器可能依靠 GPS、Wi-Fi 或网络估算；手动图钉未经核实。

3. 可见范围。附近功能向其他成员返回经过舍入的距离及保留两位小数（约 1 公里）的已保存图钉。这是近似网格，不保证匿名性；请不要标记家庭或学校的精确位置。

4. 网络与地图。网络发现是资料设置中的独立选项。开启后，公共网络地址的哈希值用于匹配，公共 IP 可能发送给 ipwho.is 获取大致位置；共享网络不代表同一 Wi-Fi 或实际靠近。打开地图时，OpenStreetMap 会收到地图瓦片请求。设备定位授权不会自动开启网络发现。

5. 撤回与安全。选择“关闭”或“不允许”会移除已保存坐标、清除本次位置并停用网络发现，普通私信仍可使用。未满 18 岁请在监护人知情下使用，沟通留在站内，勿公开精确见面地点。`,
    'loc.privacy': '附近地图使用近似图钉和舍入距离，请勿分享家庭或学校的精确位置。',
    'picker.help': '请选择大致区域，避免家庭或学校；已保存图钉可能以约 1 公里精度向其他成员展示。',
    'loc.desktopHint': '浏览器可能使用 GPS、Wi-Fi 或网络估算；也可在地图上选择大致区域。',
  },
  ja: {
    'location.networkTitle': 'ネットワーク検索を許可',
    'location.networkDescription': '任意：公開ネットワークアドレスのハッシュで照合し、概算位置のため公開IPをipwho.isに送ります。同じネットワークでも近いとは限りません。メッセージ画面で解除できます。',
    'chat.wifiShort': '任意のネットワーク照合 · 詳細',
    'chat.sameWifi': '共通の公開ネットワーク',
    'chat.wifiNote': '双方がプロフィール設定でネットワーク検索を許可した場合に照合します。VPNや通信事業者の共有もあり、同じWi-Fiや近さの証明ではありません。端末の位置や手動ピンも推定です。',
    'home.peopleAroundHint': '共有位置、同意済みのネットワーク照合、掲示板を通じてメンバーを探せます。',
    'location.close': '閉じる', 'location.failed': '位置情報の設定を保存できませんでした。再試行してください。', 'location.saving': '設定を保存中…',
    'consent.session': '今回の訪問のみ', 'consent.sessionDesc': '開いているアプリで一覧を並べ替えるためだけに使用。プロフィールや自分のピンには保存せず、再読み込みや終了で解除されます。',
    'consent.alwaysDesc': 'オフにするまで保存。端末の位置は次回更新されることがありますが、手動のピンは動きません。',
    'consent.agreement': `1. 目的と選択。端末の位置または手動のピンは任意で、近くのメンバーの検索に使います。今回のみか、オフにするまで保存かを選べます。拒否してもアプリ内メッセージは利用できます。

2. データ。座標は使用前に小数点以下3桁（約100m）に丸めます。今回のみの位置はアプリのメモリに置き、一覧の並べ替えのためにサーバーへ送信しますが、プロフィールや自分のピンには保存しません。保存する位置には取得元、時刻、取得可能な端末精度が含まれます。測位はGPS、Wi-Fi、ネットワーク推定を使う場合があり、手動のピンは未確認です。

3. 表示。近くの機能では丸めた距離と小数点以下2桁（約1km）の保存済みピンを返します。概算の格子であり匿名性の保証ではありません。自宅や学校を正確に指定しないでください。

4. ネットワークと地図。ネットワーク検索はプロフィール設定で別途許可します。有効な場合、公開ネットワークアドレスのハッシュを照合用に保存し、概算位置のため公開IPをipwho.isに送信する場合があります。同じネットワークは同じWi-Fiや近接を証明しません。地図を開くとOpenStreetMapにタイル要求が送られます。端末の許可ではネットワーク検索は有効になりません。

5. 撤回と安全。「オフにする」「許可しない」で保存座標と今回の位置を消去し、ネットワーク検索を無効にします。メッセージは継続利用できます。18歳未満は保護者の了解のもと利用し、連絡はアプリ内で行い、正確な待ち合わせ場所を公開しないでください。`,
    'loc.privacy': '地図のピンと距離は概算です。自宅や学校の正確な場所を共有しないでください。',
    'picker.help': '自宅や学校ではなく、おおよその地域を選んでください。保存したピンは約1kmの精度で他のメンバーに表示される場合があります。',
    'loc.desktopHint': 'ブラウザはGPS、Wi-Fi、ネットワーク推定を使う場合があります。地図でおおよその地域も選べます。',
  },
  ko: {
    'location.networkTitle': '네트워크 기반 탐색 허용',
    'location.networkDescription': '선택 사항: 공용 네트워크 주소 해시로 매칭하고 대략적 위치를 위해 공용 IP를 ipwho.is에 전송합니다. 같은 네트워크가 가까움을 뜻하지는 않습니다. 메시지 화면에서 끌 수 있습니다.',
    'chat.wifiShort': '선택적 네트워크 매칭 · 자세히',
    'chat.sameWifi': '공유 공용 네트워크',
    'chat.wifiNote': '두 회원 모두 프로필 설정에서 네트워크 탐색을 켜야 매칭됩니다. VPN이나 통신사 공유일 수 있어 같은 Wi-Fi나 근접성을 보장하지 않습니다. 기기 위치와 수동 핀도 추정입니다.',
    'home.peopleAroundHint': '공유 위치, 동의한 네트워크 매칭 또는 커뮤니티 게시판을 통해 회원을 찾습니다.',
    'location.close': '닫기', 'location.failed': '위치 설정을 저장하지 못했습니다. 다시 시도하세요.', 'location.saving': '설정 저장 중…',
    'consent.session': '이번 방문만', 'consent.sessionDesc': '현재 열린 앱에서 목록 정렬에만 사용합니다. 프로필이나 내 핀으로 저장하지 않으며 새로고침 또는 종료 시 해제됩니다.',
    'consent.alwaysDesc': '직접 끌 때까지 저장합니다. 기기 위치는 다음 방문에 갱신될 수 있지만 수동 핀은 이동하지 않습니다.',
    'consent.agreement': `1. 목적과 선택. 기기 위치 또는 수동 지도 핀은 선택 사항이며 주변 회원 탐색에 사용됩니다. 이번 방문만 또는 끌 때까지 저장을 선택할 수 있습니다. 거부해도 앱 내 메시지는 사용할 수 있습니다.

2. 데이터. 좌표는 사용 전 소수점 셋째 자리(약 100m)로 반올림됩니다. 방문 전용 좌표는 앱 메모리에 있고 목록 정렬을 위해 서버로 전송되지만 프로필이나 내 핀으로 저장되지 않습니다. 저장 위치에는 출처, 수집 시각, 사용 가능한 기기 정확도가 포함됩니다. 브라우저는 GPS, Wi-Fi 또는 네트워크 추정을 사용할 수 있으며 수동 핀은 검증되지 않습니다.

3. 표시 범위. 주변 기능은 반올림된 거리와 소수점 둘째 자리(약 1km)의 저장된 핀을 반환합니다. 근사 격자이며 익명성을 보장하지 않습니다. 집이나 학교의 정확한 위치를 표시하지 마세요.

4. 네트워크와 지도. 네트워크 탐색은 프로필 설정의 별도 동의입니다. 활성화하면 공용 네트워크 주소의 해시를 매칭에 저장하며 대략적인 위치를 위해 공용 IP를 ipwho.is에 전송할 수 있습니다. 같은 네트워크라고 같은 Wi-Fi나 가까운 거리라는 뜻은 아닙니다. 지도를 열면 OpenStreetMap에 타일 요청이 전송됩니다. 기기 위치 동의는 네트워크 탐색을 켜지 않습니다.

5. 철회와 안전. '끄기' 또는 '허용 안 함'은 저장 좌표와 이번 위치를 지우고 네트워크 탐색을 끕니다. 메시지는 계속 이용할 수 있습니다. 18세 미만은 보호자가 알고 있는 상태에서 이용하고 연락은 앱 내에서 하며 정확한 만남 장소를 공개하지 마세요.`,
    'loc.privacy': '지도는 대략적인 핀과 반올림된 거리를 사용합니다. 집이나 학교의 정확한 위치를 공유하지 마세요.',
    'picker.help': '집이나 학교가 아닌 대략적인 지역을 선택하세요. 저장된 핀은 다른 회원에게 약 1km 정밀도로 표시될 수 있습니다.',
    'loc.desktopHint': '브라우저는 GPS, Wi-Fi 또는 네트워크 추정을 사용할 수 있습니다. 지도에서 대략적인 지역을 선택할 수도 있습니다.',
  },
  fr: {
    'location.networkTitle': 'Autoriser la découverte réseau',
    'location.networkDescription': 'Facultatif : comparer une empreinte réseau publique et envoyer votre IP publique à ipwho.is pour estimer la position. Un réseau commun ne prouve pas la proximité. Désactivation possible dans Messages.',
    'chat.wifiShort': 'Correspondance réseau facultative · détails',
    'chat.sameWifi': 'Réseau public partagé',
    'chat.wifiNote': 'Les deux membres doivent autoriser la découverte réseau dans leur profil. Un réseau public commun peut être un VPN ou un fournisseur partagé, pas le même Wi-Fi ni un lieu proche. Les positions et repères sont des estimations.',
    'home.peopleAroundHint': 'Découvrez des membres via les positions partagées, les correspondances réseau autorisées ou le tableau communautaire.',
    'location.close': 'Fermer', 'location.failed': 'Impossible de sauvegarder ce choix. Réessayez.', 'location.saving': 'Enregistrement du choix…',
    'consent.session': 'Cette visite uniquement', 'consent.sessionDesc': "Uniquement pour trier votre liste dans l’application ouverte, sans sauvegarde dans le profil ni partage de votre repère. Actualiser ou fermer met fin à ce choix.",
    'consent.alwaysDesc': "Conservé jusqu’à désactivation. La position de l’appareil peut être actualisée lors des visites suivantes ; les repères manuels restent fixes.",
    'consent.agreement': `1. Finalité et choix. La position de l’appareil ou un repère manuel sont facultatifs et servent à découvrir des membres proches. Choisissez cette visite ou une sauvegarde jusqu’à désactivation. Refuser ne bloque pas les messages internes.

2. Données. Les coordonnées sont arrondies à 3 décimales (environ 100 m) avant utilisation. Pour cette visite, elles restent en mémoire dans l’application et sont transmises au serveur pour trier votre liste, sans sauvegarde dans le profil ni partage de votre repère. Les positions sauvegardées incluent la source, la date et la précision disponible. Le navigateur peut utiliser GPS, Wi-Fi ou estimation réseau ; les repères manuels ne sont pas vérifiés.

3. Visibilité. La découverte renvoie des distances arrondies et des repères sauvegardés à 2 décimales (environ 1 km). Cette grille approximative ne garantit pas l’anonymat. Ne placez pas de repère précis à votre domicile ou école.

4. Réseau et cartes. La découverte réseau nécessite un accord distinct dans le profil. Si activée, une empreinte de l’adresse réseau publique est conservée pour les correspondances et l’IP publique peut être envoyée à ipwho.is pour une estimation. Un réseau partagé ne prouve ni un Wi-Fi commun ni une proximité réelle. OpenStreetMap reçoit les requêtes de tuiles quand vous ouvrez une carte. L’accord pour l’appareil n’active pas le réseau.

5. Retrait et sécurité. « Désactiver » ou « Ne pas autoriser » supprime les coordonnées sauvegardées, efface la position de visite et désactive la découverte réseau. Les messages restent disponibles. Les moins de 18 ans doivent en informer un parent ou tuteur, communiquer dans l’application et ne pas publier un lieu de rencontre exact.`,
    'loc.privacy': 'Les cartes utilisent des repères et distances approximatifs. Ne partagez pas votre domicile ou école précisément.',
    'picker.help': 'Choisissez une zone approximative, pas votre domicile ou école. Les repères sauvegardés peuvent être visibles à environ 1 km près.',
    'loc.desktopHint': 'Le navigateur peut utiliser GPS, Wi-Fi ou estimation réseau. Vous pouvez aussi choisir une zone approximative sur la carte.',
  },
  ru: {
    'location.networkTitle': 'Разрешить сетевой поиск',
    'location.networkDescription': 'Необязательно: сопоставлять хеш публичной сети и отправлять публичный IP в ipwho.is для оценки позиции. Общая сеть не означает близость. Отключение доступно в Сообщениях.',
    'chat.wifiShort': 'Необязательное сопоставление сети · подробнее',
    'chat.sameWifi': 'Общая публичная сеть',
    'chat.wifiNote': 'Оба участника должны включить сетевой поиск в настройках профиля. Общая публичная сеть может быть VPN или сетью провайдера, а не общим Wi-Fi или близким местом. Позиции устройства и ручные метки приблизительны.',
    'home.peopleAroundHint': 'Находите участников по опубликованной позиции, разрешённым сетевым совпадениям или доске сообщества.',
    'location.close': 'Закрыть', 'location.failed': 'Не удалось сохранить выбор. Повторите попытку.', 'location.saving': 'Сохранение выбора…',
    'consent.session': 'Только это посещение', 'consent.sessionDesc': 'Только для сортировки списка в открытом приложении, без сохранения в профиле или публикации вашей метки. Обновление или закрытие завершает выбор.',
    'consent.alwaysDesc': 'Сохраняется до отключения. Позиция устройства может обновляться при следующих посещениях; ручные метки не перемещаются.',
    'consent.agreement': `1. Цель и выбор. Позиция устройства или ручная метка необязательны и используются для поиска участников рядом. Выберите текущее посещение или сохранение до отключения. Отказ не мешает переписке внутри приложения.

2. Данные. Координаты округляются до 3 знаков (примерно 100 м) перед использованием. Временные координаты остаются в памяти приложения и передаются серверу для сортировки списка, но не сохраняются в профиле и не публикуются как ваша метка. Сохранённая позиция включает источник, время и доступную точность устройства. Браузер может использовать GPS, Wi-Fi или сетевую оценку; ручные метки не проверены.

3. Видимость. Поиск рядом возвращает округлённые расстояния и сохранённые метки до 2 знаков (примерно 1 км). Это приблизительная сетка, не гарантия анонимности. Не отмечайте точный адрес дома или школы.

4. Сеть и карты. Сетевой поиск требует отдельного согласия в настройке профиля. При включении хеш публичного сетевого адреса сохраняется для сопоставления, а публичный IP может отправляться ipwho.is для оценки позиции. Общая сеть не доказывает общий Wi-Fi или близость. При открытии карты OpenStreetMap получает запросы тайлов. Разрешение устройства не включает сетевой поиск.

5. Отзыв и безопасность. «Отключить» или «Не разрешать» удаляет сохранённые координаты, очищает временную позицию и отключает сетевой поиск. Переписка остаётся доступной. До 18 лет используйте функцию с ведома родителя или опекуна, общайтесь внутри приложения и не публикуйте точное место встречи.`,
    'loc.privacy': 'На карте приблизительные метки и округлённые расстояния. Не раскрывайте точное положение дома или школы.',
    'picker.help': 'Выберите приблизительный район, не дом или школу. Сохранённые метки могут показываться другим с точностью около 1 км.',
    'loc.desktopHint': 'Браузер может использовать GPS, Wi-Fi или сетевую оценку. Вместо этого можно выбрать приблизительный район на карте.',
  },
};