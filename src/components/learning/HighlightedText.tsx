import { findDifficultTerms } from '@/lib/utils/termHighlighting'

interface HighlightedTextProps {
  text: string
  onTermClick?: (term: string, position: { x: number; y: number }) => void
}

export default function HighlightedText({
  text,
  onTermClick,
}: HighlightedTextProps) {
  const parts = findDifficultTerms(text)

  const handleTermClick = (
    e: React.MouseEvent<HTMLSpanElement>,
    term: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect()
    onTermClick?.(term, {
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.isTerm) {
          return (
            <span
              key={`term-${part.startIndex}-${index}`}
              onClick={(e) => handleTermClick(e, part.text)}
              className="cursor-pointer border-b-2 border-dotted border-primary/60 hover:border-primary hover:bg-primary/10 px-1 transition-colors"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  const rect = e.currentTarget.getBoundingClientRect()
                  onTermClick?.(part.text, {
                    x: rect.left + rect.width / 2,
                    y: rect.top,
                  })
                }
              }}
              aria-label={`${part.text}에 대한 설명 보기`}
            >
              {part.text}
            </span>
          )
        }
        return <span key={`text-${part.startIndex}-${index}`}>{part.text}</span>
      })}
    </>
  )
}

