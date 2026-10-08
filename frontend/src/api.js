const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function request(path, { token, method = 'GET', data, file = false } = {}) {
  let response
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(data !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    })
  } catch {
    throw new Error('Cannot reach the API. Make sure FastAPI is running on port 8000.')
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    const detail = error.detail
    throw new Error(typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map(item => item.msg).join(', ') : `Request failed (${response.status})`)
  }
  if (file) return response.blob()
  if (response.status === 204) return null
  return response.json()
}

export async function downloadPdf(id, token) {
  const blob = await request(`/api/predictions/${id}/report`, { token, file: true })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `claritycare-report-${id}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
