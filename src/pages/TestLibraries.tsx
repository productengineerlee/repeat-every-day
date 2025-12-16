import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

const sampleData = [
  { name: '월', value: 400 },
  { name: '화', value: 300 },
  { name: '수', value: 200 },
  { name: '목', value: 278 },
  { name: '금', value: 189 },
]

export default function TestLibraries() {
  const [isAnimated, setIsAnimated] = useState(false)

  return (
    <div className="min-h-screen p-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">라이브러리 테스트</h1>
        <p className="text-muted-foreground">
          Framer Motion, Recharts, React Router, Lucide React 테스트
        </p>
      </div>

      {/* Framer Motion 테스트 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Framer Motion</h2>
        <Button onClick={() => setIsAnimated(!isAnimated)}>
          애니메이션 토글
        </Button>
        <motion.div
          animate={{
            scale: isAnimated ? 1.2 : 1,
            rotate: isAnimated ? 180 : 0,
          }}
          transition={{ duration: 0.5 }}
          className="w-32 h-32 bg-primary rounded-lg mx-auto"
        />
      </div>

      {/* Recharts 테스트 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recharts</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lucide React 테스트 */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Lucide React</h2>
        <div className="flex gap-4 justify-center">
          <Home className="w-8 h-8" />
          <Home className="w-8 h-8 text-primary" />
          <Home className="w-8 h-8 text-destructive" />
        </div>
      </div>
    </div>
  )
}















