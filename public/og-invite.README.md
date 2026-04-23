# OG Invite image

`/invite/[token]` 페이지의 Open Graph 이미지. 현재 드롭된 파일:

- **경로**: `public/og-invite.jpg`
- **사이즈**: 1408×736 (비율 ~1.91:1, OG 표준 1200×630과 동일 ratio)
- **포맷**: JPG (Twitter `summary_large_image` / Threads / Discord 모두 지원)

바꾸고 싶으면 같은 파일명으로 덮어쓰면 됨 (코드 변경 불필요).
사이즈가 달라지면 `app/invite/[token]/page.tsx`의 `openGraph.images` width/height도 맞추자.

## 디자인 톤 (2026-04-18 현재)

- 배경: 선셋 피치톤 그라데이션 (#FFF5E1 → #FFD4B3) + 코랄 glow
- 상단: 🌅 반원 선셋 아이콘
- 헤드라인: **"You're invited to ChatDa"** / 또는 **"Find your people in Korea."**
- 서브: "Korea's international community"
- 하단: "Invite only · First 100 members"

페이지 본문(`ValidInvitePanel`)도 이 톤을 이어받음 — OG 이미지의 "확장판" 느낌.

## 검증

```bash
# 파일 존재 확인
curl -sI http://localhost:3000/og-invite.jpg | head -1   # 200

# 메타 태그 확인
curl -s http://localhost:3000/invite/INVALID | grep -oE 'og:image[^>]*content="[^"]*"'
```

OG debugger: https://www.opengraph.xyz/url/https%3A%2F%2Fchatda.life%2Finvite%2FTESTTOKEN
(prod 배포 후에만 외부 debugger로 미리보기 가능 — localhost 차단됨)
