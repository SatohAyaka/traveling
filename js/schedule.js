// 🔒 1. ログインチェック（未ログインなら弾く）
if (sessionStorage.getItem('isLoggedIn') !== 'true') {
    alert('ログインが必要です。最初からやり直してください。');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    // 表示中のページから「何日目（数値）」かを判定
    const path = window.location.pathname;
    const pageName = path.split("/").pop().replace(".html", "") || "day1";
    const currentDay = pageName.match(/\d+/) ? pageName.match(/\d+/)[0] : "1";

    // 💡 2つのCSVを同時に読み込む
    Promise.all([
        fetchCSV('../csv/transports.csv'),
        fetchCSV('../csv/events.csv')
    ])
        .then(([transportData, eventData]) => {
            // 今の日付のデータだけに絞り込む
            const filteredTransports = transportData.filter(row => row.day === currentDay);
            const filteredEvents = eventData.filter(row => row.day === currentDay);

            // 1. イベント詳細メモの流し込み
            filteredEvents.forEach(row => {
                const card = document.querySelector(`.card[data-id="${row.id}"]`);
                if (card) {
                    const memoTextElement = card.querySelector('.memo-text');
                    if (memoTextElement) {
                        memoTextElement.innerHTML = row.memo ? row.memo : '詳細はありません。';
                    }
                }
            });

            // まだ読み込まれていないカードの「Loading...」をクリア
            document.querySelectorAll('.memo-text').forEach(el => {
                if (el.textContent === 'Loading...') {
                    el.textContent = '詳細はありません。';
                }
            });

            // 2. 移動カードの動的挿入
            filteredTransports.forEach(row => {
                // 挿入先となるカード（例: d1-01）を探す
                const targetCard = document.querySelector(`.card[data-id="${row.insert_after}"]`);
                if (targetCard) {
                    const transportCard = document.createElement('div');
                    // CSVに登録されたルートをクラスに付与（例: route-a route-b）
                    transportCard.className = `card ${row.route} card-transport`;

                    transportCard.innerHTML = `
                    <div class="card-content-transport">
                        <div class="transport-info">
                            <span class="transport-title">${row.title}</span>
                            <span class="transport-duration">（${row.duration}）</span>
                            <p class="transport-desc">${row.description}</p>
                        </div>
                    </div>
                `;
                    // 対象のカードのすぐ後ろ（弟要素）に挿入する
                    targetCard.parentNode.insertBefore(transportCard, targetCard.nextSibling);
                }
            });

            // 3. すべて流し込み・挿入が終わったら、タブやアコーディオンを初期化
            initTabsAndAccordions();
        })
        .catch(error => {
            console.error("CSVファイルの読み込み、またはパースに失敗しました:", error);
            document.querySelectorAll('.memo-text').forEach(el => {
                el.textContent = '詳細の読み込みに失敗しました（電波の良いところで再度お試しください）';
            });
            // 失敗してもタブとアコーディオンだけは動くようにセーフティ実行
            initTabsAndAccordions();
        });
});

// CSVをパースしてオブジェクトの配列にする関数
async function fetchCSV(url) {
    const response = await fetch(url);
    if (!response.ok) return [];

    const text = await response.text();
    const lines = text.replace(/\r\n/g, '\n').split('\n').map(line => line.trim()).filter(line => line !== "");
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index] ? values[index].trim() : '';
        });
        return obj;
    });
}

// タブ切り替えとアコーディオンの処理を初期化する関数
function initTabsAndAccordions() {
    const tabs = document.querySelectorAll('.route-tab');
    const cards = document.querySelectorAll('.card');

    // ----------------------------------------------------
    // 機能A: 分岐プラン（タブ）の切り替え処理
    // ----------------------------------------------------
    if (tabs.length > 0) {
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const targetRoute = tab.getAttribute('data-target'); // "route-a" または "route-b"

                // すべてのカードを再取得（新しく挿入された移動カードも含めるため）
                const allCards = document.querySelectorAll('.card');
                allCards.forEach(card => {
                    if (card.classList.contains(targetRoute)) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // 最初のロード時に「現在アクティブなタブ」の表示に合わせて初期化
        const activeTab = document.querySelector('.route-tab.active');
        if (activeTab) {
            activeTab.click();
        }
    }

    // ----------------------------------------------------
    // 機能B: タップ開閉（アコーディオン）処理
    // ----------------------------------------------------
    cards.forEach(card => {
        // イベントカードかつ、詳細メモがあるもの（デフォルトの Loading... や詳細なしを除く）だけ開閉可能に
        if (!card.classList.contains('card-transport')) {
            const header = card.querySelector('.card-header');
            const memoText = card.querySelector('.memo-text');

            if (header && memoText && memoText.textContent !== '詳細はありません。') {
                header.style.cursor = 'pointer';

                // 重複登録を避けるため、一度クリックイベントをクリアしてから登録（または一度だけ登録）
                header.onclick = () => {
                    card.classList.toggle('active');
                };
            }
        }
    });
}