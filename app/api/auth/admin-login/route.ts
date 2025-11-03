import { NextResponse } from "next/server"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "alta-telefonia-secret-key-2024")

async function handleAuth(request: Request, from: 'POST' | 'GET') {
  try {
    const pass = process.env.ADMIN_PASS || 'Facu154164'
    const user = process.env.ADMIN_USER || 'admin'

    let providedPass = ''
    let providedUser = ''
    let returnTo = '/admin'

    if (from === 'GET') {
      const { searchParams } = new URL(request.url)
      providedUser = String(searchParams.get('username') || searchParams.get('user') || '')
      providedPass = String(searchParams.get('password') || '')
      returnTo = String(searchParams.get('returnTo') || returnTo)
    } else {
      const contentType = request.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const body = await request.json().catch(() => ({} as any))
        providedUser = String(body.username || body.user || '')
        providedPass = String(body.password || '')
        returnTo = String(body.returnTo || returnTo)
      } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
        const form = await request.formData()
        providedUser = String(form.get('username') || form.get('user') || '')
        providedPass = String(form.get('password') || '')
        returnTo = String(form.get('returnTo') || returnTo)
      } else {
        const { searchParams } = new URL(request.url)
        providedUser = String(searchParams.get('username') || searchParams.get('user') || '')
        providedPass = String(searchParams.get('password') || '')
        returnTo = String(searchParams.get('returnTo') || returnTo)
      }
    }

    if (providedUser !== user || providedPass !== pass) {
      const url = new URL('/auth/admin-login', request.url)
      url.searchParams.set('error', '1')
      if (returnTo) url.searchParams.set('returnTo', returnTo)
      return NextResponse.redirect(url)
    }

    const now = Math.floor(Date.now() / 1000)
    const exp = now + 60 * 60 * 8 // 8 hours
    const token = await new SignJWT({
      name: 'Administrador',
      role: 'admin',
      email: 'admin@example.com',
      permissions: { all: true },
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .sign(JWT_SECRET)

    const res = NextResponse.redirect(new URL(returnTo || '/admin', request.url))
    res.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8,
    })
    res.cookies.set('admin_pw', '', { path: '/', maxAge: 0 })
    return res
  } catch (e) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  return handleAuth(request, 'POST')
}

export async function GET(request: Request) {
  return handleAuth(request, 'GET')
}
