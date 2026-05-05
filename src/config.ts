const API_URL = import.meta.env.VITE_API_URL as string | undefined
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined

if (!API_URL) throw new Error("VITE_API_URL is not set")
if (!API_KEY) throw new Error("VITE_API_KEY is not set")

export { API_URL, API_KEY }
