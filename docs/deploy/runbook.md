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

### prod DB (`chatda`)에 마이그레이션 적용
```bash
cd /home/dykim/project/ChatDa
DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda npm run db:migrate
```

### dev DB (`chatda_dev`)
```bash
DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda_dev npm run db:migrate
```

### 마이그레이션 파일 생성 (스키마 변경 후)
```bash
npm run db:generate
# drizzle/NNNN_*.sql 파일 생성됨 → 검토 후 git commit
```

### 마이그레이션 이력 확인
```bash
PGPASSWORD=chatda psql -h localhost -p 5434 -U chatda -d chatda \
  -c "SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;"
```

---

## 6. DB 백업 / 복원

### 수동 백업
```bash
BACKUP_FILE="chatda-backup-$(date +%F-%H%M).sql"
docker exec chatda-db-1 pg_dump -U chatda chatda > ~/$BACKUP_FILE
ls -lh ~/$BACKUP_FILE
```

### 복원
```bash
cat ~/chatda-backup-YYYY-MM-DD-HHMM.sql | docker exec -i chatda-db-1 psql -U chatda chatda
```

### 자동 백업 크론 (권장)
```bash
# crontab -e
0 4 * * * docker exec chatda-db-1 pg_dump -U chatda chatda | gzip > /home/dykim/backups/chatda-$(date +\%F).sql.gz
```

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
DATABASE_URL=postgresql://chatda:chatda@localhost:5434/chatda_dev npx tsx scripts/seed.ts
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

## 11. 긴급 상황

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

## 12. 모니터링 (현재 없음, 향후 추가)

- [ ] UptimeRobot / BetterStack 무료로 `https://chatda.life/` 5분 간격 체크
- [ ] Sentry로 에러 모니터링
- [ ] Cloudflare Analytics (Dashboard → Analytics)
