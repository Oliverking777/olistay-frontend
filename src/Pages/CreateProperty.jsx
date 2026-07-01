import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createProperty, suggestRent } from '../api/PropertyApi'
import PropertyForm, { DEFAULT_PROPERTY_FORM, toPropertyPayload } from '../Components/PropertyForm'

const fmtXaf = (n) => (n == null ? '—' : `${Math.round(n).toLocaleString('fr-CM')} XAF`)

function RentSuggestionCard({ suggestion, onUseSuggestion }) {
  if (!suggestion) return null
  return (
    <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15 8.5L22 9.3L17 14.1L18.2 21.02L12 17.77 5.82 21.02 7 14.14 2 9.3 8.91 8.26 12 2Z" />
        </svg>
        <h3 className="text-sm font-bold text-blue-800">AI Rent Suggestion</h3>
      </div>

      <div className="flex items-end gap-2 mb-2">
        <span className="text-2xl font-extrabold text-slate-900">{fmtXaf(suggestion.predictedRent)}</span>
        <span className="text-xs text-slate-500 mb-1">/month</span>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Estimated range: {fmtXaf(suggestion.rentRangeMin)} – {fmtXaf(suggestion.rentRangeMax)}
        {suggestion.modelConfidence && ` · Confidence: ${suggestion.modelConfidence}`}
      </p>

      {suggestion.narration && (
        <p className="text-sm text-slate-700 leading-relaxed mb-3">{suggestion.narration}</p>
      )}

      {!suggestion.neighbourhoodKnown && (
        <p className="text-xs text-amber-600 mb-3">
          ⚠️ This neighbourhood is not well known to the model — the estimate may be less precise.
        </p>
      )}

      <button
        type="button"
        onClick={() => onUseSuggestion(Math.round(suggestion.predictedRent))}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
      >
        Use this amount
      </button>
    </div>
  )
}

const CreateProperty = () => {
  const navigate = useNavigate()
  const [values, setValues] = useState(DEFAULT_PROPERTY_FORM)
  const [imageFiles, setImageFiles] = useState([])

  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [suggestError, setSuggestError] = useState(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const handleSuggestRent = async () => {
    setIsSuggesting(true)
    setSuggestError(null)
    setSuggestion(null)
    try {
      const result = await suggestRent(toPropertyPayload(values))
      setSuggestion(result)
    } catch (err) {
      setSuggestError(err.message || "Unable to get rent suggestion at the moment.")
    } finally {
      setIsSuggesting(false)
    }
  }

  const handleImageChange = (e) => {
    setImageFiles(Array.from(e.target.files || []))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!values.title.trim() || !values.propertyType || !values.city) {
      setSubmitError('Please provide at least the title, property type, and city.')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const created = await createProperty(toPropertyPayload(values), imageFiles)
      navigate('/properties', { state: { justCreatedId: created?.id } })
    } catch (err) {
      setSubmitError(err.message || "An error occurred while creating the listing.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">Create a new listing</h1>
        <p className="text-sm text-slate-500">
          Enter property details. It will be submitted for validation before being published.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
          <PropertyForm values={values} onChange={setValues} />
        </div>

        {/* AI rent suggestion */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Need help setting the rent?</h2>
              <p className="text-xs text-slate-500">Our AI can suggest a rent based on the property features.</p>
            </div>
            <button
              type="button"
              onClick={handleSuggestRent}
              disabled={isSuggesting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
            >
              {isSuggesting ? 'Calculating…' : '✨ Suggest rent'}
            </button>
          </div>

          {suggestError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium mb-2">
              ⚠️ {suggestError}
            </div>
          )}

          <RentSuggestionCard
            suggestion={suggestion}
            onUseSuggestion={(amount) => setValues((v) => ({ ...v, rentXaf: amount }))}
          />
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Photos</h2>
          <p className="text-xs text-slate-500 mb-4">The first image will be used as the main photo.</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {imageFiles.length > 0 && (
            <p className="text-xs text-slate-500 mt-2">{imageFiles.length} file(s) selected</p>
          )}
        </div>

        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium mb-4">
            ⚠️ {submitError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link
            to="/properties"
            className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center no-underline"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            {isSubmitting ? 'Publishing...' : "Publish listing"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateProperty