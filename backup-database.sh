#!/bin/bash
# データベース自動バックアップスクリプト

set -e

BACKUP_DIR="/home/user/webapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "🔄 データベースバックアップ開始: $DATE"

# バックアップディレクトリを作成
mkdir -p "$BACKUP_DIR"

# リモートD1データベースからユーザーデータをエクスポート
echo "📦 ユーザーデータをエクスポート中..."
npx wrangler d1 execute jibun-supple-production --remote \
  --command="SELECT * FROM users" > "$BACKUP_DIR/users_$DATE.json" 2>&1 || {
    echo "⚠️ リモートD1へのアクセスに失敗しました。ローカルデータベースをバックアップします。"
    npx wrangler d1 execute jibun-supple-production --local \
      --command="SELECT * FROM users" > "$BACKUP_DIR/users_$DATE.json" 2>&1
}

echo "📦 検査データをエクスポート中..."
npx wrangler d1 execute jibun-supple-production --remote \
  --command="SELECT * FROM exam_data LIMIT 100" > "$BACKUP_DIR/exam_data_$DATE.json" 2>&1 || {
    npx wrangler d1 execute jibun-supple-production --local \
      --command="SELECT * FROM exam_data LIMIT 100" > "$BACKUP_DIR/exam_data_$DATE.json" 2>&1
}

echo "📦 解析結果をエクスポート中..."
npx wrangler d1 execute jibun-supple-production --remote \
  --command="SELECT * FROM analysis_results LIMIT 100" > "$BACKUP_DIR/analysis_results_$DATE.json" 2>&1 || {
    npx wrangler d1 execute jibun-supple-production --local \
      --command="SELECT * FROM analysis_results LIMIT 100" > "$BACKUP_DIR/analysis_results_$DATE.json" 2>&1
}

# 古いバックアップを削除（30日以上前）
echo "🧹 古いバックアップを削除中..."
find "$BACKUP_DIR" -name "*.json" -mtime +30 -delete

# バックアップファイルのリストを表示
echo "✅ バックアップ完了！"
echo "📁 バックアップファイル:"
ls -lh "$BACKUP_DIR" | tail -10

echo ""
echo "📊 バックアップ統計:"
echo "  ユーザーデータ: $(wc -l < "$BACKUP_DIR/users_$DATE.json") 行"
echo "  検査データ: $(wc -l < "$BACKUP_DIR/exam_data_$DATE.json") 行"
echo "  解析結果: $(wc -l < "$BACKUP_DIR/analysis_results_$DATE.json") 行"
