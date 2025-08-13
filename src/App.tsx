"use client"
import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"

interface PasswordOptions {
  length: number
  includeLowercase: boolean
  includeUppercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeAmbiguous: boolean
  includeDashes: boolean
}

interface GeneratedPassword {
  password: string
  strength: number
  entropy: number
  type: "password" | "passphrase"
}

interface Toast {
  id: number
  message: string
  type: "success" | "error"
}

const WORD_LIST = [
  "Mountain",
  "Ocean",
  "Thunder",
  "Phoenix",
  "Dragon",
  "Crystal",
  "Shadow",
  "Lightning",
  "Frost",
  "Blaze",
  "Storm",
  "Eagle",
  "Tiger",
  "Wolf",
  "Bear",
  "River",
  "Forest",
  "Star",
  "Moon",
  "Sun",
  "Wind",
  "Fire",
  "Ice",
  "Earth",
  "Sky",
  "Cloud",
  "Rain",
  "Snow",
  "Leaf",
  "Tree",
  "Rock",
  "Gold",
  "Silver",
  "Diamond",
  "Ruby",
  "Sapphire",
  "Pearl",
  "Coral",
  "Wave",
  "Tide",
  "Shore",
]

function App() {
  const [] = useState(true)
  const [currentPassword, setCurrentPassword] = useState<GeneratedPassword>({
    password: "",
    strength: 0,
    entropy: 0,
    type: "password",
  })
  const [options, setOptions] = useState<PasswordOptions>({
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeAmbiguous: false,
    includeDashes: false,
  })
  const [showPassword, setShowPassword] = useState(true)
  const [passwordMode, setPasswordMode] = useState<"password" | "passphrase">("password")
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now()
    const newToast = { id, message, type }
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3000)
  }

  const getSecureRandom = (max: number): number => {
    const array = new Uint32Array(1)
    crypto.getRandomValues(array)
    return array[0] % max
  }

  const calculateEntropy = (password: string, charset: string): number => {
    return password.length * Math.log2(charset.length)
  }

  const getPasswordStrength = (_password: string, entropy: number): number => {
    if (entropy < 28) return 1 // Very Weak
    if (entropy < 35) return 2 // Weak
    if (entropy < 59) return 3 // Fair
    if (entropy < 127) return 4 // Strong
    return 5 // Very Strong
  }

  const generateCharacterSet = (): string => {
    let charset = ""
    const lower = "abcdefghijklmnopqrstuvwxyz"
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    const ambiguous = "O0Il1"

    if (options.includeLowercase) charset += lower
    if (options.includeUppercase) charset += upper
    if (options.includeNumbers) charset += numbers
    if (options.includeSymbols) charset += symbols

    if (options.excludeAmbiguous) {
      charset = charset
        .split("")
        .filter((char) => !ambiguous.includes(char))
        .join("")
    }

    return charset
  }

  const generatePassword = useCallback((): GeneratedPassword => {
    if (passwordMode === "passphrase") {
      const wordCount = Math.max(4, Math.min(8, Math.floor(options.length / 4)))
      const passphrase = Array.from({ length: wordCount }, () => {
        const word = WORD_LIST[getSecureRandom(WORD_LIST.length)]
        const number = getSecureRandom(100)
        return `${word}${number}`
      }).join("-")

      const entropy = calculateEntropy(passphrase, "62") // Approximation for passphrase
      return {
        password: passphrase,
        strength: getPasswordStrength(passphrase, entropy),
        entropy,
        type: "passphrase",
      }
    }

    const charset = generateCharacterSet()
    if (!charset) {
      return {
        password: "",
        strength: 0,
        entropy: 0,
        type: "password",
      }
    }

    let password = ""
    const requiredChars: string[] = []

    // Ensure at least one character from each selected type
    if (options.includeLowercase) requiredChars.push("abcdefghijklmnopqrstuvwxyz"[getSecureRandom(26)])
    if (options.includeUppercase) requiredChars.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[getSecureRandom(26)])
    if (options.includeNumbers) requiredChars.push("0123456789"[getSecureRandom(10)])
    if (options.includeSymbols) requiredChars.push("!@#$%^&*"[getSecureRandom(8)])

    // Add required characters
    for (const char of requiredChars) {
      password += char
    }

    // Fill remaining length
    for (let i = password.length; i < options.length; i++) {
      password += charset[getSecureRandom(charset.length)]
    }

    // Shuffle the password
    const shuffled = password
      .split("")
      .sort(() => getSecureRandom(3) - 1)
      .join("")

    // Add dashes if requested
    let finalPassword = shuffled
    if (options.includeDashes && finalPassword.length > 8) {
      const dashInterval = Math.floor(finalPassword.length / 4)
      let withDashes = ""
      for (let i = 0; i < finalPassword.length; i++) {
        if (i > 0 && i % dashInterval === 0) withDashes += "-"
        withDashes += finalPassword[i]
      }
      finalPassword = withDashes
    }

    const entropy = calculateEntropy(finalPassword, charset)
    return {
      password: finalPassword,
      strength: getPasswordStrength(finalPassword, entropy),
      entropy,
      type: "password",
    }
  }, [options, passwordMode])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast("Password copied to clipboard!")
    } catch (err) {
      showToast("Failed to copy password", "error")
    }
  }

  const downloadPassword = (password: string) => {
    const blob = new Blob([password], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `password-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast("Password downloaded!")
  }

  useEffect(() => {
    const newPassword = generatePassword()
    setCurrentPassword(newPassword)
  }, [generatePassword])


  return (
    <div className="min-h-screen bg-slate-900 text-gray-100">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm ${
              toast.type === "success" ? "bg-green-500/90 text-white" : "bg-red-500/90 text-white"
            }`}
          >
            {toast.message}
          </motion.div>
        ))}
      </div>

      {/* Hexagonal Background Pattern */}
      <div className="fixed inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
              <polygon points="50,1 85,25 85,62 50,86 15,62 15,25" stroke="#10b981" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <h1 className="text-3xl font-bold text-emerald-400">SecureHex</h1>
          </div>
          <p className="text-gray-400">Advanced Password & Passphrase Generator</p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-6">
          {/* Mode Selection */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPasswordMode("password")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                passwordMode === "password"
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                  : "bg-slate-700/50 text-gray-400 hover:text-gray-300"
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Password
            </button>
            <button
              onClick={() => setPasswordMode("passphrase")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                passwordMode === "passphrase"
                  ? "bg-gradient-to-r from-emerald-500 to-blue-500 text-white"
                  : "bg-slate-700/50 text-gray-400 hover:text-gray-300"
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Passphrase
            </button>
          </div>

          {/* Generated Password */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Generated Password</span>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 relative">
              <div className="font-mono text-lg break-all pr-16">
                {showPassword ? currentPassword.password : "•".repeat(currentPassword.password.length)}
              </div>
              <div className="absolute right-3 top-3 flex gap-2">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-2 rounded-lg bg-slate-700/50 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(currentPassword.password)}
                  className="p-2 rounded-lg bg-slate-700/50 text-gray-400 hover:text-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Strength Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  Strength: <span className="text-emerald-400 font-medium">Strong</span>
                </span>
                <span className="text-sm text-gray-400">{currentPassword.entropy.toFixed(0)} bits entropy</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentPassword.strength / 5) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {passwordMode === "password" && (
            <>
              {/* Password Length */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-white font-medium">Password Length</span>
                  <span className="text-2xl font-bold text-emerald-400">{options.length}</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="6"
                    max="64"
                    value={options.length}
                    onChange={(e) => setOptions((prev) => ({ ...prev, length: Number.parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Character Options - 2x2 Grid */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOptions((prev) => ({ ...prev, includeLowercase: !prev.includeLowercase }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.includeLowercase
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Lowercase (a-z)</div>
                  <div className="text-sm opacity-70 mt-1">abc</div>
                </button>

                <button
                  onClick={() => setOptions((prev) => ({ ...prev, includeUppercase: !prev.includeUppercase }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.includeUppercase
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Uppercase (A-Z)</div>
                  <div className="text-sm opacity-70 mt-1">ABC</div>
                </button>

                <button
                  onClick={() => setOptions((prev) => ({ ...prev, includeNumbers: !prev.includeNumbers }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.includeNumbers
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Numbers (0-9)</div>
                  <div className="text-sm opacity-70 mt-1">123</div>
                </button>

                <button
                  onClick={() => setOptions((prev) => ({ ...prev, includeSymbols: !prev.includeSymbols }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.includeSymbols
                      ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Symbols (!@#)</div>
                  <div className="text-sm opacity-70 mt-1">!@#</div>
                </button>
              </div>

              {/* Additional Options */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setOptions((prev) => ({ ...prev, excludeAmbiguous: !prev.excludeAmbiguous }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.excludeAmbiguous
                      ? "bg-slate-600/50 border-slate-500/50 text-gray-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Exclude Ambiguous</div>
                  <div className="text-sm opacity-70 mt-1">0, O, I, l, 1</div>
                </button>

                <button
                  onClick={() => setOptions((prev) => ({ ...prev, includeDashes: !prev.includeDashes }))}
                  className={`p-4 rounded-xl border transition-all duration-200 text-left ${
                    options.includeDashes
                      ? "bg-slate-600/50 border-slate-500/50 text-gray-300"
                      : "bg-slate-700/30 border-slate-600/50 text-gray-400 hover:border-slate-500/50"
                  }`}
                >
                  <div className="font-medium">Add Dashes</div>
                  <div className="text-sm opacity-70 mt-1">xxxx-xxxx</div>
                </button>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentPassword(generatePassword())}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:from-emerald-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Generate
            </button>
            <button
              onClick={() => downloadPassword(currentPassword.password)}
              className="bg-slate-700/50 text-gray-300 py-3 px-6 rounded-xl font-medium hover:bg-slate-600/50 transition-all duration-200 flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .slider {
              background: linear-gradient(to right, #10b981 0%, #3b82f6 100%);
              outline: none;
            }
            .slider::-webkit-slider-thumb {
              appearance: none;
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
            .slider::-moz-range-thumb {
              height: 20px;
              width: 20px;
              border-radius: 50%;
              background: #10b981;
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
            }
          `,
        }}
      />
    </div>
  )
}

export default App
