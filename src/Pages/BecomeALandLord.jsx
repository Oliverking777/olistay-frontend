import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import { becomeHostRequest } from '../api/UserApi'

const BecomeALandLord = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [formValues, setFormValues] = useState({
    nationalIdNumber: '',
    cityOfOperation: '',
    intendedPropertyCount: 1,
  })

  // Status States
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [successData, setSuccessData] = useState(null)

  // Handlers
  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }))
    setSubmitError(null)
  }

  const validateForm = () => {
    const { nationalIdNumber, cityOfOperation, intendedPropertyCount } = formValues
    
    if (!nationalIdNumber.trim()) {
      return "Le numéro de CNI / Carte d'identité nationale est obligatoire."
    }
    const idRegex = /^[A-Z0-9]{6,20}$/
    if (!idRegex.test(nationalIdNumber.trim().toUpperCase())) {
      return "Le numéro d'identifiant doit contenir entre 6 et 20 caractères alphanumériques (lettres et chiffres sans espaces)."
    }
    if (!cityOfOperation.trim()) {
      return "La ville principale d'opération est obligatoire."
    }
    if (!intendedPropertyCount || Number(intendedPropertyCount) < 1) {
      return "Vous devez prévoir de lister au moins 1 logement."
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const payload = {
        nationalIdNumber: formValues.nationalIdNumber.trim().toUpperCase(),
        cityOfOperation: formValues.cityOfOperation.trim(),
        intendedPropertyCount: Number(formValues.intendedPropertyCount),
      }

      const response = await becomeHostRequest(payload)
      setSuccessData(response)
    } catch (err) {
      setSubmitError(err.message || "Une erreur est survenue lors de votre demande.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Guard: If not authenticated, prompt user to sign in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Connexion requise</h1>
          <p className="text-sm text-slate-500 mb-6">
            Vous devez être connecté à votre compte Olistay pour postuler au statut de bailleur.
          </p>
          <Link
            to="/sign-in"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors no-underline shadow-sm"
          >
            Se connecter
          </Link>
        </div>
      </div>
    )
  }

  // Guard: If already promoted to HOST, there's nothing to apply for.
  if (isAuthenticated && user?.role === 'HOST') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
        <div className="max-w-md w-full text-center bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Vous êtes déjà bailleur</h1>
          <p className="text-sm text-slate-500 mb-6">
            Votre compte a déjà le statut Bailleur (HOST). Gérez vos propriétés depuis votre espace bailleur.
          </p>
          <Link
            to="/properties/me"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors no-underline shadow-sm"
          >
            Accéder à mon espace bailleur
          </Link>
        </div>
      </div>
    )
  }

  // Success view
  if (successData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-16">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Félicitations !</h1>
          <p className="text-sm text-slate-600 mb-6">
            Votre compte a été promu avec succès au rôle de <strong>Bailleur (HOST)</strong>. Vous pouvez désormais ajouter vos propriétés et suivre vos performances.
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2 mb-6">
            <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
              <span className="text-slate-500">Ville opérationnelle :</span>
              <span className="font-semibold text-slate-700">{successData.cityOfOperation}</span>
            </div>
            <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
              <span className="text-slate-500">Objectif initial de logements :</span>
              <span className="font-semibold text-slate-700">{successData.intendedPropertyCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Statut du compte :</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">HOST</span>
            </div>
          </div>

          <button
            onClick={() => {
              // Redirect to portfolio management page
              window.location.href = '/properties/me'
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
          >
            Accéder à mon espace bailleur
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Devenir Bailleur</h1>
              <p className="text-xs text-slate-500">Créez votre profil hôte pour commencer à lister vos biens sur Olistay</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm p-6 sm:p-8">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 leading-relaxed">
            Établissez votre identité de base et vos intentions de mise en location afin de qualifier votre profil pour le marché immobilier Camerounais.
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* National ID field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Numéro d'Identifiant National (CNI / Passeport) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                maxLength={20}
                value={formValues.nationalIdNumber}
                onChange={(e) => handleChange('nationalIdNumber', e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors uppercase font-mono tracking-wider"
                placeholder="Ex: LT1234567"
              />
              <p className="text-xs text-slate-400 mt-1">De 6 à 20 caractères alphanumériques. Requis pour le référencement légal de base.</p>
            </div>

            {/* City of operation field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ville principale d'opération <span className="text-red-500">*</span>
              </label>
              <select
                value={formValues.cityOfOperation}
                onChange={(e) => handleChange('cityOfOperation', e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-colors"
              >
                <option value="">Sélectionnez une ville...</option>
                <option value="Yaoundé">Yaoundé</option>
                <option value="Douala">Douala</option>
                <option value="Bafoussam">Bafoussam</option>
                <option value="Limbe">Limbe</option>
                <option value="Kribi">Kribi</option>
                <option value="Autre">Autre ville</option>
              </select>
            </div>

            {/* Intended property count field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre de propriétés prévues à la location <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('intendedPropertyCount', Math.max(1, formValues.intendedPropertyCount - 1))}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold select-none"
                >
                  −
                </button>
                <span className="w-12 text-center text-xl font-bold text-slate-800">
                  {formValues.intendedPropertyCount}
                </span>
                <button
                  type="button"
                  onClick={() => handleChange('intendedPropertyCount', formValues.intendedPropertyCount + 1)}
                  className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold select-none"
                >
                  +
                </button>
                <span className="text-sm text-slate-500">propriété(s)</span>
              </div>
            </div>

            {/* Error Display */}
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                ⚠️ {submitError}
              </div>
            )}

            {/* Form actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
              <Link
                to="/account-settings"
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors text-center no-underline"
              >
                Annuler
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {isSubmitting ? 'Validation en cours…' : '✓ Confirmer le statut bailleur'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}

export default BecomeALandLord