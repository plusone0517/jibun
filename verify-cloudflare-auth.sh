#!/bin/bash
# Cloudflare認証確認スクリプト

echo "=========================================="
echo "Cloudflare認証確認"
echo "=========================================="
echo ""

cd /home/user/webapp

# setup_cloudflare_api_key ツールを使用して環境変数を設定
echo "📋 Step 1: 環境変数確認"
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN が設定されていません"
    echo ""
    echo "設定方法:"
    echo "1. 左サイドバーの「Deploy」タブを開く"
    echo "2. Cloudflare API Tokenを入力して保存"
    echo "3. このスクリプトを再実行"
    exit 1
else
    echo "✅ CLOUDFLARE_API_TOKEN が設定されています"
    echo "トークン長: ${#CLOUDFLARE_API_TOKEN} 文字"
fi
echo ""

# 認証テスト
echo "📋 Step 2: 認証テスト"
if npx wrangler whoami; then
    echo ""
    echo "=========================================="
    echo "✅ 認証成功！"
    echo "=========================================="
    echo ""
    echo "次のステップ:"
    echo "  npm run deploy"
    exit 0
else
    echo ""
    echo "=========================================="
    echo "❌ 認証失敗"
    echo "=========================================="
    echo ""
    echo "トラブルシューティング:"
    echo "1. トークンが正しいか確認"
    echo "2. トークンの権限を確認（Edit Cloudflare Workers）"
    echo "3. Deploy タブで再設定"
    exit 1
fi
