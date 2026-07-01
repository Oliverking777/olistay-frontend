import React from 'react'
import LocationPickerMap from './LocationPickerMap'

// ---------------------------------------------------------------------------
// Enum options — mirrors olistay.backend.enums.* as referenced across
// Property.java / PropertyRequestDTO / PropertyDetail.jsx's label maps.
// ---------------------------------------------------------------------------

export const PROPERTY_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'DUPLEX', label: 'Duplex' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'BANGALOW', label: 'Bungalow' },
  { value: 'SHOP', label: 'Shop / Commercial' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'WAREHOUSE', label: 'Warehouse' },
  { value: 'LAND', label: 'Land' },
]

const COMMERCIAL_TYPES = ['SHOP', 'OFFICE', 'WAREHOUSE']

export const UNIT_TYPES = [
  { value: 'chambre', label: 'Bedroom' },
  { value: 'T1', label: 'Studio (T1)' },
  { value: 'T2', label: 'Apartment T2' },
  { value: 'T3', label: 'Apartment T3' },
  { value: 'T4', label: 'Apartment T4' },
  { value: 'T5', label: 'Apartment T5' },
]

export const TITLE_TYPES = [
  { value: 'NONE', label: 'No title' },
  { value: 'OCCUPATION', label: 'Occupation permit' },
  { value: 'FONCIER', label: 'Land title' },
]

export const INFRA_ZONES = ['I', 'II', 'III', 'IV', 'V']

export const CITIES = ['Yaounde', 'Douala', 'Bafoussam', 'Limbe', 'Kribi', 'Other']

// ---------------------------------------------------------------------------
// Default form state — mirrors the same fallback defaults
// PropertyServiceImpl.buildPropertyFromRequest() applies server-side, so a
// freshly-opened form already reflects what would happen if a field were
// left untouched.
// ---------------------------------------------------------------------------

export const DEFAULT_PROPERTY_FORM = {
  title: '',
  description: '',
  propertyType: 'APARTMENT',
  unitType: 'T2',
  titleType: 'OCCUPATION',
  city: '',
  neighbourhood: '',
  gpsLat: '',
  gpsLon: '',
  infraZone: 'III',
  lengthM: '',
  widthM: '',
  numBedrooms: 0,
  numBathrooms: 0,
  floorLevel: 0,
  sharedWc: false,
  hasParking: false,
  hasGenerator: false,
  hasWaterMeter: true,
  fiberInternet: false,
  securityGate: false,
  hasGardien: false,
  roadFrontageM: 0,
  shopfrontQuality: 0,
  loadingBay: false,
  standbyPowerKva: 0,
  nearSchool: false,
  nearMarket: false,
  nearHospital: false,
  nearHighway: false,
  nearUniversity: false,
  structuralQuality: 5,
  conditionScore: 5,
  buildYear: '',
  floodRisk: false,
  noiseLevel: 5,
  advanceMonths: 3,
  cautionMonths: 1,
  rentXaf: '',
}

/**
 * Converts the form's string-friendly state into the JSON shape the backend
 * expects: empty strings become null (not ""), numeric fields become
 * numbers. Matches PropertyRequestDTO's nullable Double/Integer fields —
 * sending "" instead of null for an unset number causes a 400 on the
 * Jackson deserialization side.
 */
export function toPropertyPayload(values) {
  const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v))
  return {
    ...values,
    gpsLat: num(values.gpsLat),
    gpsLon: num(values.gpsLon),
    lengthM: num(values.lengthM),
    widthM: num(values.widthM),
    numBedrooms: num(values.numBedrooms),
    numBathrooms: num(values.numBathrooms),
    floorLevel: num(values.floorLevel),
    roadFrontageM: num(values.roadFrontageM),
    shopfrontQuality: num(values.shopfrontQuality),
    standbyPowerKva: num(values.standbyPowerKva),
    structuralQuality: num(values.structuralQuality),
    conditionScore: num(values.conditionScore),
    buildYear: num(values.buildYear),
    noiseLevel: num(values.noiseLevel),
    advanceMonths: num(values.advanceMonths),
    cautionMonths: num(values.cautionMonths),
    rentXaf: num(values.rentXaf),
    description: values.description?.trim() || null,
    neighbourhood: values.neighbourhood?.trim() || null,
  }
}

// ---------------------------------------------------------------------------
// Small field primitives
// ---------------------------------------------------------------------------

const inputClasses = "w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
const labelClasses = "block text-xs font-semibold text-slate-600 mb-1.5"

function Field({ label, children, required }) {
  return (
    <div>
      <label className={labelClasses}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-400"
      />
      {label}
    </label>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="pb-6 mb-6 border-b border-gray-100 last:border-b-0 last:mb-0 last:pb-0">
      <h3 className="text-sm font-bold text-slate-800 mb-0.5">{title}</h3>
      {description && <p className="text-xs text-slate-400 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main form — a pure, controlled field-set. No submit button, no API calls:
// the parent page (CreateProperty / HostPredictions) owns those.
// ---------------------------------------------------------------------------

export default function PropertyForm({ values, onChange, showPricing = true, showTitleDescription = true }) {
  const set = (field) => (value) => onChange({ ...values, [field]: value })
  const setInput = (field) => (e) => onChange({ ...values, [field]: e.target.value })

  const isCommercial = COMMERCIAL_TYPES.includes(values.propertyType)

  // Fired by LocationPickerMap on search-pick, map click, or marker drag.
  // Fills gpsLat/gpsLon straight from the map, and tries to match the
  // reverse-geocoded city against our fixed CITIES list (falls back to
  // 'Other' if it's a place outside that list, e.g. a small town).
  const handleLocationChange = ({ lat, lng, city, neighbourhood }) => {
    const matchedCity = CITIES.find(
      (c) => c.toLowerCase() === (city || '').trim().toLowerCase()
    )
    onChange({
      ...values,
      gpsLat: lat,
      gpsLon: lng,
      city: matchedCity || (city ? 'Other' : values.city),
      neighbourhood: neighbourhood || values.neighbourhood,
    })
  }

  return (
    <div>
      {showTitleDescription && (
<Section title="General Info">
           <div className="space-y-4">
             <Field label="Listing title" required>
               <input type="text" value={values.title} onChange={setInput('title')} placeholder="Ex: Beautiful T3 apartment in Bastos" className={inputClasses} />
             </Field>
             <Field label="Description">
               <textarea rows={3} value={values.description} onChange={setInput('description')} placeholder="Describe the property..." className={inputClasses} />
             </Field>
             <div className="grid grid-cols-2 gap-4">
               <Field label="Property type" required>
                 <select value={values.propertyType} onChange={setInput('propertyType')} className={`${inputClasses} bg-white`}>
                   {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                 </select>
               </Field>
               <Field label="Unit type">
                 <select value={values.unitType} onChange={setInput('unitType')} className={`${inputClasses} bg-white`}>
                   {UNIT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                 </select>
               </Field>
             </div>
           </div>
         </Section>
      )}

<Section title="Location">
         <div className="mb-4">
           <LocationPickerMap
             lat={values.gpsLat}
             lng={values.gpsLon}
             onChange={handleLocationChange}
           />
         </div>
         <div className="grid grid-cols-2 gap-4 mb-4">
           <Field label="City" required>
             <select value={values.city} onChange={setInput('city')} className={`${inputClasses} bg-white`}>
               <option value="">Select...</option>
               {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
             </select>
           </Field>
           <Field label="Neighbourhood">
             <input type="text" value={values.neighbourhood} onChange={setInput('neighbourhood')} placeholder="Ex: Bastos" className={inputClasses} />
           </Field>
         </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Latitude GPS">
            <input type="number" step="any" value={values.gpsLat} onChange={setInput('gpsLat')} className={inputClasses} />
          </Field>
          <Field label="Longitude GPS">
            <input type="number" step="any" value={values.gpsLon} onChange={setInput('gpsLon')} className={inputClasses} />
          </Field>
<Field label="Infrastructure zone">
             <select value={values.infraZone} onChange={setInput('infraZone')} className={`${inputClasses} bg-white`}>
               {INFRA_ZONES.map((z) => <option key={z} value={z}>Zone {z}</option>)}
             </select>
           </Field>
        </div>
      </Section>

      <Section title="Room & Details">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field label="Length (m)">
            <input type="number" step="any" min="0" value={values.lengthM} onChange={setInput('lengthM')} className={inputClasses} />
          </Field>
          <Field label="Width (m)">
            <input type="number" step="any" min="0" value={values.widthM} onChange={setInput('widthM')} className={inputClasses} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Field label="Bedrooms">
            <input type="number" min="0" value={values.numBedrooms} onChange={setInput('numBedrooms')} className={inputClasses} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min="0" value={values.numBathrooms} onChange={setInput('numBathrooms')} className={inputClasses} />
          </Field>
          <Field label="Floor">
            <input type="number" min="0" value={values.floorLevel} onChange={setInput('floorLevel')} className={inputClasses} />
          </Field>
        </div>
        <Checkbox label="Shared bathroom" checked={values.sharedWc} onChange={set('sharedWc')} />
      </Section>

      <Section title="Facilities">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Checkbox label="Parking" checked={values.hasParking} onChange={set('hasParking')} />
          <Checkbox label="Generator" checked={values.hasGenerator} onChange={set('hasGenerator')} />
          <Checkbox label="Water meter" checked={values.hasWaterMeter} onChange={set('hasWaterMeter')} />
          <Checkbox label="Fiber internet" checked={values.fiberInternet} onChange={set('fiberInternet')} />
          <Checkbox label="Security gate" checked={values.securityGate} onChange={set('securityGate')} />
          <Checkbox label="Caretaker" checked={values.hasGardien} onChange={set('hasGardien')} />
        </div>
      </Section>

      {isCommercial && (
<Section title="Commercial Details" description="Specific to shops, offices and warehouses">
           <div className="grid grid-cols-2 gap-4 mb-4">
             <Field label="Street frontage (m)">
               <input type="number" step="any" min="0" value={values.roadFrontageM} onChange={setInput('roadFrontageM')} className={inputClasses} />
             </Field>
             <Field label="Shopfront quality (0-5)">
               <input type="number" min="0" max="5" value={values.shopfrontQuality} onChange={setInput('shopfrontQuality')} className={inputClasses} />
             </Field>
             <Field label="Backup power (kVA)">
               <input type="number" step="any" min="0" value={values.standbyPowerKva} onChange={setInput('standbyPowerKva')} className={inputClasses} />
             </Field>
           </div>
           <Checkbox label="Loading dock" checked={values.loadingBay} onChange={set('loadingBay')} />
         </Section>
      )}

<Section title="Proximity">
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
           <Checkbox label="School nearby" checked={values.nearSchool} onChange={set('nearSchool')} />
           <Checkbox label="Market nearby" checked={values.nearMarket} onChange={set('nearMarket')} />
           <Checkbox label="Hospital nearby" checked={values.nearHospital} onChange={set('nearHospital')} />
           <Checkbox label="Highway nearby" checked={values.nearHighway} onChange={set('nearHighway')} />
           <Checkbox label="University nearby" checked={values.nearUniversity} onChange={set('nearUniversity')} />
         </div>
       </Section>

       <Section title="Quality, Age & Risks">
         <div className="grid grid-cols-2 gap-4 mb-4">
           <Field label="Structural quality (1-10)">
             <input type="number" min="1" max="10" value={values.structuralQuality} onChange={setInput('structuralQuality')} className={inputClasses} />
           </Field>
           <Field label="Condition (1-10)">
             <input type="number" min="1" max="10" value={values.conditionScore} onChange={setInput('conditionScore')} className={inputClasses} />
           </Field>
           <Field label="Build year">
             <input type="number" value={values.buildYear} onChange={setInput('buildYear')} className={inputClasses} />
           </Field>
           <Field label="Noise level (1-10)">
             <input type="number" min="1" max="10" value={values.noiseLevel} onChange={setInput('noiseLevel')} className={inputClasses} />
           </Field>
         </div>
         <Checkbox label="Flood risk" checked={values.floodRisk} onChange={set('floodRisk')} />
       </Section>

       <Section title="Legal & Conditions">
         <div className="grid grid-cols-3 gap-4">
           <Field label="Title type">
             <select value={values.titleType} onChange={setInput('titleType')} className={`${inputClasses} bg-white`}>
               {TITLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
             </select>
           </Field>
           <Field label="Advance (months)">
             <input type="number" min="0" value={values.advanceMonths} onChange={setInput('advanceMonths')} className={inputClasses} />
           </Field>
           <Field label="Deposit (months)">
             <input type="number" min="0" value={values.cautionMonths} onChange={setInput('cautionMonths')} className={inputClasses} />
           </Field>
         </div>
       </Section>

       {showPricing && (
         <Section title="Rent">
           <Field label="Monthly rent requested (XAF)">
             <input type="number" min="0" value={values.rentXaf} onChange={setInput('rentXaf')} placeholder="Ex: 150000" className={inputClasses} />
           </Field>
         </Section>
       )}
     </div>
   )
}