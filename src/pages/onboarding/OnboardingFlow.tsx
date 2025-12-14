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
      {/* Simple Step Indicator */}
      <div className="container mx-auto px-4 pt-4">
        <div className="text-center mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {stepLabels[state.step - 1]} ({state.step}/{stepLabels.length})
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="container mx-auto">{renderStep()}</div>
    </div>
  )
}

