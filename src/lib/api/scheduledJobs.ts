/**
 * Scheduled Job Management API
 * 
 * 일일 세트 생성 스케줄 작업 관리 및 모니터링
 */

import { supabase } from '../supabaseClient'

export interface GenerationLog {
  id: string
  userId: string
  certificationType: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  questionIds: string[] | null
  errorMessage: string | null
  processingTimeMs: number | null
  createdAt: string
  completedAt: string | null
}

export interface BatchResult {
  processedCount: number
  successCount: number
  failedCount: number
  skippedCount: number
}

export interface RetryResult {
  retriedCount: number
  successCount: number
  failedCount: number
}

/**
 * 수동으로 일일 세트 생성 배치 실행
 * (테스트 및 관리 목적)
 */
export async function runDailySetGenerationBatch(
  batchSize: number = 50,
  maxProcessingTimeMs: number = 300000
): Promise<BatchResult> {
  try {
    const { data, error } = await supabase.rpc('generate_daily_sets_batch', {
      batch_size: batchSize,
      max_processing_time_ms: maxProcessingTimeMs,
    })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        skippedCount: 0,
      }
    }

    return data[0] as BatchResult
  } catch (error) {
    console.error('Error running daily set generation batch:', error)
    throw error
  }
}

/**
 * 실패한 작업 재시도
 */
export async function retryFailedGenerations(
  maxRetries: number = 3,
  batchSize: number = 20
): Promise<RetryResult> {
  try {
    const { data, error } = await supabase.rpc('retry_failed_daily_set_generations', {
      max_retries: maxRetries,
      batch_size: batchSize,
    })

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      return {
        retriedCount: 0,
        successCount: 0,
        failedCount: 0,
      }
    }

    return data[0] as RetryResult
  } catch (error) {
    console.error('Error retrying failed generations:', error)
    throw error
  }
}

/**
 * 사용자의 생성 로그 조회
 */
export async function getUserGenerationLogs(
  userId: string,
  limit: number = 10
): Promise<GenerationLog[]> {
  try {
    const { data, error } = await supabase
      .from('daily_set_generation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      certificationType: log.certification_type,
      status: log.status,
      questionIds: log.question_ids,
      errorMessage: log.error_message,
      processingTimeMs: log.processing_time_ms,
      createdAt: log.created_at,
      completedAt: log.completed_at,
    }))
  } catch (error) {
    console.error('Error fetching user generation logs:', error)
    throw error
  }
}

/**
 * 전체 생성 로그 통계 조회 (관리자용)
 */
export async function getGenerationStats(
  startDate?: string,
  endDate?: string
): Promise<{
  total: number
  completed: number
  failed: number
  processing: number
  averageProcessingTime: number
}> {
  try {
    let query = supabase
      .from('daily_set_generation_logs')
      .select('status, processing_time_ms', { count: 'exact' })

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    const stats = {
      total: count || 0,
      completed: 0,
      failed: 0,
      processing: 0,
      totalProcessingTime: 0,
      completedCount: 0,
    }

    data?.forEach((log) => {
      if (log.status === 'completed') {
        stats.completed++
        if (log.processing_time_ms) {
          stats.totalProcessingTime += log.processing_time_ms
          stats.completedCount++
        }
      } else if (log.status === 'failed') {
        stats.failed++
      } else if (log.status === 'processing') {
        stats.processing++
      }
    })

    return {
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
      processing: stats.processing,
      averageProcessingTime:
        stats.completedCount > 0
          ? Math.round(stats.totalProcessingTime / stats.completedCount)
          : 0,
    }
  } catch (error) {
    console.error('Error fetching generation stats:', error)
    throw error
  }
}

/**
 * 최근 실패한 작업 조회
 */
export async function getRecentFailures(limit: number = 20): Promise<GenerationLog[]> {
  try {
    const { data, error } = await supabase
      .from('daily_set_generation_logs')
      .select('*')
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw error
    }

    return (data || []).map((log) => ({
      id: log.id,
      userId: log.user_id,
      certificationType: log.certification_type,
      status: log.status,
      questionIds: log.question_ids,
      errorMessage: log.error_message,
      processingTimeMs: log.processing_time_ms,
      createdAt: log.created_at,
      completedAt: log.completed_at,
    }))
  } catch (error) {
    console.error('Error fetching recent failures:', error)
    throw error
  }
}















