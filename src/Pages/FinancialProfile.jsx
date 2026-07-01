import React, { useEffect, useState } from 'react'
import {
  getFinancialProfileRequest,
  createFinancialProfileRequest,
  updateFinancialProfileRequest,
  computeFinancialProfileRequest,
  deleteFinancialProfileRequest,
} from '../api/FinancialProfileApi'


// ─── Labels (mirror backend enum comments exactly) ─────────────────────────
const INCOME_STABILITY_LABELS = {
  stable: 'Stable',
  variable: 'Variable',
  seasonal: 'Saisonnier',
  irregular: 'Irrégulier',
}

const JOB_SECTOR_LABELS = {
  formal_private: 'Secteur privé formel',
  formal_public: 'Secteur public formel',
  informal_self_employed: 'Indépendant informel',
  informal_employee: 'Employé informel',
  business_owner: "Chef d'entreprise",
  student: 'Étudiant',
  unemployed: 'Sans emploi',
  retired: 'Retraité',
}

const CITY_LABELS = {
  yaounde: 'Yaoundé',
  douala: 'Douala',
  other: 'Autre ville',
}

// ─── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n === null || n === undefined ? '—' : `${Number(n).toLocaleString('fr-CM')} XAF`)
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${Math.round(n)}%`)
const num = (v) => (v === '' || v === null || v === undefined ? 0 : Number(v))

const newIncomeSource = () => ({
  _cid: Math.random().toString(36).slice(2),
  incomeType: '',
  description: '',
  monthlyAmount: '',
})

const EMPTY_EXPENSE_BREAKDOWN = {
  housingUtilities: 0,
  foodHouseholdSupplies: 0,
  transportation: 0,
  personalHealthInsurance: 0,
  debtRepayments: 0,
  dependentsSupport: 0,
  other: 0,
}

const EMPTY_FUNDS_BREAKDOWN = {
  checkingAccount: 0,
  savingsAccount: 0,
  cashOnHand: 0,
  mobileMoney: 0,
  other: 0,
}

const emptyProfile = () => ({
  monthlyIncome: '',
  savingsGoal: 0,
  additionalIncomeSources: [],
  incomeStability: 'stable',
  jobSector: 'formal_private',
  employerName: '',
  jobTitle: '',
  currentCity: 'yaounde',
  currentNeighbourhood: '',
  gpsLat: null,
  gpsLon: null,
  householdSize: 1,
  hasDependents: false,
  numDependents: 0,
  numRoommates: 0,
  sharesHousingCosts: false,
  fixedObligations: 0,
  expenseBreakdown: null,
  goalTimelineMonths: 12,
  currentSavings: 0,
  availableFundsBreakdown: null,
  hasFinancialEmergency: false,
  needsParking: false,
  needsSchoolNearby: false,
  needsHospitalNearby: false,
  needsGenerator: false,
})

// ─── Small reusable form bits ───────────────────────────────────────────────
function CurrencyField({ label, field, data, onChange, hint, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type="number"
          value={data[field]}
          onChange={(e) => onChange(field, e.target.value === '' ? '' : Number(e.target.value))}
          className="w-full px-4 py-3 pr-16 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          placeholder="0"
          min={0}
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">XAF</span>
      </div>
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function CounterField({ label, field, data, onChange, min = 0, suffix = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(field, Math.max(min, (data[field] || 0) - 1))}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold"
        >
          −
        </button>
        <span className="w-10 text-center text-xl font-bold text-slate-800">{data[field] || 0}</span>
        <button
          type="button"
          onClick={() => onChange(field, (data[field] || 0) + 1)}
          className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors text-lg font-bold"
        >
          +
        </button>
        {suffix && <span className="text-sm text-slate-500">{suffix}</span>}
      </div>
    </div>
  )
}

function ToggleRow({ label, field, data, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        onClick={() => onChange(field, !data[field])}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
          data[field] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
        }`}
      >
        {data[field] && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-sm text-slate-600">{label}</span>
    </label>
  )
}

function SelectField({ label, field, data, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={data[field]}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 bg-white transition-colors"
      >
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Step 1 — Income ─────────────────────────────────────────────────────────
function StepIncome({ data, onChange }) {
  const sources = data.additionalIncomeSources || []

  const updateSource = (cid, key, value) => {
    onChange(
      'additionalIncomeSources',
      sources.map((s) => (s._cid === cid ? { ...s, [key]: value } : s))
    )
  }

  const addSource = () => onChange('additionalIncomeSources', [...sources, newIncomeSource()])
  const removeSource = (cid) => onChange('additionalIncomeSources', sources.filter((s) => s._cid !== cid))

  return (
    <div className="space-y-5">
      <CurrencyField
        label="Revenu mensuel de base"
        field="monthlyIncome"
        data={data}
        onChange={onChange}
        required
        hint="Salaire net après impôts, source principale uniquement."
      />

      <SelectField label="Stabilité du revenu" field="incomeStability" data={data} onChange={onChange} options={INCOME_STABILITY_LABELS} required />
      <SelectField label="Secteur d'activité" field="jobSector" data={data} onChange={onChange} options={JOB_SECTOR_LABELS} required />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Employeur / Structure</label>
        <input
          type="text"
          value={data.employerName || ''}
          onChange={(e) => onChange('employerName', e.target.value)}
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          placeholder="Nom de l'employeur ou entreprise"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Intitulé du poste</label>
        <input
          type="text"
          value={data.jobTitle || ''}
          onChange={(e) => onChange('jobTitle', e.target.value)}
          className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          placeholder="Ex: Comptable, Vendeuse, Chauffeur..."
        />
      </div>

      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-700">Autres sources de revenu</p>
          <button
            type="button"
            onClick={addSource}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + Ajouter
          </button>
        </div>

        {sources.length === 0 && (
          <p className="text-xs text-slate-400">Aucune source supplémentaire ajoutée.</p>
        )}

        <div className="space-y-3">
          {sources.map((s) => (
            <div key={s._cid} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={s.incomeType}
                  onChange={(e) => updateSource(s._cid, 'incomeType', e.target.value)}
                  placeholder="Type (ex: location, commerce...)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => removeSource(s._cid)}
                  className="text-red-400 hover:text-red-600 text-xs font-semibold flex-shrink-0"
                >
                  Retirer
                </button>
              </div>
              <input
                type="text"
                value={s.description}
                onChange={(e) => updateSource(s._cid, 'description', e.target.value)}
                placeholder="Description (optionnel)"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <div className="relative">
                <input
                  type="number"
                  value={s.monthlyAmount}
                  onChange={(e) => updateSource(s._cid, 'monthlyAmount', e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  min={0}
                  className="w-full px-3 py-2 pr-14 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">XAF</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 — Expenses ───────────────────────────────────────────────────────
function StepExpenses({ data, onChange, useBreakdown, setUseBreakdown }) {
  const breakdown = data.expenseBreakdown || EMPTY_EXPENSE_BREAKDOWN

  const updateBreakdown = (key, value) => {
    onChange('expenseBreakdown', { ...breakdown, [key]: value === '' ? '' : Number(value) })
  }

  const total = Object.values(breakdown).reduce((sum, v) => sum + (Number(v) || 0), 0)

  const toggleBreakdown = (on) => {
    setUseBreakdown(on)
    onChange('expenseBreakdown', on ? { ...EMPTY_EXPENSE_BREAKDOWN, ...breakdown } : null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => toggleBreakdown(false)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            !useBreakdown ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Montant global
        </button>
        <button
          type="button"
          onClick={() => toggleBreakdown(true)}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            useBreakdown ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
          }`}
        >
          Détail par poste
        </button>
      </div>

      {!useBreakdown ? (
        <CurrencyField
          label="Total des charges fixes mensuelles"
          field="fixedObligations"
          data={data}
          onChange={onChange}
          hint="Loyer, factures, transport, crédits, etc. — tout confondu."
        />
      ) : (
        <div className="space-y-4">
          {[
            ['housingUtilities', 'Logement & factures (eau, électricité, internet)'],
            ['foodHouseholdSupplies', 'Alimentation & courses'],
            ['transportation', 'Transport'],
            ['personalHealthInsurance', 'Santé / assurance'],
            ['debtRepayments', 'Remboursements de crédits'],
            ['dependentsSupport', 'Soutien aux personnes à charge'],
            ['other', 'Autres charges'],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={breakdown[key]}
                  onChange={(e) => updateBreakdown(key, e.target.value)}
                  className="w-full px-4 py-3 pr-16 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                  placeholder="0"
                  min={0}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">XAF</span>
              </div>
            </div>
          ))}

          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-slate-600">Total des charges mensuelles</span>
            <span className="text-sm font-bold text-slate-800">{fmt(total)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 3 — Household ──────────────────────────────────────────────────────
function StepHousehold({ data, onChange }) {
  return (
    <div className="space-y-5">
      <CounterField label="Nombre de personnes dans le ménage" field="householdSize" data={data} onChange={onChange} min={1} suffix="personne(s)" />

      <ToggleRow label="J'ai des personnes à charge" field="hasDependents" data={data} onChange={onChange} />
      {data.hasDependents && (
        <CounterField label="Nombre de personnes à charge" field="numDependents" data={data} onChange={onChange} min={0} suffix="personne(s)" />
      )}

      <CounterField label="Nombre de colocataires" field="numRoommates" data={data} onChange={onChange} min={0} suffix="personne(s)" />
      <ToggleRow label="Je partage les frais de logement avec d'autres" field="sharesHousingCosts" data={data} onChange={onChange} />

      <div className="pt-2 border-t border-gray-100 space-y-4">
        <SelectField label="Ville actuelle" field="currentCity" data={data} onChange={onChange} options={CITY_LABELS} />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Quartier actuel</label>
          <input
            type="text"
            value={data.currentNeighbourhood || ''}
            onChange={(e) => onChange('currentNeighbourhood', e.target.value)}
            className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
            placeholder="Ex: Bastos, Ngousso, Akwa..."
          />
        </div>
      </div>
    </div>
  )
}

// ─── Step 4 — Savings & Goals ────────────────────────────────────────────────
function StepSavings({ data, onChange, useFundsBreakdown, setUseFundsBreakdown }) {
  const breakdown = data.availableFundsBreakdown || EMPTY_FUNDS_BREAKDOWN

  const updateBreakdown = (key, value) => {
    onChange('availableFundsBreakdown', { ...breakdown, [key]: value === '' ? '' : Number(value) })
  }

  const total = Object.values(breakdown).reduce((sum, v) => sum + (Number(v) || 0), 0)

  const toggleBreakdown = (on) => {
    setUseFundsBreakdown(on)
    onChange('availableFundsBreakdown', on ? { ...EMPTY_FUNDS_BREAKDOWN, ...breakdown } : null)
  }

  return (
    <div className="space-y-5">
      <CurrencyField label="Objectif d'épargne mensuelle" field="savingsGoal" data={data} onChange={onChange} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Délai pour atteindre cet objectif <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={36}
            value={data.goalTimelineMonths || 12}
            onChange={(e) => onChange('goalTimelineMonths', Number(e.target.value))}
            className="flex-1 accent-blue-600"
          />
          <span className="text-sm font-bold text-slate-800 w-20 text-right">{data.goalTimelineMonths || 12} mois</span>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-100">
        <p className="text-sm font-medium text-slate-700 mb-3">Fonds disponibles actuellement</p>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit mb-4">
          <button
            type="button"
            onClick={() => toggleBreakdown(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              !useFundsBreakdown ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Montant global
          </button>
          <button
            type="button"
            onClick={() => toggleBreakdown(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              useFundsBreakdown ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            Détail par source
          </button>
        </div>

        {!useFundsBreakdown ? (
          <CurrencyField label="Épargne actuelle totale" field="currentSavings" data={data} onChange={onChange} />
        ) : (
          <div className="space-y-4">
            {[
              ['checkingAccount', 'Compte courant'],
              ['savingsAccount', "Compte d'épargne"],
              ['cashOnHand', 'Espèces disponibles'],
              ['mobileMoney', 'Mobile Money (MTN MoMo, Orange Money)'],
              ['other', 'Autres'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={breakdown[key]}
                    onChange={(e) => updateBreakdown(key, e.target.value)}
                    className="w-full px-4 py-3 pr-16 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
                    placeholder="0"
                    min={0}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">XAF</span>
                </div>
              </div>
            ))}
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span className="text-sm text-slate-600">Total des fonds disponibles</span>
              <span className="text-sm font-bold text-slate-800">{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-gray-100">
        <ToggleRow label="Je traverse actuellement une urgence financière" field="hasFinancialEmergency" data={data} onChange={onChange} />
      </div>
    </div>
  )
}

// ─── Step 5 — Housing preferences ────────────────────────────────────────────
function StepPreferences({ data, onChange }) {
  const prefs = [
    { field: 'needsParking', label: 'Parking nécessaire' },
    { field: 'needsSchoolNearby', label: "École à proximité" },
    { field: 'needsHospitalNearby', label: 'Hôpital / centre de santé à proximité' },
    { field: 'needsGenerator', label: 'Accès à un groupe électrogène' },
  ]
  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 -mt-2 mb-2">
        Ces préférences affectent le classement des logements recommandés, pas votre capacité financière.
      </p>
      {prefs.map(({ field, label }) => (
        <button
          key={field}
          type="button"
          onClick={() => onChange(field, !data[field])}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium text-left transition-colors ${
            data[field] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              data[field] ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'
            }`}
          >
            {data[field] && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          {label}
        </button>
      ))}
    </div>
  )
}

// ─── Summary / Profile View ───────────────────────────────────────────────────
function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-500 flex-shrink-0">{icon}</span>
        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Row({ label, value, valueClass = 'text-slate-800' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  )
}

function badgeTone(value) {
  if (!value) return 'bg-slate-100 text-slate-600'
  const v = value.toLowerCase()
  if (/good|healthy|strong|excellent|low/.test(v)) return 'bg-emerald-100 text-emerald-700'
  if (/risk|critical|poor|severe|high/.test(v)) return 'bg-red-100 text-red-700'
  if (/moderate|fair|tight|medium/.test(v)) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-600'
}

function ProfileSummary({ profile, computed, computeError, onEdit, onDelete }) {
  const totalSources = (profile.additionalIncomeSources || []).length
  const expenseUsesBreakdown = !!profile.expenseBreakdown
  const fundsUsesBreakdown = !!profile.availableFundsBreakdown

  const expenseTotal = expenseUsesBreakdown
    ? Object.values(profile.expenseBreakdown).reduce((s, v) => s + (Number(v) || 0), 0)
    : profile.fixedObligations || 0

  const fundsTotal = fundsUsesBreakdown
    ? Object.values(profile.availableFundsBreakdown).reduce((s, v) => s + (Number(v) || 0), 0)
    : profile.currentSavings || 0

  return (
    <div className="space-y-4">
      {/* Affordability header — live from /compute */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-1">Capacité de logement estimée</p>

        {computeError ? (
          <p className="text-blue-100 text-sm py-2">
            Calcul indisponible pour le moment ({computeError}). Vos données sont bien enregistrées.
          </p>
        ) : !computed ? (
          <p className="text-blue-100 text-sm py-2">Calcul en cours…</p>
        ) : (
          <>
            <div className="flex items-end gap-3 mb-1">
              <span className="text-4xl font-extrabold">{fmt(computed.max_sustainable_rent)}</span>
              <span className="text-blue-200 text-sm mb-1">/ mois max</span>
            </div>
            {(computed.recommended_rent_range_min || computed.recommended_rent_range_max) && (
              <p className="text-blue-200 text-xs mb-4">
                Fourchette recommandée : {fmt(computed.recommended_rent_range_min)} – {fmt(computed.recommended_rent_range_max)}
              </p>
            )}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-blue-500">
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Revenu effectif</p>
                <p className="text-white font-bold text-sm">{fmt(computed.effective_monthly_income)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Charges effectives</p>
                <p className="text-white font-bold text-sm">{fmt(computed.effective_fixed_obligations)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs mb-0.5">Revenu disponible</p>
                <p className="text-white font-bold text-sm">{fmt(computed.true_disposable ?? computed.disposable_income)}</p>
              </div>
            </div>
            {computed.financial_health && (
              <div className="flex items-center gap-2 mt-4">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${badgeTone(computed.financial_health)}`}>
                  Santé financière : {computed.financial_health}
                </span>
                {computed.profile_completeness_pct != null && (
                  <span className="text-xs text-blue-200">
                    Profil complet à {fmtPct(computed.profile_completeness_pct)}
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {computed?.summary && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">{computed.summary}</p>
        </div>
      )}

      {computed?.data_quality_notes?.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="text-amber-500 text-xl mt-0.5">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">À noter</p>
            <ul className="text-xs text-amber-700 mt-1 space-y-0.5 list-disc list-inside">
              {computed.data_quality_notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {computed && (computed.emergency_fund_target != null || computed.typical_advance_amount != null) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {computed.emergency_fund_target != null && (
            <SectionCard
              title="Fonds d'urgence"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
            >
              <Row label="Objectif" value={fmt(computed.emergency_fund_target)} />
              <Row label="Statut" value={
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeTone(computed.emergency_fund_status)}`}>
                  {computed.emergency_fund_status}
                </span>
              } />
              {computed.months_to_emergency_fund != null && (
                <Row label="Temps estimé" value={`${Math.round(computed.months_to_emergency_fund)} mois`} />
              )}
            </SectionCard>
          )}

          {computed.typical_advance_amount != null && (
            <SectionCard
              title="Avance locative typique"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
            >
              <Row label="Montant typique" value={fmt(computed.typical_advance_amount)} />
              <Row
                label="Capacité à payer"
                value={computed.can_afford_typical_advance ? 'Oui' : 'Non'}
                valueClass={computed.can_afford_typical_advance ? 'text-emerald-600' : 'text-red-600'}
              />
              {computed.advance_shortfall > 0 && (
                <Row label="Manque à gagner" value={fmt(computed.advance_shortfall)} valueClass="text-red-600" />
              )}
              {computed.advance_burden && (
                <Row label="Charge de l'avance" value={
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${badgeTone(computed.advance_burden)}`}>
                    {computed.advance_burden}
                  </span>
                } />
              )}
            </SectionCard>
          )}
        </div>
      )}

      {/* Raw saved data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Revenus" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}>
          <Row label="Revenu mensuel de base" value={fmt(profile.monthlyIncome)} />
          <Row label="Stabilité" value={INCOME_STABILITY_LABELS[profile.incomeStability] || '—'} />
          <Row label="Secteur" value={JOB_SECTOR_LABELS[profile.jobSector] || '—'} />
          {profile.employerName && <Row label="Employeur" value={profile.employerName} />}
          {profile.jobTitle && <Row label="Poste" value={profile.jobTitle} />}
          <Row label="Autres sources de revenu" value={`${totalSources} source(s)`} />
        </SectionCard>

        <SectionCard title="Charges mensuelles" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}>
          <Row label="Mode de saisie" value={expenseUsesBreakdown ? 'Détail par poste' : 'Montant global'} />
          <Row label="Total charges" value={fmt(expenseTotal)} valueClass="text-slate-900 font-bold" />
        </SectionCard>

        <SectionCard title="Ménage" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}>
          <Row label="Personnes dans le ménage" value={`${profile.householdSize} personne(s)`} />
          <Row label="Personnes à charge" value={profile.hasDependents ? `${profile.numDependents} personne(s)` : 'Aucune'} />
          <Row label="Colocataires" value={`${profile.numRoommates} personne(s)`} />
          <Row label="Frais partagés" value={profile.sharesHousingCosts ? 'Oui' : 'Non'} />
          <Row label="Ville" value={CITY_LABELS[profile.currentCity] || '—'} />
          {profile.currentNeighbourhood && <Row label="Quartier" value={profile.currentNeighbourhood} />}
        </SectionCard>

        <SectionCard title="Épargne & objectifs" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>}>
          <Row label="Objectif d'épargne" value={fmt(profile.savingsGoal)} />
          <Row label="Délai" value={`${profile.goalTimelineMonths} mois`} />
          <Row label="Fonds disponibles" value={fmt(fundsTotal)} />
          <Row
            label="Urgence financière"
            value={profile.hasFinancialEmergency ? 'Oui' : 'Non'}
            valueClass={profile.hasFinancialEmergency ? 'text-red-600 font-semibold' : 'text-slate-800'}
          />
        </SectionCard>
      </div>

      <SectionCard title="Préférences de logement" icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}>
        <div className="flex flex-wrap gap-2">
          {[
            profile.needsParking && 'Parking',
            profile.needsSchoolNearby && 'École à proximité',
            profile.needsHospitalNearby && 'Hôpital à proximité',
            profile.needsGenerator && 'Groupe électrogène',
          ].filter(Boolean).length > 0 ? (
            [
              profile.needsParking && 'Parking',
              profile.needsSchoolNearby && 'École à proximité',
              profile.needsHospitalNearby && 'Hôpital à proximité',
              profile.needsGenerator && 'Groupe électrogène',
            ]
              .filter(Boolean)
              .map((p) => (
                <span key={p} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{p}</span>
              ))
          ) : (
            <span className="text-xs text-slate-400">Aucune préférence sélectionnée</span>
          )}
        </div>
      </SectionCard>

      <button
        onClick={onEdit}
        className="w-full py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold text-sm rounded-xl transition-colors"
      >
        Modifier mon profil financier
      </button>

      <button
        onClick={onDelete}
        className="w-full py-2.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors"
      >
        Supprimer mon profil financier
      </button>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const STEPS = ['Revenus', 'Charges', 'Ménage', 'Épargne', 'Préférences']
const STEP_TITLES = ['Vos revenus', 'Vos charges mensuelles', 'Votre ménage', 'Épargne & objectifs', 'Préférences de logement']

const FinancialProfile = () => {
  const [mode, setMode] = useState('loading') // 'loading' | 'view' | 'edit'
  const [isCreating, setIsCreating] = useState(false) // true = no profile exists yet, POST instead of PUT
  const [currentStep, setCurrentStep] = useState(0)

  const [profile, setProfile] = useState(emptyProfile())
  const [computed, setComputed] = useState(null)
  const [computeError, setComputeError] = useState(null)

  const [loadError, setLoadError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [useExpenseBreakdown, setUseExpenseBreakdown] = useState(false)
  const [useFundsBreakdown, setUseFundsBreakdown] = useState(false)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const loadCompute = async () => {
    setComputeError(null)
    try {
      const data = await computeFinancialProfileRequest()
      setComputed(data)
    } catch (err) {
      setComputed(null)
      setComputeError(err.message)
    }
  }

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await getFinancialProfileRequest()
        if (cancelled) return
        setProfile({ ...emptyProfile(), ...data, additionalIncomeSources: (data.additionalIncomeSources || []).map((s) => ({ ...s, _cid: Math.random().toString(36).slice(2) })) })
        setUseExpenseBreakdown(!!data.expenseBreakdown)
        setUseFundsBreakdown(!!data.availableFundsBreakdown)
        setIsCreating(false)
        setMode('view')
        await loadCompute()
      } catch (err) {
        if (cancelled) return
        if (err.status === 404) {
          // No profile yet — go straight into the create wizard.
          setIsCreating(true)
          setMode('edit')
        } else {
          setLoadError(err.message)
          setMode('view')
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }))
    setSavedSuccess(false)
  }

  const buildPayload = () => ({
    monthlyIncome: num(profile.monthlyIncome),
    savingsGoal: num(profile.savingsGoal),
    additionalIncomeSources: (profile.additionalIncomeSources || []).map(({ _cid, ...rest }) => ({
      ...rest,
      monthlyAmount: num(rest.monthlyAmount),
    })),
    incomeStability: profile.incomeStability,
    jobSector: profile.jobSector,
    employerName: profile.employerName || null,
    jobTitle: profile.jobTitle || null,
    currentCity: profile.currentCity,
    currentNeighbourhood: profile.currentNeighbourhood || null,
    gpsLat: profile.gpsLat,
    gpsLon: profile.gpsLon,
    householdSize: profile.householdSize || 1,
    hasDependents: !!profile.hasDependents,
    numDependents: profile.hasDependents ? num(profile.numDependents) : 0,
    numRoommates: num(profile.numRoommates),
    sharesHousingCosts: !!profile.sharesHousingCosts,
    fixedObligations: useExpenseBreakdown ? 0 : num(profile.fixedObligations),
    expenseBreakdown: useExpenseBreakdown
      ? Object.fromEntries(Object.entries(profile.expenseBreakdown || EMPTY_EXPENSE_BREAKDOWN).map(([k, v]) => [k, num(v)]))
      : null,
    goalTimelineMonths: profile.goalTimelineMonths || 12,
    currentSavings: useFundsBreakdown ? 0 : num(profile.currentSavings),
    availableFundsBreakdown: useFundsBreakdown
      ? Object.fromEntries(Object.entries(profile.availableFundsBreakdown || EMPTY_FUNDS_BREAKDOWN).map(([k, v]) => [k, num(v)]))
      : null,
    hasFinancialEmergency: !!profile.hasFinancialEmergency,
    needsParking: !!profile.needsParking,
    needsSchoolNearby: !!profile.needsSchoolNearby,
    needsHospitalNearby: !!profile.needsHospitalNearby,
    needsGenerator: !!profile.needsGenerator,
  })

  const validateStep = (step) => {
    if (step === 0 && (!profile.monthlyIncome || Number(profile.monthlyIncome) <= 0)) {
      return 'Le revenu mensuel de base doit être supérieur à 0.'
    }
    if (step === 2 && (!profile.householdSize || profile.householdSize < 1)) {
      return 'Le ménage doit compter au moins 1 personne.'
    }
    if (step === 3 && (!profile.goalTimelineMonths || profile.goalTimelineMonths < 1)) {
      return "Le délai d'objectif doit être d'au moins 1 mois."
    }
    return null
  }

  const [stepError, setStepError] = useState(null)

  const goNext = () => {
    const err = validateStep(currentStep)
    if (err) {
      setStepError(err)
      return
    }
    setStepError(null)
    setCurrentStep((s) => s + 1)
  }

  const handleSave = async () => {
    const err = validateStep(0) || validateStep(2) || validateStep(3)
    if (err) {
      setSaveError(err)
      return
    }

    setSaveError(null)
    setIsSaving(true)
    try {
      const payload = buildPayload()
      const saved = isCreating
        ? await createFinancialProfileRequest(payload)
        : await updateFinancialProfileRequest(payload)

      setProfile({ ...emptyProfile(), ...saved, additionalIncomeSources: (saved.additionalIncomeSources || []).map((s) => ({ ...s, _cid: Math.random().toString(36).slice(2) })) })
      setIsCreating(false)
      setIsSaving(false)
      setSavedSuccess(true)
      setMode('view')
      setCurrentStep(0)
      loadCompute()
    } catch (err2) {
      setIsSaving(false)
      setSaveError(err2.message)
    }
  }

  const handleDelete = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteFinancialProfileRequest()
      setProfile(emptyProfile())
      setComputed(null)
      setIsCreating(true)
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setMode('edit')
      setCurrentStep(0)
    } catch (err) {
      setIsDeleting(false)
      setDeleteError(err.message)
    }
  }

  const stepComponents = [
    <StepIncome key={0} data={profile} onChange={handleChange} />,
    <StepExpenses key={1} data={profile} onChange={handleChange} useBreakdown={useExpenseBreakdown} setUseBreakdown={setUseExpenseBreakdown} />,
    <StepHousehold key={2} data={profile} onChange={handleChange} />,
    <StepSavings key={3} data={profile} onChange={handleChange} useFundsBreakdown={useFundsBreakdown} setUseFundsBreakdown={setUseFundsBreakdown} />,
    <StepPreferences key={4} data={profile} onChange={handleChange} />,
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
                <path d="M7 10h2l2-4 2 8 2-4h2" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Profil Financier</h1>
              <p className="text-xs text-slate-500">Utilisé par l'IA Olistay pour évaluer la compatibilité de chaque logement</p>
            </div>
          </div>
        </div>

        {mode === 'loading' && (
          <div className="py-16 text-center text-sm text-slate-400">Chargement de votre profil…</div>
        )}

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            Impossible de charger votre profil : {loadError}
          </div>
        )}

        {savedSuccess && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-emerald-500">✓</span>
            <span className="text-sm text-emerald-700 font-medium">Profil enregistré. Vos recommandations ont été mises à jour.</span>
          </div>
        )}

        {mode === 'view' && (
          <ProfileSummary
            profile={profile}
            computed={computed}
            computeError={computeError}
            onEdit={() => { setMode('edit'); setCurrentStep(0); setSavedSuccess(false); setSaveError(null) }}
            onDelete={() => setShowDeleteConfirm(true)}
          />
        )}

        {mode === 'edit' && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {isCreating && (
              <div className="px-6 pt-5">
                <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                  Vous n'avez pas encore de profil financier. Complétez les 5 étapes pour obtenir vos recommandations personnalisées.
                </div>
              </div>
            )}

            {/* Progress Steps */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                {STEPS.map((label, i) => (
                  <React.Fragment key={i}>
                    <button
                      type="button"
                      onClick={() => { setStepError(null); setCurrentStep(i) }}
                      className="flex flex-col items-center gap-1 group"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i < currentStep
                          ? 'bg-blue-600 text-white'
                          : i === currentStep
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                            : 'bg-gray-100 text-slate-400'
                      }`}>
                        {i < currentStep ? (
                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className={`text-[10px] font-medium ${i === currentStep ? 'text-blue-600' : 'text-slate-400'}`}>
                        {label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-1 mb-4 transition-colors ${i < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="px-6 py-6">
              <h2 className="text-base font-semibold text-slate-800 mb-5">{STEP_TITLES[currentStep]}</h2>
              {stepComponents[currentStep]}
              {stepError && <p className="text-sm text-red-600 mt-4">{stepError}</p>}
              {currentStep === STEPS.length - 1 && saveError && (
                <p className="text-sm text-red-600 mt-4">{saveError}</p>
              )}
            </div>

            {/* Navigation */}
            <div className="px-6 pb-6 flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={() => { setStepError(null); setCurrentStep((s) => s - 1) }}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ← Précédent
                </button>
              )}

              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Suivant →
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSave}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  {isSaving ? 'Enregistrement…' : '✓ Enregistrer le profil'}
                </button>
              )}
            </div>

            {/* Cancel — only when a profile already exists */}
            {!isCreating && (
              <div className="px-6 pb-5 text-center">
                <button
                  type="button"
                  onClick={() => { setMode('view'); setCurrentStep(0); setStepError(null); setSaveError(null) }}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-3">Supprimer votre profil financier ?</h3>
            <p className="text-sm text-slate-600">
              Vos recommandations personnalisées ne fonctionneront plus tant que vous n'aurez pas recréé un profil.
            </p>
            {deleteError && <p className="text-sm text-red-600 mt-3">{deleteError}</p>}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-1.5 text-sm font-semibold text-slate-600 rounded-md hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinancialProfile