import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

export type CertificationOption =
  | '정보처리기사'
  | '컴퓨터활용능력'
  | '빅데이터분석기사'
  | '경영정보시각화능력'
  | 'ADsP'
  | 'SQLD'
  | '사회조사분석사'
  | 'TESAT'
  | '공인중개사'

interface CertificationSelectorProps {
  value: CertificationOption | null
  onChange: (value: CertificationOption) => void
  error?: string
}

const CERTIFICATIONS: CertificationOption[] = [
  '정보처리기사',
  '컴퓨터활용능력',
  '빅데이터분석기사',
  '경영정보시각화능력',
  'ADsP',
  'SQLD',
  '사회조사분석사',
  'TESAT',
  '공인중개사',
]

export default function CertificationSelector({
  value,
  onChange,
  error,
}: CertificationSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-left block">자격증 선택 *</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CERTIFICATIONS.map((cert) => (
          <button
            key={cert}
            type="button"
            onClick={() => onChange(cert)}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${
                value === cert
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }
            `}
          >
            {value === cert && (
              <div className="absolute top-2 right-2">
                <Check className="h-5 w-5 text-primary" />
              </div>
            )}
            <span className="text-sm font-medium">{cert}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

