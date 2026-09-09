# src — 빌드 원본

- `seoularts-base.html` : 홈페이지의 **유일한 원본**. 루트의 `index.html` 은 여기서 만들어지므로 직접 고치지 마세요.
- `build.sh` : `index.html`(배포용) 과 Artifact 미리보기 파일을 만듭니다. `bash src/build.sh`
- `build_portfolio_artifact.py` : `portfolio.html` 의 Artifact 미리보기 파일을 만듭니다. `python3 src/build_portfolio_artifact.py`
- `fonts/` : Artifact 미리보기에 내장하는 Pretendard woff2 (배포 사이트는 CDN 을 씁니다)
