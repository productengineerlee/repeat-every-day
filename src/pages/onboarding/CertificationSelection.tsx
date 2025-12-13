import { useOnboarding, type CertificationType } from '@/context'
import { Button } from '@/components/ui/button'

const certifications: {
  value: CertificationType
  label: string
  description: string
}[] = [
  {
    value: '정보처리기사',
    label: '정보처리기사',
    description: '정보시스템 개발 및 운영에 필요한 기술과 지식',
  },
  {
    value: '컴퓨터활용능력',
    label: '컴퓨터활용능력',
    description: '컴퓨터 활용 능력 자격증',
  },
  {
    value: '빅데이터분석기사',
    label: '빅데이터분석기사',
    description: '빅데이터 분석 및 활용 전문가',
  },
  {
    value: '경영정보시각화능력',
    label: '경영정보시각화능력',
    description: '경영정보 시각화 능력 자격증',
  },
  {
    value: 'ADsP',
    label: 'ADsP',
    description: '데이터 분석 준전문가 (Advanced Data Analytics Semi-Professional)',
  },
  {
    value: 'SQLD',
    label: 'SQLD',
    description: 'SQL 개발자 (SQL Developer)',
  },
  {
    value: '사회조사분석사',
    label: '사회조사분석사',
    description: '사회조사 및 통계분석 전문가 자격증',
  },
  {
    value: 'TESAT',
    label: 'TESAT',
    description: '경제 이해력 검증시험 (Test of Economic Sense And Thinking)',
  },
  {
    value: '공인중개사',
    label: '공인중개사',
    description: '부동산 중개 전문가 자격증',
  },
]

export default function CertificationSelection() {
  const { state, setCertificationType, nextStep } = useOnboarding()

  const handleSelect = (certification: CertificationType) => {
    setCertificationType(certification)
  }

  const handleNext = () => {
    if (state.certificationType) {
      nextStep()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">자격증 선택</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {certifications.map((cert) => (
            <label
              key={cert.value}
              htmlFor={cert.value}
              className={`relative flex items-center justify-center p-6 border-2 rounded-xl cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                state.certificationType === cert.value
                  ? 'border-primary bg-primary/10 shadow-lg scale-105'
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              <input
                type="radio"
                id={cert.value}
                name="certification"
                value={cert.value}
                checked={state.certificationType === cert.value}
                onChange={() => handleSelect(cert.value)}
                className="sr-only"
              />
              <div className="flex items-center justify-center w-full">
                <div className={`mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  state.certificationType === cert.value
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {state.certificationType === cert.value && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-center flex-1">
                  {cert.label}
                </h3>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={handleNext}
            disabled={!state.certificationType}
            className="min-w-32"
            size="lg"
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}








