# ABO Pixel Tracker v0.2.0 Beta — GitHub 배포 및 설치

이 저장소는 **SillyTavern 기본 확장 기능**으로 실행됩니다. **Tavern Helper는 필요하지 않습니다.**

> **검증 범위:** JavaScript 구문·JSON·단위 테스트 및 ZIP 구성 검사를 수행했습니다. Vultr 실제 서버에서 GitHub URL 설치와 API 호출은 아직 검증하지 않았습니다. 기존 채팅을 백업하고 테스트 채팅에서 사용하세요.

## 1. GitHub 웹사이트에 게시하기 (콘솔/SSH 불필요)

1. GitHub에서 **New repository**를 눌러 새 저장소를 만듭니다. URL 설치는 서버가 저장소를 복제할 수 있어야 하므로 공개 저장소가 가장 간단합니다.
2. 다운로드한 `ABO_Pixel_Tracker_GitHub_v0.2.0.zip`을 **컴퓨터에서 압축 해제**합니다.
3. 생성한 저장소에서 **Add file → Upload files**를 눌러, 압축 해제한 폴더 **안의 파일과 하위 폴더**를 모두 업로드합니다.
4. 업로드 화면에 **저장소 최상위의 `manifest.json`, `index.js`, `style.css`**가 보이는지 확인하고 **Commit changes**를 누릅니다.
5. GitHub 저장소 URL을 복사합니다. 예: `https://github.com/계정명/abo-pixel-tracker` (예시이므로 실제 URL로 교체).

**중요:** ZIP 자체를 GitHub에 단일 파일로 업로드하면 SillyTavern의 URL 설치가 되지 않습니다. GitHub 저장소의 루트에 `manifest.json`이 존재해야 합니다. ZIP의 바깥쪽 폴더를 한 단계 더 업로드하면 안 됩니다.

## 2. SillyTavern에서 설치하기

1. SillyTavern → **Extensions(확장 기능)** → **Install Extension(확장 설치)**.
2. 위에서 복사한 **GitHub 저장소 URL**을 붙여 넣고 설치합니다.
3. 설치 후 SillyTavern 화면을 새로고침합니다. 확장 기능 관리에서 `ABO Pixel Tracker`를 확인합니다.
4. 채팅 화면의 `▦ ABO` 버튼을 눌러 설정을 엽니다.
5. **World Info / Lorebook**에서 `worldinfo/ABO_Universal_WorldInfo_v3.4_EN.json`을 **별도로 한 번 가져오기** 하고 사용할 채팅/캐릭터에 연결합니다. 확장 설치가 월드 인포를 자동 가져오지는 않습니다.

> 서버에 Git이 없거나 서버 설정이 확장 설치를 제한하면 URL 설치가 실패할 수 있습니다. 일반적인 조건에서는 Vultr 콘솔/SSH를 사용할 필요가 없습니다.

## 3. 분석 모델 연결

`▦ ABO` → `SETTINGS`에서 분석 연결을 선택합니다.

- **현재 연결 사용 (기본값):** 분석 프로필을 선택하지 않으면 현재 SillyTavern의 모델/API 사용.
- **저장된 연결 프로필:** Connection Manager의 저장 프로필을 선택하여 메인 RP 연결을 전환하지 않고 별도 분석 요청. 목록을 갱신하거나 연결 테스트 가능.
- **직접 API 연결:** OpenAI 호환 `https://.../v1` 주소, 모델 이름, 임시 API 키를 입력합니다. **CORS 허용 필요.** 원격 API에는 HTTPS 사용.

직접 입력 API 키는 브라우저 메모리에서만 사용하며 채팅 저장/백업에 포함되지 않습니다. 새로고침하면 키를 다시 입력해야 합니다. 저장 프로필이 삭제되거나 지원되지 않는 경우에는 몰래 현재 모델로 전환하지 않고 오류를 냅니다.

**분석 연결 테스트와 응답별 자동 분석은 실제 API 호출이므로 비용이 발생할 수 있습니다.**

## 4. 이 패키지의 구조

```text
manifest.json
index.js
style.css
core.mjs
analyzer.mjs
rules.json
package.json
README.md
README_KO.md
worldinfo/
  ABO_Universal_WorldInfo_v3.4_EN.json
docs/
  ABO_WorldInfo_FullRules_v3.4_EN.md
tests/
  engine.test.mjs
.gitignore
```

월드 인포 규칙은 영어로 작성되어 있으며, 독립 계산 엔진은 `core.mjs`입니다. 원본 타사 확장 코드나 UI를 복제하지 않았습니다.

## 5. GitHub 업데이트

GitHub에서 파일을 수정·커밋하고 `manifest.json`의 버전 번호를 올린 뒤, SillyTavern 확장 관리 메뉴의 업데이트 확인/업데이트 기능을 사용할 수 있습니다. 업데이트 가능 여부는 설치 상태 및 서버 버전에 따릅니다.

## 6. 로컬 검사 (선택 사항)

실리태번 설치에는 Node/npm 명령어가 필요하지 않습니다. 개발자가 로컬에서 검사할 때만 Node.js 20 이상으로 아래를 실행합니다.

```bash
npm test
npm run check
```

## 7. 알려진 제약

- 이 베타는 실제 Vultr 서버에서 작동 검증한 정식 릴리스가 아닙니다.
- 자동 분석이 잘못된 사건을 추출할 수 있으므로 테스트 채팅에서 먼저 확인하세요.
- 고급 세계관 규칙 중 일부는 실행 코드가 아닌 설계에만 반영돼 있습니다.
- World Info JSON은 확률을 계산하지 않습니다. 계산 및 상태 저장은 확장 엔진의 기능입니다.
- 모든 데이터는 채팅 메타데이터 및 연결 API에 영향을 받으므로 채팅을 백업하는 편이 안전합니다.
