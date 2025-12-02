import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'

export default function SupabaseTest() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // 간단한 연결 테스트 - 환경 변수 확인
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY

      if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
        throw new Error('환경 변수가 설정되지 않았습니다.')
      }

      // Supabase 클라이언트가 정상적으로 생성되었는지 확인
      const { error } = await supabase.from('_realtime').select('*').limit(1)
      
      if (error) {
        // _realtime 테이블이 없어도 정상 (연결은 성공)
        if (error.code === 'PGRST116') {
          setConnectionStatus('connected')
          setErrorMessage('')
          return
        }
        throw error
      }
      
      setConnectionStatus('connected')
      setErrorMessage('')
    } catch (error) {
      setConnectionStatus('error')
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Unknown error occurred')
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Supabase 연결 테스트</h1>
        <p className="text-muted-foreground">
          Supabase 클라이언트 연결 상태를 확인합니다
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="w-full p-6 border rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">연결 상태:</span>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : connectionStatus === 'error'
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {connectionStatus === 'checking' && '확인 중...'}
              {connectionStatus === 'connected' && '연결됨'}
              {connectionStatus === 'error' && '오류'}
            </span>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">
                {errorMessage}
              </p>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                환경 변수가 설정되지 않았거나 Supabase 프로젝트가 생성되지 않았을 수 있습니다.
                <br />
                <br />
                1. Supabase 프로젝트를 생성하세요: https://supabase.com
                <br />
                2. .env.local 파일을 생성하고 다음을 추가하세요:
                <br />
                <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  VITE_SUPABASE_URL=your-project-url
                  <br />
                  VITE_SUPABASE_ANON_KEY=your-anon-key
                </code>
              </p>
            </div>
          )}
        </div>

        <Button onClick={checkConnection} variant="outline">
          다시 확인
        </Button>
      </div>
    </div>
  )
}

