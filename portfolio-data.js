/* 포트폴리오 데이터 — 대괄호 자리표시자만 실제 값으로 바꾸면 됩니다.
   n: 번호(세 자리), slug: 주소용 영문, meta: interactive | generative | projection | xr | film | sound
   seed: 자리표시 썸네일 패턴 번호(이미지가 생기면 image: 'images/xxx.jpg' 를 추가하세요) */
window.PORTFOLIO_DATA = {
  brand: 'DIGITAL ARTS',
  taglines: ['PIXELS INTO SPACE', 'CODE INTO LIGHT', 'SIGNAL INTO SOUND', 'SCREENS INTO STAGES'],
  statement: ['화면 안에서 시작해', '공간과 관객 사이로 나간다.'],
  intro: '서울예술대학교 디지털아트전공 학생들의 작품 아카이브입니다. 코드와 데이터, 센서, 빛과 소리로 만든 작업을 연도와 분야로 정리했습니다.',
  works: [
    { n:'001', slug:'work-001', title:'[작품 제목 001]', student:'[학생 이름]', meta:'interactive', year:'[연도]', tools:['TouchDesigner','Kinect'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요 — 무엇을 만들었는지 한 문단으로.]','[제작 과정 — 어떤 도구와 방법을 썼는지.]','[결과 — 전시·상영 정보와 관객 반응.]'], seed:3 },
    { n:'002', slug:'work-002', title:'[작품 제목 002]', student:'[학생 이름]', meta:'generative', year:'[연도]', tools:['p5.js','Python'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:11 },
    { n:'003', slug:'work-003', title:'[작품 제목 003]', student:'[학생 이름]', meta:'projection', year:'[연도]', tools:['Resolume Arena','MadMapper'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:27 },
    { n:'004', slug:'work-004', title:'[작품 제목 004]', student:'[학생 이름]', meta:'xr', year:'[연도]', tools:['Unreal Engine','Quest'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:5 },
    { n:'005', slug:'work-005', title:'[작품 제목 005]', student:'[학생 이름]', meta:'sound', year:'[연도]', tools:['Max/MSP','Ableton Live'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:8 },
    { n:'006', slug:'work-006', title:'[작품 제목 006]', student:'[학생 이름]', meta:'film', year:'[연도]', tools:['DaVinci Resolve'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:13 },
    { n:'007', slug:'work-007', title:'[작품 제목 007]', student:'[학생 이름]', meta:'interactive', year:'[연도]', tools:['Arduino','TouchDesigner'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:21 },
    { n:'008', slug:'work-008', title:'[작품 제목 008]', student:'[학생 이름]', meta:'generative', year:'[연도]', tools:['Processing','생성형 모델'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:34 },
    { n:'009', slug:'work-009', title:'[작품 제목 009]', student:'[학생 이름]', meta:'projection', year:'[연도]', tools:['Resolume Arena'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:17 },
    { n:'010', slug:'work-010', title:'[작품 제목 010]', student:'[학생 이름]', meta:'xr', year:'[연도]', tools:['Unity','ARKit'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:42 },
    { n:'011', slug:'work-011', title:'[작품 제목 011]', student:'[학생 이름]', meta:'sound', year:'[연도]', tools:['SuperCollider'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:9 },
    { n:'012', slug:'work-012', title:'[작품 제목 012]', student:'[학생 이름]', meta:'film', year:'[연도]', tools:['Blender','After Effects'], statement:'[작품을 한 문장으로 설명하세요.]', paragraphs:['[작품 개요]','[제작 과정]','[결과]'], seed:29 }
  ],
  about: {
    heading: ['우리는 화면을 만들지 않는다.', '화면이 놓일 공간을 만든다.'],
    intro: '디지털아트전공은 코드와 데이터, 센서, 빛과 소리를 재료로 다루는 예술가를 기릅니다. 작품은 실시간으로 반응하고, 공간의 스케일로 커지고, 인공지능과 함께 태어납니다.',
    services: [
      { n:'001', label:'interactive', body:'센서와 카메라, 관객의 움직임이 입력이 되는 작품.' },
      { n:'002', label:'generative', body:'규칙과 데이터, 학습된 모델이 만드는 이미지와 소리.' },
      { n:'003', label:'projection', body:'프로젝션 맵핑과 미디어 파사드, 무대 영상.' },
      { n:'004', label:'xr', body:'VR·AR 공간 연출과 실시간 3D.' }
    ]
  },
  contact: { email: '[전공 이메일]', address: ['서울예술대학교 안산캠퍼스', '[캠퍼스 주소]'], instagram: '#', youtube: '#' }
};
