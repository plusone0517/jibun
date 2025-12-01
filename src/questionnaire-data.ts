// 50 health questionnaire questions
export const questionnaireData = [
  // Sleep & Rest (睡眠・休養)
  { number: 1, text: '1日の平均睡眠時間は？', category: 'sleep', options: ['4時間未満', '4-5時間', '6-7時間', '8時間以上'] },
  { number: 2, text: '睡眠の質は良好ですか？', category: 'sleep', options: ['とても良い', 'まあまあ良い', 'あまり良くない', '悪い'] },
  { number: 3, text: '寝つきの良さは？', category: 'sleep', options: ['すぐ眠れる', '30分以内', '1時間以上', 'なかなか眠れない'] },
  { number: 4, text: '夜中に目が覚めることは？', category: 'sleep', options: ['ほとんどない', '週1-2回', '週3-4回', 'ほぼ毎日'] },
  { number: 5, text: '朝の目覚めの状態は？', category: 'sleep', options: ['すっきり', 'まあまあ', 'だるい', 'とてもだるい'] },

  // Diet & Nutrition (食事・栄養)
  { number: 6, text: '朝食を食べる頻度は？', category: 'diet', options: ['毎日', '週5-6回', '週2-4回', 'ほとんど食べない'] },
  { number: 7, text: '1日3食規則正しく食べていますか？', category: 'diet', options: ['はい', 'だいたい', 'あまり', 'いいえ'] },
  { number: 8, text: '野菜を1日どのくらい食べますか？', category: 'diet', options: ['350g以上', '200-350g', '100-200g', '100g未満'] },
  { number: 9, text: '果物を食べる頻度は？', category: 'diet', options: ['毎日', '週3-4回', '週1-2回', 'ほとんど食べない'] },
  { number: 10, text: '魚を食べる頻度は？', category: 'diet', options: ['週4回以上', '週2-3回', '週1回', 'ほとんど食べない'] },
  { number: 11, text: '肉類を食べる頻度は？', category: 'diet', options: ['毎日', '週3-4回', '週1-2回', 'ほとんど食べない'] },
  { number: 12, text: '外食やコンビニ食の頻度は？', category: 'diet', options: ['週1回未満', '週2-3回', '週4-5回', 'ほぼ毎日'] },
  { number: 13, text: '間食する頻度は？', category: 'diet', options: ['しない', '週1-2回', '週3-4回', 'ほぼ毎日'] },
  { number: 14, text: '甘いものを食べる頻度は？', category: 'diet', options: ['ほとんど食べない', '週1-2回', '週3-4回', 'ほぼ毎日'] },
  { number: 15, text: '塩分の摂り過ぎに注意していますか？', category: 'diet', options: ['とても注意', 'まあまあ', 'あまり', '全く'] },

  // Exercise & Activity (運動・活動)
  { number: 16, text: '1週間に運動する頻度は？', category: 'exercise', options: ['週4回以上', '週2-3回', '週1回', 'ほとんどしない'] },
  { number: 17, text: '1回の運動時間は？', category: 'exercise', options: ['60分以上', '30-60分', '15-30分', '15分未満'] },
  { number: 18, text: '運動の強度は？', category: 'exercise', options: ['激しい', '中程度', '軽い', 'ほとんどしない'] },
  { number: 19, text: '日常的に歩く時間は？', category: 'exercise', options: ['1時間以上', '30-60分', '15-30分', '15分未満'] },
  { number: 20, text: '階段を使う頻度は？', category: 'exercise', options: ['常に使う', 'よく使う', 'たまに', 'ほとんど使わない'] },

  // Stress & Mental Health (ストレス・メンタル)
  { number: 21, text: 'ストレスを感じる頻度は？', category: 'stress', options: ['ほとんどない', 'たまに', 'よくある', '常にある'] },
  { number: 22, text: 'ストレス解消法を持っていますか？', category: 'stress', options: ['複数ある', '1つある', 'あまりない', 'ない'] },
  { number: 23, text: '気分が落ち込むことは？', category: 'stress', options: ['ほとんどない', 'たまに', 'よくある', 'ほぼ毎日'] },
  { number: 24, text: '不安を感じることは？', category: 'stress', options: ['ほとんどない', 'たまに', 'よくある', 'ほぼ毎日'] },
  { number: 25, text: 'リラックスする時間はありますか？', category: 'stress', options: ['毎日ある', '週数回', 'たまに', 'ほとんどない'] },

  // Lifestyle Habits (生活習慣)
  { number: 26, text: '喫煙していますか？', category: 'lifestyle', options: ['吸わない', '以前吸っていた', '時々吸う', '毎日吸う'] },
  { number: 27, text: '飲酒の頻度は？', category: 'lifestyle', options: ['飲まない', '月1-3回', '週1-3回', 'ほぼ毎日'] },
  { number: 28, text: '1回の飲酒量は？', category: 'lifestyle', options: ['飲まない', '適量', '多め', 'かなり多い'] },
  { number: 29, text: '入浴の頻度は？', category: 'lifestyle', options: ['毎日', '週5-6回', '週2-4回', 'ほとんどしない'] },
  { number: 30, text: '入浴方法は？', category: 'lifestyle', options: ['湯船に浸かる', 'ほぼ湯船', 'ほぼシャワー', 'シャワーのみ'] },

  // Work & Daily Life (仕事・日常)
  { number: 31, text: '1日の労働時間は？', category: 'work', options: ['8時間未満', '8-9時間', '10-11時間', '12時間以上'] },
  { number: 32, text: '仕事での身体的負担は？', category: 'work', options: ['少ない', 'やや少ない', 'やや多い', 'とても多い'] },
  { number: 33, text: '仕事での精神的負担は？', category: 'work', options: ['少ない', 'やや少ない', 'やや多い', 'とても多い'] },
  { number: 34, text: '通勤時間は片道何分？', category: 'work', options: ['30分未満', '30-60分', '60-90分', '90分以上'] },
  { number: 35, text: '休日は十分にありますか？', category: 'work', options: ['十分ある', 'まあまあ', '少ない', 'ほとんどない'] },

  // Physical Symptoms (身体症状)
  { number: 36, text: '肩こりや腰痛は？', category: 'symptoms', options: ['ほとんどない', 'たまにある', 'よくある', 'いつもある'] },
  { number: 37, text: '頭痛の頻度は？', category: 'symptoms', options: ['ほとんどない', '月1-2回', '週1-2回', '週3回以上'] },
  { number: 38, text: '目の疲れは？', category: 'symptoms', options: ['ほとんどない', 'たまに', 'よくある', 'いつもある'] },
  { number: 39, text: '疲れやすいですか？', category: 'symptoms', options: ['いいえ', 'あまり', 'やや', 'とても'] },
  { number: 40, text: '体のだるさを感じますか？', category: 'symptoms', options: ['ほとんどない', 'たまに', 'よくある', 'ほぼ毎日'] },

  // Medical History (既往歴・家族歴)
  { number: 41, text: '高血圧の指摘を受けたことは？', category: 'medical', options: ['ない', '以前あった', '現在治療中', '放置している'] },
  { number: 42, text: '糖尿病の指摘を受けたことは？', category: 'medical', options: ['ない', '以前あった', '現在治療中', '放置している'] },
  { number: 43, text: '脂質異常症の指摘を受けたことは？', category: 'medical', options: ['ない', '以前あった', '現在治療中', '放置している'] },
  { number: 44, text: '肝機能異常の指摘を受けたことは？', category: 'medical', options: ['ない', '以前あった', '現在治療中', '放置している'] },
  { number: 45, text: '家族に高血圧の人はいますか？', category: 'family', options: ['いない', '1人', '2人', '3人以上'] },
  { number: 46, text: '家族に糖尿病の人はいますか？', category: 'family', options: ['いない', '1人', '2人', '3人以上'] },
  { number: 47, text: '家族に脳卒中・心筋梗塞の人は？', category: 'family', options: ['いない', '1人', '2人', '3人以上'] },
  { number: 48, text: '家族にがんの人はいますか？', category: 'family', options: ['いない', '1人', '2人', '3人以上'] },
  { number: 49, text: '現在服用している薬は？', category: 'medical', options: ['なし', '1-2種類', '3-4種類', '5種類以上'] },
  { number: 50, text: 'サプリメントを飲んでいますか？', category: 'medical', options: ['飲んでいない', '1-2種類', '3-4種類', '5種類以上'] }
]
