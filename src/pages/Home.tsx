import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context'
import {
  BookOpen,
  Target,
  BarChart3,
  Trophy,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  FileX,
  Search,
} from 'lucide-react'
import { getQuestionsList } from '@/lib/api/questions'

const features = [
  {
    icon: Target,
    title: '개인화된 학습',
    description: 'AI 기반 약점 분석과 간격 반복 학습 알고리즘으로 당신만의 맞춤형 문제를 추천합니다.',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: BarChart3,
    title: '실시간 통계',
    description: '학습 진행 상황과 성과를 한눈에 확인할 수 있는 상세한 대시보드와 분석 차트를 제공합니다.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Trophy,
    title: '게이미피케이션',
    description: '스트릭, 업적, 보상 시스템으로 학습 동기를 부여하고 지속적인 성장을 지원합니다.',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
  },
]

const benefits = [
  '에빙하우스 망각 곡선 기반 간격 반복 학습',
  'AI 튜터를 통한 개념 설명 및 이해도 향상',
  '오답 노트 자동 관리 및 복습 스케줄링',
  '다양한 자격증 지원 (정보처리기사, ADsP, SQLD 등)',
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [examSession, setExamSession] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLoadExamQuestions = async () => {
    if (!examSession.trim()) {
      alert('기출회차를 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      // 선택한 회차의 문제를 기출번호 오름차순으로 불러오기
      const result = await getQuestionsList({
        examSession: examSession.trim(),
        orderBy: 'exam_number',
        order: 'asc',
        limit: 100, // 충분히 많은 문제를 가져오기
      })

      if (result.error) {
        alert(`문제를 불러오는 중 오류가 발생했습니다: ${result.error}`)
        return
      }

      if (result.questions.length === 0) {
        alert(`'${examSession}' 회차의 문제를 찾을 수 없습니다.`)
        return
      }

      // 문제 목록 화면으로 이동 (기출회차 필터 적용)
      navigate('/admin/questions', {
        state: { examSession: examSession.trim() },
      })
    } catch (error) {
      console.error('기출문제 불러오기 실패:', error)
      alert('문제를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          {/* Logo/Brand */}
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4"
          >
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Certiq</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            자격증 시험 준비,
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              더 스마트하게
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            개인화된 학습 알고리즘으로 자격증 시험을 효율적으로 준비하세요
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            {!user ? (
              <>
                <Link to="/signup">
                  <Button size="lg" className="text-lg px-8 h-12 group">
                    무료로 시작하기
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="text-lg px-8 h-12">
                    로그인
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 h-12 group">
                    대시보드로 이동
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/wrong-answers">
                  <Button variant="outline" size="lg" className="gap-2">
                    <FileX className="h-5 w-5" />
                    오답노트
                  </Button>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">왜 Certiq인가요?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            과학적 학습 방법론과 최신 기술을 결합한 스마트한 학습 플랫폼
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="h-full bg-card border rounded-xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 기출문제 불러오기 섹션 */}
      {user && (
        <section className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto bg-card border rounded-xl p-8 shadow-lg"
          >
            <h2 className="text-2xl font-bold mb-4 text-center">기출문제 불러오기</h2>
            <p className="text-muted-foreground mb-6 text-center">
              기출회차를 입력하여 해당 회차의 문제를 기출번호 순서대로 확인하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="예: 2024-01"
                    value={examSession}
                    onChange={(e) => {
                      let value = e.target.value
                      // YYYY-MM 형식으로 포맷팅 (숫자와 하이픈만 허용)
                      value = value.replace(/[^0-9-]/g, '')
                      // YYYY-MM 형식 강제 (예: 2024-01)
                      if (value.length > 4 && !value.includes('-')) {
                        value = value.slice(0, 4) + '-' + value.slice(4)
                      }
                      // 최대 길이 제한 (YYYY-MM = 7자)
                      if (value.length > 7) {
                        value = value.slice(0, 7)
                      }
                      // 하이픈이 2개 이상이면 첫 번째만 유지
                      const parts = value.split('-')
                      if (parts.length > 2) {
                        value = parts[0] + '-' + parts.slice(1).join('')
                      }
                      setExamSession(value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadExamQuestions()
                      }
                    }}
                    className="pl-10 h-12 text-lg"
                    maxLength={7}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">형식: YYYY-MM (예: 2024-01)</p>
              </div>
              <Button
                onClick={handleLoadExamQuestions}
                disabled={loading || !examSession.trim()}
                size="lg"
                className="h-12 px-8"
              >
                {loading ? '불러오는 중...' : '불러오기'}
              </Button>
            </div>
          </motion.div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30 rounded-3xl my-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">주요 기능</h2>
            <p className="text-lg text-muted-foreground">
              Certiq가 제공하는 강력한 학습 도구들
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-foreground">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-12 border border-primary/20"
          >
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              지금 시작하세요
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              무료로 가입하고 개인화된 학습 경험을 시작해보세요
            </p>
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 h-12 group">
                무료로 시작하기
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </section>
      )}
    </div>
  )
}



