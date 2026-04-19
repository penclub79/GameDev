# GameDev

이 저장소는 웹 게임 프로젝트들을 모아두는 저장소입니다.

## GitHub Pages 배포 구조

현재 `방치형게임1`은 아래 두 위치로 관리됩니다.

- `WebGame/방치형게임1`
  개발용 원본 소스
- `docs`
  GitHub Pages 배포용 정적 파일

GitHub Pages를 사용할 때는 저장소 설정에서 아래처럼 지정하면 됩니다.

1. `Settings`
2. `Pages`
3. `Build and deployment`
4. `Source: Deploy from a branch`
5. `Branch: main`
6. `Folder: /docs`

배포가 완료되면 저장소의 `docs` 폴더 내용이 웹사이트로 공개됩니다.

## 현재 배포 대상

- `WebGame/방치형게임1`의 정적 웹 버전
- `docs` 폴더에 동일한 실행 파일 복사본 유지

## 운영 메모

게임 소스를 수정한 뒤 GitHub Pages 반영이 필요하면, `WebGame/방치형게임1` 변경 내용을 `docs`에도 같이 반영해야 합니다.
