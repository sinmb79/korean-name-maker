# 무료 작명 도우미

출생신고용 아기 이름을 추천하고 풀이하는 무료 윈도우 앱입니다. 전통 성명학 요소와 현대 실용 기준을 함께 참고하되, 결과는 작명 참고 자료로만 제공합니다.

## 주요 기능

- 성, 성별, 태어난 년월일시분초, 이름 길이, 돌림자, 선호/제외 글자 입력
- 년주, 월주, 일주, 시주와 일간 기준 사주 오행 분포 계산
- 2023~2025년 출생신고 합산 인기 이름 TOP 10 제시
- 대법원 인명용 한자 기준 필터링 구조
- 자원오행, 한자 뜻, 수리사격, 음양, 발음오행 참고, 인기/희소성 점수화
- 후보별 이름 풀이, 복사, 텍스트 저장, 인쇄/PDF 출력
- Tauri + React + TypeScript + SQLite 기반 오프라인 실행

## 개발 실행

```powershell
npm install
npm run dev
```

## 윈도우 앱 실행

Rust가 설치되어 있어야 합니다.

```powershell
npm run tauri:dev
```

## 빌드

```powershell
npm run test
npm run build
npm run tauri:build
```

빌드 후 설치 파일은 `src-tauri/target/release/bundle/` 아래에 생성됩니다.

## 데이터

현재 저장소에는 앱 동작 검증용 기본 seed 데이터가 들어 있습니다. 공개 배포 전에는 `src/data/seed-data.json`의 `hanja` 항목을 공식 대법원 인명용 한자 전체 목록 기준 CSV/JSON으로 확장하면 됩니다. 앱 구조는 `hanja`, `syllable`, `name_popularity`, `bad_words`, `scoring_rules`, `calendar_cache` 테이블을 사용합니다.

## 주의

이 앱은 작명 참고 도구입니다. 출생신고 또는 개명 전에는 대법원 전자가족관계등록시스템의 인명용 한자 조회로 최종 확인해야 합니다.
