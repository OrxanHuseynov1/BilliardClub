import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { loginRequest } from '../api/auth'
import backgroundImage from '../assets/billiard-login.jpg' 

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleClick = async () => {
    if (code.length !== 4) {
      setError('4 rəqəmli kod daxil edin')
      setCode('') // Səhv kodda girişi sıfırla
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await loginRequest(Number(code))
      login(data)
    } catch (err) {
      setError('Kod səhvdir və ya serverlə əlaqə qurulmadı')
      setCode('') // Səhv kodda girişi sıfırla
    } finally {
      setLoading(false)
    }
  }

  const numberButtons = ['1','2','3','4','5','6','7','8','9']

  const handleNumClick = (val) => {
    if (val === 'Del') {
      setCode((prev) => prev.slice(0, -1))
    } else if (val === 'Clear') {
      setCode('')
    } else if (code.length < 4) {
      setCode((prev) => prev + val)
    }
  }

  return (
    <div 
      className="h-screen flex items-center justify-center bg-cover bg-center **bg-fixed**" 
      style={{ backgroundImage: `url(${backgroundImage.src || backgroundImage})` }}
    >
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full bg-opacity-90 backdrop-filter backdrop-blur-sm">
        <h1 className="text-center text-xl font-semibold mb-6">Xoş Gəlmisiniz</h1>
        
        {/* Yeni, müasir giriş sahəsi */}
        <div className="flex justify-center items-center space-x-2 mb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`
                w-12 h-14 border-b-4 rounded-md flex items-center justify-center 
                text-2xl font-mono border-gray-300 bg-gray-300
                ${code.length > index ? 'border-emerald-500' : 'border-gray-300'}
              `}
            >
              {code.length > index ? '•' : ''}
            </div>
          ))}
        </div>
        
        {/* Görünməyən input, klaviaturadan daxil etmə üçün saxlanılır */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={code}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '')
            if (raw.length <= 4) {
              setCode(raw)
              setError('')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleClick()
          }}
          className="absolute -top-96 left-1/2 opacity-0" // Inputu ekrandan gizlədirik
        />

        {error && (
          <p className="text-red-600 text-center mb-4 select-none">{error}</p>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {numberButtons.map((btn) => (
            <button
              key={btn}
              onClick={() => handleNumClick(btn)}
              className="bg-gray-200 hover:bg-gray-300 rounded-xl py-4 text-xl font-mono select-none active:bg-gray-400 transition"
              type="button"
            >
              {btn}
            </button>
          ))}

          <button
            onClick={() => handleNumClick('Clear')}
            className="bg-red-300 hover:bg-red-400 rounded-xl py-4 text-xl font-mono select-none active:bg-red-500 transition"
            type="button"
          >
            C
          </button>

          <button
            onClick={() => handleNumClick('0')}
            className="bg-gray-200 hover:bg-gray-300 rounded-xl py-4 text-xl font-mono select-none active:bg-gray-400 transition"
            type="button"
          >
            0
          </button>

          <button
            onClick={() => handleNumClick('Del')}
            className="bg-yellow-300 hover:bg-yellow-400 rounded-xl py-4 text-xl font-mono select-none active:bg-yellow-500 transition"
            type="button"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleClick}
          disabled={loading}
          className={`w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl text-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
          type="button"
        >
          {loading ? 'Daxil olunur...' : 'Daxil ol'}
        </button>
      </div>
    </div>
  )
}