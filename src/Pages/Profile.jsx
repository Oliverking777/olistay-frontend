import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../Context/AuthContext'
import {
  getCurrentUserRequest,
  updateCurrentUserRequest,
  deleteCurrentUserRequest,
} from '../api/UserApi'

const BackArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 6L9 12L15 18"
      stroke="#2563EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const AvatarPlaceholderIcon = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="24" r="23" fill="#F3F4F6" stroke="#E5E7EB" />
    <circle cx="24" cy="19" r="6" stroke="#9CA3AF" strokeWidth="1.6" />
    <path
      d="M12 38C13.4 31.8 18.2 28.5 24 28.5C29.8 28.5 34.6 31.8 36 38"
      stroke="#9CA3AF"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
)

const SettingsRow = ({ label, description, value, status, action }) => (
  <div className="flex items-start justify-between py-5 border-b border-gray-100 last:border-b-0">
    <div className="pr-6">
      <p className="text-sm font-semibold text-slate-900 mb-1">{label}</p>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      {value && (
        <div className="text-right">
          <p className="text-sm text-slate-700">{value}</p>
          {status && <p className="text-xs text-slate-400">{status}</p>}
        </div>
      )}
      {action}
    </div>
  </div>
)

const EditLink = ({ children = 'Edit', onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={disabled ? 'Coming soon' : undefined}
    className={`text-sm font-semibold ${
      disabled
        ? 'text-slate-300 cursor-not-allowed'
        : 'text-blue-600 hover:text-blue-700 hover:underline'
    }`}
  >
    {children}
  </button>
)

const OutlineButton = ({ children, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={disabled ? 'Coming soon' : undefined}
    className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors duration-150 whitespace-nowrap border ${
      disabled
        ? 'text-slate-300 border-slate-200 cursor-not-allowed'
        : 'text-blue-600 border-blue-600 hover:bg-blue-50'
    }`}
  >
    {children}
  </button>
)

const DangerButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="px-4 py-1.5 text-sm font-semibold text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors duration-150 whitespace-nowrap"
  >
    {children}
  </button>
)

/** Generic centered modal shell — used for both the edit form and the delete confirmation. */
const ModalShell = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      {children}
    </div>
  </div>
)

const Profile = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // Which edit modal is open: null | 'name' | 'phone'
  const [editingField, setEditingField] = useState(null)
  const [formValues, setFormValues] = useState({ firstName: '', lastName: '', phoneNumber: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      try {
        const data = await getCurrentUserRequest()
        if (!cancelled) setProfile(data)
      } catch (err) {
        if (!cancelled) setLoadError(err.message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [])

  const openEdit = (field) => {
    setSaveError(null)
    setFormValues({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    })
    setEditingField(field)
  }

  const closeEdit = () => {
    if (isSaving) return
    setEditingField(null)
    setSaveError(null)
  }

  const handleSave = async () => {
    setSaveError(null)

    const payload =
      editingField === 'name'
        ? { firstName: formValues.firstName.trim(), lastName: formValues.lastName.trim() }
        : { phoneNumber: formValues.phoneNumber.trim() }

    if (editingField === 'name' && (!payload.firstName || !payload.lastName)) {
      setSaveError('First and last name cannot be blank.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateCurrentUserRequest(payload)
      setProfile(updated)
      setEditingField(null)
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    setIsDeleting(true)
    try {
      await deleteCurrentUserRequest()
      await logout()
      navigate('/')
    } catch (err) {
      setDeleteError(err.message)
      setIsDeleting(false)
    }
  }

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
    : ''

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/account-settings"
          className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 no-underline mb-4"
        >
          <BackArrowIcon />
          Back to Account settings
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">Profile</h1>

        {loadError && (
          <div className="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
            Couldn't load your profile: {loadError}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 sm:px-8">
          {/* Personal Info */}
          <h2 className="text-lg font-bold text-slate-900 pt-6 pb-1">Personal Info</h2>

          <SettingsRow
            label="Name"
            description="Your first and last given names. Updates are reflected across all Olistay experiences."
            value={isLoading ? 'Loading…' : displayName || 'N/A'}
            action={<EditLink onClick={() => openEdit('name')} disabled={isLoading} />}
          />

          <SettingsRow
            label="Phone number"
            description="Used for booking confirmations and account recovery."
            value={isLoading ? 'Loading…' : profile?.phoneNumber || 'Not set'}
            action={<EditLink onClick={() => openEdit('phone')} disabled={isLoading} />}
          />

          <SettingsRow
            label="Photo"
            description="Personalize your profile pic with a custom photo."
            value={<AvatarPlaceholderIcon />}
            action={<EditLink disabled />}
          />

          <SettingsRow
            label="Reviews"
            description="Manage the reviews you've written for professionals, rentals, and more."
            action={<EditLink disabled>Manage</EditLink>}
          />

          {/* Sign in & Security */}
          <h2 className="text-lg font-bold text-slate-900 pt-6 pb-1">Sign in &amp; Security</h2>

          <SettingsRow
            label="Email"
            description="The email address associated with your account. Email changes go through a separate verification flow."
            value={isLoading ? 'Loading…' : profile?.email || user?.email || 'N/A'}
          />

          <SettingsRow
            label="Password"
            description="Set a unique password to protect your account."
            action={<OutlineButton disabled>Set up</OutlineButton>}
          />

          <SettingsRow
            label="Passkeys"
            description="Sign in with your face or fingerprint."
            action={<OutlineButton disabled>Set up</OutlineButton>}
          />

          <SettingsRow
            label="Two-Step Verification"
            description="Add an extra layer of security. You'll enter an additional code sent to your phone each time you sign in."
            action={<OutlineButton disabled>Set up</OutlineButton>}
          />
        </div>

        {/* Manage account */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-6 sm:px-8 mt-4">
          <h2 className="text-lg font-bold text-slate-900 pt-6 pb-1">Manage account</h2>

          <SettingsRow
            label="Delete my account"
            description="This permanently deletes your account and all associated data. This cannot be undone."
            action={<DangerButton onClick={() => setShowDeleteConfirm(true)}>Delete account</DangerButton>}
          />

          <SettingsRow
            label="Privacy & Cookies"
            description="Tools that allow you to see and manage your personal data."
            action={<EditLink disabled>Go to Privacy Portal</EditLink>}
          />
        </div>
      </div>

      {/* Edit Name / Phone modal */}
      {editingField && (
        <ModalShell
          title={editingField === 'name' ? 'Edit name' : 'Edit phone number'}
          onClose={closeEdit}
        >
          {editingField === 'name' ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First name</label>
                <input
                  type="text"
                  value={formValues.firstName}
                  onChange={(e) => setFormValues((f) => ({ ...f, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last name</label>
                <input
                  type="text"
                  value={formValues.lastName}
                  onChange={(e) => setFormValues((f) => ({ ...f, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
              <input
                type="tel"
                placeholder="+237600000000"
                value={formValues.phoneNumber}
                onChange={(e) => setFormValues((f) => ({ ...f, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}

          {saveError && <p className="text-sm text-red-600 mt-3">{saveError}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={closeEdit}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm font-semibold text-slate-600 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </ModalShell>
      )}

      {/* Delete account confirmation modal */}
      {showDeleteConfirm && (
        <ModalShell
          title="Delete your account?"
          onClose={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <p className="text-sm text-slate-600">
            This permanently deletes your Olistay account and all associated data. This action
            cannot be undone.
          </p>

          {deleteError && <p className="text-sm text-red-600 mt-3">{deleteError}</p>}

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              className="px-4 py-1.5 text-sm font-semibold text-slate-600 rounded-md hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60"
            >
              {isDeleting ? 'Deleting…' : 'Delete my account'}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

export default Profile