import { useOnboarding } from '@/context'
import CertificationSelection from './CertificationSelection'
import DiagnosticTest from './DiagnosticTest'
import DiagnosticResults from './DiagnosticResults'
import DailyQuestionSetup from './DailyQuestionSetup'

export default function OnboardingFlow() {
  const { state } = useOnboarding()

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return <CertificationSelection />
      case 2:
        return <DiagnosticTest />
      case 3:
        return <DiagnosticResults />
      case 4:
        return <DailyQuestionSetup />
      default:
        return <CertificationSelection />
    }
  }

  const stepLabels = [
    '자격증 선택',
    '진단 테스트',
    '결과 확인',
    '학습 설정',
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Indicator */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              온보딩 진행 중
            </h2>
            <span className="text-sm font-medium">
              {state.step} / {stepLabels.length}
            </span>
          </div>
          <div className="flex gap-2">
            {stepLabels.map((label, index) => (
              <div
                key={index}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  index + 1 <= state.step
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
                title={label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto">{renderStep()}</div>
    </div>
  )
}

