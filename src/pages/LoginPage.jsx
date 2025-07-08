import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { loginRequest } from '../api/auth'
import backgroundImage from '../assets/billiard-bg.jpg' // <-- BU SƏTRİ ƏLAVƏ EDİN

export default function LoginPage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleClick()
    }
  }

  const handleClick = async () => {
    if (code.length !== 4) {
      setError('4 rəqəmli kod daxil edin')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await loginRequest(Number(code))
      login(data)
    } catch (err) {
      setError('Kod səhvdir və ya serverlə əlaqə qurulmadı')
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
    // Burada dəyişiklik edirik:
    <div 
      className="h-screen flex items-center justify-center bg-cover bg-center" 
      style={{ backgroundImage: `url(${backgroundImage.src || backgroundImage})` }} // <-- BURANI DƏYİŞDİRDİK
    >
      <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full bg-opacity-90 backdrop-filter backdrop-blur-sm">
        <h1 className="text-center text-xl font-semibold mb-6">Xoş Gəlmisiniz</h1>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          value={'*'.repeat(code.length)}
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
          placeholder="****"
          className="w-full p-3 border border-gray-300 rounded-xl text-center tracking-widest text-2xl mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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