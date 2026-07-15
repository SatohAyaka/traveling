// js/login.js

document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const password = document.getElementById('passwordInput').value;

    // 🔒 設定したい合言葉（例：nagoya2026）
    if (password === 'tada' || password == 's.ayaka') {
        // ログイン成功フラグをセッションに保存
        sessionStorage.setItem('isLoggedIn', 'true');

        // 🗓️ 旅行当日の日付に応じて、自動的にその日のページへジャンプする処理
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // 0~11なので+1
        const date = today.getDate();

        if (year === 2026 && month === 7 && date <= 18) {
            window.location.href = 'day1.html';
        } else if (year === 2026 && month === 7 && date === 19) {
            window.location.href = 'day2.html';
        } else if (year === 2026 && month === 7 && date === 20) {
            window.location.href = 'day3.html';
        }
    } else {
        alert('パスワードが違います！');
    }
});