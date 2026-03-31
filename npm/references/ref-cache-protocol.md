# ref-cache 프로토콜

## 개요

ref-cache는 파이프라인 내 서브에이전트 호출 간 중복 파일 읽기를 방지하는 메커니즘입니다.
레퍼런스 파일이 매번 디스크에서 다시 읽히는 대신 `<ref-cache>` XML 요소를 통해 에이전트 간에 전달됩니다.

## 프로토콜 (4단계)

1. 수신한 dispatch XML에 `<ref-cache>`가 있는지 **확인**
2. 각 필수 레퍼런스 파일에 대해:
   - ref-cache에 있으면 → **파일 읽기 건너뛰기**, 캐시된 내용 사용
   - ref-cache에 없으면 → `{REFERENCES_DIR}/{filename}.md`에서 읽고 ref-cache에 추가
3. 작업 완료 시, 반환하는 task-result XML에 병합된 `<ref-cache>` 포함
4. **하위 호환성**: dispatch에 `<ref-cache>`가 없으면 모든 레퍼런스 파일을 정상적으로 읽기 (기존 동작)

## ref-cache XML 형식

전체 스키마는 `xml-schema.md` § 4 참조.

```xml
<ref-cache>
  <ref key="file-content-schema">...내용...</ref>
  <ref key="shared-prompt-sections">...내용...</ref>
  <!-- 로딩된 레퍼런스 파일당 하나의 <ref> -->
</ref-cache>
```

## 체인 전파

파이프라인에서 ref-cache가 에이전트 간에 어떻게 흐르는지는 `agent-flow.md` § ref-cache Chain Propagation 참조.
