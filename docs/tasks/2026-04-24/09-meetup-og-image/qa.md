# QA: Meetup OG image auto-generation

## Auto

```bash
npx tsc --noEmit
# curl test
curl -s -o /dev/null -w "%{http_code} %{content_type}" "https://chatda.life/meetups/04hOO5CDBFwkmO5-NAV3V/opengraph-image"
```

| Check | Expected | Result |
|---|---|---|
| TypeScript | 0 errors | ✅ |
| OG image endpoint | 200 image/png | ✅ |

**Auto result: PASS**

## Manual (Human)

- [ ] 밋업 링크를 카카오톡/iMessage에 공유했을 때 브랜드 이미지 미리보기가 나옴
- [ ] 이미지에 이모지 없이 제목, 날짜·시간·장소, 참가비·잔여석, Hosted by, chatda.life 표시됨
- [ ] 제목이 길 때(40자 이상) 폰트 크기가 줄어들어 잘리지 않음
- [ ] 이벤트가 없는 ID로 접근해도 500 아닌 fallback 이미지 반환됨

**Manual result:** Pending

---

## Summary *(fill in when DONE)*

**What:**
**How:**
**Key files:**
- `app/meetups/[id]/opengraph-image.tsx`
- `app/meetups/[id]/page.tsx` (generateMetadata 업데이트)
- `public/fonts/Inter-Bold.woff`
- `public/fonts/Inter-Regular.woff`
**Key decisions:**
-
