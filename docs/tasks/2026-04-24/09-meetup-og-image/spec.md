# Spec: Meetup OG image auto-generation

**Goal:** Every meetup share link shows a branded preview image automatically — no action from host.

**Scope:**
- In: `app/meetups/[id]/opengraph-image.tsx` using `next/og` ImageResponse, update `generateMetadata` to always use this image, download Inter font to `public/fonts/`
- Out: attendee/host profile photos in image (base64 complexity), custom upload

**Template (1200×630):**
- Background: ChatDa gradient (#FF6B5B → #E84393)
- Top-left: "ChatDa" wordmark
- Center: event title (large, bold, white), date · time · area, fee · spots left
- Bottom: "Hosted by [name]" left, "chatda.life" right

**Completion criteria:**
- [ ] Sharing `chatda.life/meetups/[id]` on KakaoTalk/iMessage shows branded image
- [ ] No emojis — clean typography only
- [ ] Falls back gracefully if event fetch fails
- [ ] TypeScript: 0 errors
