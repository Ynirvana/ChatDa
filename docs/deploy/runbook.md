# 운영 매뉴얼 (Runbook)

실행 위치: `/home/dykim/project/ChatDa` (모든 명령 이 디렉토리 기준)

## 1. 서비스 기동 / 중단

### Prod 전체 기동
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Prod 중단 (볼륨은 유지)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Prod 재시작 (설정 변경 없이 컨테이너만 재시작)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart
```

### 특정 서비스만
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart app
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Cloudflared 터널
```bash
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
sudo systemctl stop cloudflared
```

---

## 2. 로그

### 전체 컨테이너 로그 (실시간)
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

### 특정 서비스만
```bash
docker logs chatda-app -f           # Next.js
docker logs chatda-backend -f       # FastAPI
docker logs chatda-db-1 -f          # Postgres
```

### 최근 100줄만
```bash
docker logs chatda-app --tail 100
```

### Cloudflared 로그
```bash
sudo journalctl -u cloudflared -f
sudo journalctl -u cloudflared --since "10 min ago"
```

---

## 3. 상태 체크

### 컨테이너 건강 상태
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

### 포트 리스너 확인
```bash
ss -ltn | grep -E ':(3001|8000|5434|8002)'
```

### 외부 접속 테스트
```bash
curl -I https://chatda.life/
curl -I https://chatda.life/api/auth/providers
```

### DB 접속 테스트 (호스트에서)
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda -c "SELECT count(*) FROM users;"
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda_dev -c "SELECT count(*) FROM users;"
```

---

## 4. 코드 업데이트 배포

### 변경사항 반영 (rebuild + restart)
```bash
cd /home/dykim/project/ChatDa
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### 백엔드만 rebuild
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build backend
```

### 프론트엔드만 rebuild
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build app
```

### 빌드 캐시 무시하고 강제 rebuild
```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 5. DB 마이그레이션

⚠️ **항상 dev 먼저 → 확인 → prod** 순서. `db:migrate`는 이제 `chatda_dev`를 기본 타깃으로 함.

### 1) 스키마 변경 → 마이그레이션 파일 생성
```bash
npm run db:generate
# drizzle/NNNN_*.sql 파일 생성됨 → SQL 직접 열어서 검토 후 git commit
```

### 2) dev DB (`chatda_dev`) 먼저 적용
```bash
npm run db:migrate
```

### 3) prod DB (`chatda`) 적용 — 확인 프롬프트 있는 전용 스크립트
```bash
npm run db:migrate:prod
# → "Type 'APPLY' to continue" 프롬프트. 오타 한 번에 abort됨.
# → 내부적으로 scripts/migrate-prod.sh 가 prod URL로 drizzle-kit migrate 호출
```

**권장 순서:**
1. 배포 전에 `scripts/backup-db.sh`로 prod 백업
2. `npm run db:migrate` (dev)
3. 변경 검증 (`psql -d chatda_dev ...`)
4. `npm run db:migrate:prod`
5. 컨테이너 rebuild (§4)

### 마이그레이션 이력 확인
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda \
  -c "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;"
```

---

## 6. DB 백업 / 복원

### 수동 백업 (즉석)
```bash
/home/dykim/project/ChatDa/scripts/backup-db.sh
# → /home/dykim/chatda-backups/chatda-<date>.sql.gz
```

### 복원
```bash
gunzip -c /home/dykim/chatda-backups/chatda-YYYY-MM-DD-HHMM.sql.gz | \
  docker exec -i chatda-db-1 psql -U chatda chatda
```

### 자동 백업 크론 (권장)
```bash
# crontab -e 편집 후 아래 줄 추가 (매일 04:00 KST)
0 4 * * * /home/dykim/project/ChatDa/scripts/backup-db.sh
```
스크립트 동작: gzip 무결성 검증 + 30일 retention + backup.log 기록. 상세는 [`security-followup.md §1`](security-followup.md#1-️-자동-db-백업-cron-등록-즉시) 참조.

---

## 7. Cloudflared config 수정

### ingress 추가/수정 절차
```bash
# 1. 백업
sudo cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.bak.$(date +%s)

# 2. 편집
sudo nano /etc/cloudflared/config.yml

# 3. syntax 검증 (optional)
cloudflared tunnel ingress validate

# 4. 터널 재시작
sudo systemctl restart cloudflared
sudo systemctl status cloudflared
```

### `~/.cloudflared/config.yml`도 동기화 (수동)
```bash
sudo cp /etc/cloudflared/config.yml ~/.cloudflared/config.yml
sudo chown dykim:dykim ~/.cloudflared/config.yml
```

### 새 도메인 DNS 라우팅 (chatda.life zone 내 서브도메인)
```bash
cloudflared tunnel route dns 8dca3205-b12c-43cf-8a76-7753048fe927 sub.chatda.life
```

⚠️ chatda.life **외 다른 zone**에 라우팅하려면 `cloudflared tunnel login`으로 cert.pem 재발급 필요 (현재 cert는 chatcity.io 존에 붙어있음).

---

## 8. 환경변수 회전

### `NEXTAUTH_SECRET` 교체 (6개월마다 권장)

```bash
NEW_SECRET=$(openssl rand -base64 32)
echo "새 시크릿: $NEW_SECRET"

# 두 파일 동시에 업데이트 (frontend/backend)
sed -i "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$NEW_SECRET|" \
  /home/dykim/project/ChatDa/.env.production.local \
  /home/dykim/project/ChatDa/backend/.env.production

# 두 서비스 동시 재시작 (키 불일치 순간 최소화)
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart backend app
```

→ 모든 사용자 재로그인 필요 (기존 JWT 무효).

---

## 9. 롤백

### 코드 롤백 (git)
```bash
cd /home/dykim/project/ChatDa
git log --oneline -10                            # 이전 커밋 확인
git checkout <이전-커밋-SHA>
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

복구 후 main 브랜치로 돌아가려면:
```bash
git checkout main
```

### DB 롤백
1. 마이그레이션 0011 이전 스키마로 돌아가야 한다면:
   - 드리즐은 **down migration을 자동 생성 안 함** → 수동 SQL 필요
   - 권장: 위 7번 백업에서 복원

### Cloudflared 설정 롤백
```bash
# /etc/cloudflared/config.yml.bak.* 중 원하는 걸로 복원
ls /etc/cloudflared/*.bak.*
sudo cp /etc/cloudflared/config.yml.bak.XXXXX /etc/cloudflared/config.yml
sudo systemctl restart cloudflared
```

---

## 10. 시드 / 테스트 데이터

### 시드 실행 (주의: 기존 데이터에 추가됨)
```bash
# dev DB — 안전, 테스트용
npm run db:seed

# prod DB — 거의 쓸 일 없음. 의도적으로 명시적 스크립트.
npm run db:seed:prod
```

### prod 데이터 정리 (테스트 유저 제거)
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda <<'SQL'
DELETE FROM users WHERE email IN ('jun@chatda.test', 'alex@chatda.test');
DELETE FROM events WHERE title ~ 'ㅇㅇㅇ|test|테스트';
SQL
```

### 특정 유저 외 전부 삭제
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda \
  -c "DELETE FROM users WHERE email != 'YOUR@EMAIL.COM';"
```

---

## 11. 관리자 (모더레이션)

### Admin 활성화 / 추가
`.env.production.local` + `backend/.env.production` 양쪽에 동일한 값으로:
```
ADMIN_EMAILS=first@example.com,second@example.com
```
변경 후 두 컨테이너 환경변수 반영:
```bash
cd /home/dykim/project/ChatDa
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```
(rebuild 불필요, env만 재주입하면 됨)

### UI 사용
- https://chatda.life/admin 접속 (Admin만 보임. Nav 드롭다운에도 링크 노출)
- 탭: Posts / Comments / Memories / Users / Events
- 각 항목 오른쪽 Delete 버튼 — 확인 후 즉시 삭제

### API로 직접 (긴급 시 curl)
세션 쿠키로 직접 호출 가능. 또는 DB 직접:
```bash
docker exec -it chatda-db-1 psql -U chatda chatda

# 악성 게시글 1건 삭제
DELETE FROM posts WHERE id = 'abc123';

# 악성 유저 전부 삭제 (cascade 수동)
BEGIN;
DELETE FROM event_memories WHERE user_id = 'xxx';
DELETE FROM post_comments WHERE user_id = 'xxx';
DELETE FROM post_likes   WHERE user_id = 'xxx';
DELETE FROM posts        WHERE user_id = 'xxx';
DELETE FROM rsvps        WHERE user_id = 'xxx';
DELETE FROM social_links WHERE user_id = 'xxx';
DELETE FROM events       WHERE host_id = 'xxx';
DELETE FROM users        WHERE id = 'xxx';
COMMIT;
```

### Admin 권한 취소
`ADMIN_EMAILS`에서 해당 이메일 제거 → 컨테이너 재시작 → 즉시 권한 상실.

---

## 12. 긴급 상황

### `https://chatda.life` 502
1. 컨테이너 살아있는지: `docker compose -f docker-compose.yml -f docker-compose.prod.yml ps`
2. 포트 3001 리스닝 확인: `ss -ltn | grep 3001`
3. 로컬 직접 테스트: `curl -I http://localhost:3001/`
4. 컨테이너 로그: `docker logs chatda-app --tail 50`
5. 컨테이너 죽어있으면: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`

### 로그인은 되는데 API가 401
→ Frontend/Backend `NEXTAUTH_SECRET` 불일치. 양쪽 `.env.production.local` / `backend/.env.production` 확인.

### `UntrustedHost` 에러
→ `lib/auth.ts`에 `trustHost: true` 있는지 확인.

### Cloudflared 계속 죽음
```bash
sudo journalctl -u cloudflared --since "10 min ago"
# config.yml syntax 오류면 롤백 (9번)
```

### 디스크 풀
```bash
docker system df
docker image prune -a        # 사용 안 하는 이미지
docker volume prune          # 사용 안 하는 볼륨 (⚠️ DB 볼륨 날리지 않게 주의)
```

### 터널만 끊고 사이트 내리기 (점검 모드)
```bash
sudo systemctl stop cloudflared
# 점검 후
sudo systemctl start cloudflared
```

---

## 13. 모니터링 (현재 없음, 향후 추가)

- [ ] UptimeRobot / BetterStack 무료로 `https://chatda.life/` 5분 간격 체크
- [ ] Sentry로 에러 모니터링
- [ ] Cloudflare Analytics (Dashboard → Analytics)
