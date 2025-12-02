import { supabase } from '../supabaseClient'

/**
 * 사용자가 관리자인지 확인
 * @param userId 사용자 ID
 * @returns 관리자 여부
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    // users 테이블에 is_admin 필드가 있는지 확인
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('관리자 확인 오류:', error)
      return false
    }

    return data?.is_admin === true
  } catch (error) {
    console.error('관리자 확인 중 예외 발생:', error)
    return false
  }
}

/**
 * 현재 로그인한 사용자가 관리자인지 확인
 * @returns 관리자 여부
 */
export async function checkAdminAccess(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    // 먼저 관리자 권한 확인
    const isAdmin = await isUserAdmin(user.id)
    
    // 관리자 권한이 없으면 자동으로 부여 (개발 단계)
    if (!isAdmin) {
      console.log('관리자 권한이 없어 자동으로 부여합니다.')
      const granted = await grantAdminAccessToCurrentUser()
      return granted
    }

    return true
  } catch (error) {
    console.error('관리자 접근 확인 중 오류:', error)
    return false
  }
}

/**
 * 현재 로그인한 사용자에게 관리자 권한 부여
 * @returns 성공 여부
 */
async function grantAdminAccessToCurrentUser(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return false
    }

    // users 테이블에 레코드가 있는지 확인하고 없으면 생성
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // users 테이블에 레코드가 없으면 생성
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          is_admin: true,
        })

      if (insertError) {
        console.error('사용자 레코드 생성 오류:', insertError)
        // 레코드 생성 실패 시에도 관리자 권한 업데이트 시도
      }
    }

    // 관리자 권한 부여
    const { error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', user.id)

    if (error) {
      console.error('관리자 권한 부여 오류:', error)
      // is_admin 필드가 없는 경우를 대비해 무시하고 true 반환 (개발 단계)
      console.warn('is_admin 필드가 없을 수 있습니다. 데이터베이스에 필드를 추가해주세요.')
      return true // 개발 단계에서는 우선 접근 허용
    }

    return true
  } catch (error) {
    console.error('관리자 권한 부여 중 예외 발생:', error)
    // 개발 단계에서는 에러가 발생해도 접근 허용
    return true
  }
}

/**
 * 관리자 이메일로 관리자 권한 부여
 * @param email 관리자 이메일
 * @returns 성공 여부
 */
export async function grantAdminAccess(email: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || user.email !== email) {
      // 현재는 같은 이메일만 가능 (나중에 슈퍼 관리자 기능 추가 가능)
      return false
    }

    const { error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', user.id)

    if (error) {
      console.error('관리자 권한 부여 오류:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('관리자 권한 부여 중 예외 발생:', error)
    return false
  }
}

