const apiUrl = import.meta.env.VITE_API_URL
const apiKey = import.meta.env.VITE_API_KEY

if (!apiUrl) throw new Error("VITE_API_URL is not set")
if (!apiKey) throw new Error("VITE_API_KEY is not set")

export const API_URL: string = apiUrl
export const API_KEY: string = apiKey
