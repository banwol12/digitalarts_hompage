export const CATEGORIES = [
  { id: 'all', label: 'ALL', name: '전체' },
  { id: 'installation', label: 'INSTALLATION', name: '인스톨레이션' },
  { id: 'mapping', label: 'MAPPING', name: '프로젝션 맵핑' },
  { id: 'animation', label: 'ANIMATION', name: '3D/2D 애니메이션' },
  { id: 'vfx', label: 'VFX', name: '시각효과 및 합성' },
  { id: 'game', label: 'GAME', name: '인터랙티브 & 게임' },
  { id: 'audio-visual', label: 'AUDIO-VISUAL', name: '오디오 비주얼' }
];

export const RATIOS = ['16:10', '16:9', '4:5', '1:1', '21:9', '9:16'];

export const INITIAL_WORKS = [
  {
    id: 'work-001',
    sort: 1,
    slug: 'pixel-bloom',
    title: 'Pixel Bloom',
    student: '김도현',
    category: 'installation',
    year: '2024',
    tools: ['TouchDesigner', 'GLSL', 'Kinect', 'Spatial Audio'],
    statement: '관객의 생체 신호와 움직임을 실시간 파티클 알고리즘으로 변환하는 인터랙티브 미디어 인스톨레이션.',
    paragraphs: [
      'Pixel Bloom은 디지털 공간의 픽셀 입자들이 관객의 현존과 호흡에 반응하여 살아있는 유기체처럼 피어나는 경험을 탐구합니다.',
      'TouchDesigner와 Depth Camera를 활용하여 관객의 거리에 따라 실시간으로 음향과 셰이더 반응이 동기화됩니다.',
      '2024 서울예대 디지털아트 정기전시 출품작으로 관객 1,200여 명의 인터랙션을 기록했습니다.'
    ],
    ratio: '16:10',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: 'https://github.com/seoularts',
    status: 'approved',
    published: true,
    created_at: '2024-11-20T10:00:00Z'
  },
  {
    id: 'work-002',
    sort: 2,
    slug: 'frequency-map',
    title: 'Frequency Map',
    student: '이서연',
    category: 'mapping',
    year: '2024',
    tools: ['MadMapper', 'Resolume', 'Processing', 'Python'],
    statement: '도시의 환경 소음 주파수를 건축물 표면에 실시간 시각화하는 대형 프로젝션 맵핑.',
    paragraphs: [
      '서울 도심 곳곳에서 채집한 사운드 스케이프 데이터를 분석하여 소리의 파형과 진폭에 따라 건물의 질감이 해체되고 재구성되는 과정을 연출했습니다.',
      'MadMapper를 통한 정밀한 키스톤 매핑과 실시간 오디오 리액티브 비주얼을 구현했습니다.'
    ],
    ratio: '16:9',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: '',
    status: 'approved',
    published: true,
    created_at: '2024-11-21T12:00:00Z'
  },
  {
    id: 'work-003',
    sort: 3,
    slug: 'synthetic-reverie',
    title: 'Synthetic Reverie',
    student: '박준호',
    category: 'animation',
    year: '2024',
    tools: ['Unreal Engine 5', 'Blender', 'Houdini', 'After Effects'],
    statement: '인공지능 신경망의 꿈과 잠재공간(Latent Space)을 고해상도 시네마틱으로 렌더링한 3D 영상.',
    paragraphs: [
      '생성형 AI 모델의 학습 과정에서 발생하는 노이즈와 왜곡을 초현실적인 3D 디지털 풍경으로 시각화했습니다.',
      '언리얼 엔진 5의 Lumen 및 Nanite 기술을 활용해 극도의 광원 디테일을 실시간 캡처했습니다.'
    ],
    ratio: '21:9',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: '',
    status: 'approved',
    published: true,
    created_at: '2024-11-22T14:30:00Z'
  },
  {
    id: 'work-004',
    sort: 4,
    slug: 'latent-horizon',
    title: 'Latent Horizon',
    student: '정우진',
    category: 'vfx',
    year: '2025',
    tools: ['TouchDesigner', 'Unreal Engine 5', 'ComfyUI', 'Houdini'],
    statement: '실시간 생성형 비전 모델과 물리 기반 볼류메트릭 클라우드를 결합한 가상 지평선 시뮬레이션.',
    paragraphs: [
      '관객이 조작하는 조이스틱과 슬라이더에 의해 생성 공간의 파라미터가 실시간 변조되며, 무한히 확장되는 지형을 탐험합니다.',
      '광활한 사막과 심해를 넘나드는 초현실적 기상 현상을 볼류메트릭 셰이더로 구축했습니다.'
    ],
    ratio: '16:10',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: '',
    status: 'approved',
    published: true,
    created_at: '2025-05-10T16:00:00Z'
  },
  {
    id: 'work-005',
    sort: 5,
    slug: 'cybernetic-resonance',
    title: 'Cybernetic Resonance',
    student: '강민지',
    category: 'audio-visual',
    year: '2025',
    tools: ['Max/MSP', 'Ableton Live', 'GLSL Shaders', 'MIDI Controller'],
    statement: '모듈러 신디사이저의 전압 신호를 실시간 기하학 셰이더로 변환하는 오디오-비주얼 퍼포먼스.',
    paragraphs: [
      '소리의 진동수가 공간의 위상을 왜곡시키고, 저음역대의 충격파가 화면의 기하학적 메쉬를 분쇄하는 다감각적 공명을 만들어냅니다.',
      '공연자와 사운드, 시각이 완전히 결합된 즉흥 연주 시스템을 설계했습니다.'
    ],
    ratio: '1:1',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: '',
    status: 'approved',
    published: true,
    created_at: '2025-06-12T11:20:00Z'
  },
  {
    id: 'work-006',
    sort: 6,
    slug: 'neural-labyrinth',
    title: 'Neural Labyrinth',
    student: '송태양',
    category: 'game',
    year: '2025',
    tools: ['Unity', 'ARKit', 'C#', 'Blender'],
    statement: '실제 전시 공간과 가상의 인공신경망 미로를 오버레이하는 증강현실(AR) 탐색형 게임.',
    paragraphs: [
      '아이패드를 들고 갤러리를 이동하면 보이지 않던 거대한 데이터 파이프라인과 인공신경망의 미로가 물리 공간 위에 투영됩니다.',
      '관객은 숨겨진 가중치 노드를 찾아 활성화하며 인공지능의 결정 구조를 직관적으로 체험합니다.'
    ],
    ratio: '4:5',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    video: null,
    external_url: '',
    status: 'approved',
    published: true,
    created_at: '2025-07-04T09:15:00Z'
  }
];

export const INITIAL_SITE = {
  brand: 'Digital Arts Archive',
  tagline: 'for the screen and beyond',
  intro: '서울예술대학교 디지털아트전공 학생들의 작품 아카이브입니다. 코드와 데이터, 센서, 빛과 소리로 만든 작업을 연도와 분야로 정리했습니다.',
  email: 'digitalarts@seoularts.ac.kr',
  instagram: 'https://www.instagram.com/seoularts_digitalarts/',
  youtube: 'https://www.youtube.com/@sia_digitalarts'
};
