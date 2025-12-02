import { useOnboarding, type CertificationType } from '@/context'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

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
    value: '정보처리산업기사',
    label: '정보처리산업기사',
    description: '정보처리 분야의 산업기사 자격증',
  },
  {
    value: '빅데이터분석기사',
    label: '빅데이터분석기사',
    description: '빅데이터 분석 및 활용 전문가',
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
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">자격증 선택</h1>
          <p className="text-muted-foreground text-lg">
            준비하실 자격증을 선택해주세요
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {certifications.map((cert) => (
            <button
              key={cert.value}
              type="button"
              onClick={() => handleSelect(cert.value)}
              className={`relative p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                state.certificationType === cert.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {state.certificationType === cert.value && (
                <div className="absolute top-4 right-4">
                  <div className="rounded-full bg-primary text-primary-foreground p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{cert.label}</h3>
              <p className="text-sm text-muted-foreground">{cert.description}</p>
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={!state.certificationType}
            className="min-w-32"
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  )
}








