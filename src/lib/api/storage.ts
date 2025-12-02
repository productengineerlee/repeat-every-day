import { supabase } from '../supabaseClient'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

export interface UploadResult {
  url: string
  path: string
  error?: string
}

/**
 * 이미지 파일 업로드
 * @param file 업로드할 이미지 파일
 * @param folder 저장할 폴더 경로 (기본값: 'question-images')
 * @returns 업로드 결과
 */
export async function uploadImage(
  file: File,
  folder: string = 'question-images'
): Promise<UploadResult> {
  // 파일 타입 검증
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      url: '',
      path: '',
      error: `지원하지 않는 이미지 형식입니다. (지원 형식: JPEG, PNG, WebP, GIF)`,
    }
  }

  // 파일 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return {
      url: '',
      path: '',
      error: `파일 크기가 너무 큽니다. 최대 ${MAX_FILE_SIZE / 1024 / 1024}MB까지 가능합니다.`,
    }
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        url: '',
        path: '',
        error: '로그인이 필요합니다.',
      }
    }

    // 고유한 파일명 생성
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${folder}/${user.id}/${timestamp}_${sanitizedFileName}`

    // Supabase Storage에 업로드
    const { data, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      // 버킷이 없는 경우 에러 메시지 개선
      if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
        return {
          url: '',
          path: '',
          error: 'Storage 버킷을 먼저 생성해주세요: Supabase Dashboard → Storage → "images" 버킷 생성',
        }
      }
      
      // RLS 정책 오류인 경우
      if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
        return {
          url: '',
          path: '',
          error: 'RLS 정책 오류: Storage 버킷의 RLS 정책을 설정해주세요.',
        }
      }
      
      return {
        url: '',
        path: '',
        error: uploadError.message || '이미지 업로드에 실패했습니다.',
      }
    }

    // 공개 URL 생성
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
    }
  } catch (error) {
    console.error('이미지 업로드 중 오류:', error)
    return {
      url: '',
      path: '',
      error: error instanceof Error ? error.message : '이미지 업로드 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}

/**
 * 이미지 삭제
 * @param path 삭제할 이미지 경로
 * @returns 성공 여부
 */
export async function deleteImage(path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('images')
      .remove([path])

    if (error) {
      console.error('이미지 삭제 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('이미지 삭제 중 예외 발생:', error)
    return false
  }
}

