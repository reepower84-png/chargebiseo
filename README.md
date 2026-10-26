# 충전비서

전기차 월 주행거리와 자주 가는 충전소를 넣으면, 회원가·비회원가·출력별 단가·카드 할인을 합쳐 가장 싼 충전 멤버십과 카드 조합을 계산하는 웹앱입니다.

- 사이트: https://reepower84-png.github.io/chargebiseo/
- 서버 없이 `index.html` 하나로 동작하고, 홈 화면에 설치할 수 있습니다(PWA).

## 파일 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 앱 전체 (화면, 계산, 공식 확인 단가, 카드 조건) |
| `data/chargeinfo.js` | 차지인포 사업자별 요금 (자동 생성) |
| `scripts/update-chargeinfo.mjs` | 차지인포 요금 수집 스크립트 |
| `.github/workflows/update-rates.yml` | 매달 1일 요금 자동 갱신 |
| `manifest.webmanifest`, `sw.js`, `icons/` | 앱 설치와 오프라인용 파일 |

## 요금 갱신

매달 1일에 GitHub Actions가 자동으로 수집합니다. 직접 갱신하려면:

```
node scripts/update-chargeinfo.mjs
```

공식 페이지로 확인한 사업자(환경부, GS차지비, SK일렉링크)와 카드 조건은 `index.html`의 `OFFICIAL`, `CARDS`에서 직접 고칩니다.

## 출처

- 차지인포(한국스마트그리드협회): https://chargeinfo.ksga.org
- 각 사업자 공식 요금 안내, 카드 조건 정리 글 (앱 안의 "출처와 기준일" 참고)

표시되는 단가와 할인 조건은 참고용 추정치이며 실제와 다를 수 있습니다.
