import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { authSuccess } from '../features/auth/authSlice';
import {
  X,
  User,
  Shield,
  Sliders,
  Upload,
  Camera,
  Check,
  Key,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Volume2,
  EyeOff
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  '#f87171', '#fb923c', '#fbbf24', '#34d399', '#2dd4bf',
  '#38bdf8', '#60a5fa', '#818cf8', '#a78bfa', '#f472b6'
];

const COUNTRIES = [
  { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
  { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
  { code: '+1', name: 'Canada', flag: '🇨🇦', iso: 'CA' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
  { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
  { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
  { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'privacy'>('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // States
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl || '');
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);

  // Privacy States
  const [privacyAvatar, setPrivacyAvatar] = useState<'everyone' | 'friends' | 'none'>(user?.privacy?.avatar || 'everyone');
  const [privacyEmail, setPrivacyEmail] = useState<'everyone' | 'friends' | 'none'>(user?.privacy?.email || 'everyone');
  const [privacyPhone, setPrivacyPhone] = useState<'everyone' | 'friends' | 'none'>(user?.privacy?.phoneNumber || 'everyone');

  // 2FA Setup states
  const [setupStep, setSetupStep] = useState<'none' | 'input' | 'verify'>('none');
  const [selectedCountryIso, setSelectedCountryIso] = useState(() => {
    const raw = user?.phoneNumber || '';
    const match = raw.match(/^(\+\d+)\s+(.+)$/);
    if (match) {
      const found = COUNTRIES.find(c => c.code === match[1]);
      return found?.iso || 'IN';
    }
    return 'IN';
  });
  const [countryCode, setCountryCode] = useState(() => {
    const raw = user?.phoneNumber || '';
    const match = raw.match(/^(\+\d+)\s+(.+)$/);
    return match ? match[1] : '+91';
  });
  const [phoneNumberInput, setPhoneNumberInput] = useState(() => {
    const raw = user?.phoneNumber || '';
    const match = raw.match(/^(\+\d+)\s+(.+)$/);
    return match ? match[2] : raw;
  });
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [setupEmailOtp, setSetupEmailOtp] = useState('');
  const [setupPhoneOtp, setSetupPhoneOtp] = useState('');
  const [debugSetupEmailOtp, setDebugSetupEmailOtp] = useState('');
  const [debugSetupPhoneOtp, setDebugSetupPhoneOtp] = useState('');

  // Password reset states
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [debugOtp, setDebugOtp] = useState(''); // Stores mock OTP code for easy copy-paste

  // Messages
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Preference tab states
  const [theme, setTheme] = useState(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);

  if (!isOpen || !user) return null;

  // Clear alerts helper
  const triggerAlert = (type: 'success' | 'error', msg: string) => {
    if (type === 'success') {
      setSuccessMsg(msg);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 5000);
    } else {
      setErrorMsg(msg);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Profile Pic Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerAlert('error', 'Profile picture size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
      await saveProfilePic(base64String);
    };
    reader.readAsDataURL(file);
  };

  const saveProfilePic = async (imgUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatarUrl: imgUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update avatar');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', 'Profile picture updated successfully!');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = async (color: string) => {
    // If selecting a color preset, we remove base64 avatarUrl and let initials render with this color in user details,
    // or we can save the color preset directly. Let's update the avatarUrl to color code.
    setAvatarUrl(color);
    await saveProfilePic(color);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      triggerAlert('error', 'Cover picture size should be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setCoverUrl(base64String);
      await saveCoverPhoto(base64String);
    };
    reader.readAsDataURL(file);
  };

  const saveCoverPhoto = async (imgUrl: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ coverUrl: imgUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update cover photo');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', 'Cover photo updated successfully!');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          privacy: {
            avatar: privacyAvatar,
            email: privacyEmail,
            phoneNumber: privacyPhone
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update privacy');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', 'Privacy configurations updated successfully!');
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Username Change Handler
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username === user.username) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/username', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: username.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update username');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', 'Username updated successfully!');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Security: OTP request handler
  const handleRequestOtp = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request code');
      setOtpSent(true);
      if (data.code) {
        setDebugOtp(data.code); // Store code so user can test easily
      }
      if (user?.phoneNumber) {
        triggerAlert('success', `OTP Verification Code sent to email & registered phone: ${user.phoneNumber} (mock logged to console!)`);
      } else {
        triggerAlert('success', 'OTP Verification Code sent to email (mock logged to terminal console!)');
      }
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Security: Password Change submission
  const handleConfirmPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ otp: otpCode, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify OTP code');
      setOtpSent(false);
      setOtpCode('');
      setNewPassword('');
      setDebugOtp('');
      triggerAlert('success', 'Password changed successfully!');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Setup 2FA: step 1 (request OTPs)
  const handleRequest2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberInput.trim()) return;
    setLoading(true);

    const fullPhoneNumber = `${countryCode} ${phoneNumberInput.trim()}`;

    try {
      const res = await fetch('/api/auth/request-2fa-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber: fullPhoneNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to request codes');
      setSetupStep('verify');
      setDebugSetupEmailOtp(data.emailCode || '');
      setDebugSetupPhoneOtp(data.phoneCode || '');
      triggerAlert('success', 'Verification codes sent to Gmail and Phone Number (mock logged to terminal!)');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Setup 2FA: step 2 (verify OTPs & enable)
  const handleVerify2FASetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupEmailOtp || !setupPhoneOtp) return;
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ emailOtp: setupEmailOtp, phoneOtp: setupPhoneOtp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify codes');
      setSetupStep('none');
      setTwoFactor(true);
      setSetupEmailOtp('');
      setSetupPhoneOtp('');
      setDebugSetupEmailOtp('');
      setDebugSetupPhoneOtp('');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', '2-Step Verification has been successfully enabled!');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disable 2FA');
      setTwoFactor(false);
      setPhoneNumberInput('');
      setSelectedCountryIso('IN');
      setCountryCode('+91');
      setSetupStep('none');
      dispatch(authSuccess({ token, user: data }));
      triggerAlert('success', '2-Step Verification has been disabled.');
    } catch (e: any) {
      triggerAlert('error', e.message);
    } finally {
      setLoading(false);
    }
  };

  // Preferences: Change Theme
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Username cooldown helper text
  const getUsernameCooldownText = () => {
    if (!user.usernameUpdatedAt) return null;
    const lastUpdate = new Date(user.usernameUpdatedAt);
    const cooldownEnd = new Date(lastUpdate);
    cooldownEnd.setMonth(cooldownEnd.getMonth() + 1);

    if (new Date() < cooldownEnd) {
      return `Can be updated again after ${cooldownEnd.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`;
    }
    return null;
  };

  const cooldownMsg = getUsernameCooldownText();

  // Avatar renderer helper
  const renderAvatar = () => {
    if (avatarUrl && avatarUrl.startsWith('data:')) {
      return <img src={avatarUrl} alt="Avatar" className="h-20 w-20 rounded-full object-cover border-4 border-white dark:border-slate-900 shadow-md" />;
    }
    const color = avatarUrl && PRESET_AVATARS.includes(avatarUrl) ? avatarUrl : user.color;
    return (
      <div
        className="h-20 w-20 rounded-full text-white font-extrabold text-xl flex items-center justify-center select-none border-4 border-white dark:border-slate-900 shadow-md"
        style={{ backgroundColor: color }}
      >
        {user.username.slice(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-panel rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col h-[520px] max-h-[90vh] animate-fade-in text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-500" /> Account Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-655 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Layout container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Side tabs */}
          <div className="w-48 border-r border-slate-100/50 dark:border-slate-850/50 bg-white/10 dark:bg-slate-950/10 p-3 flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <User className="h-4.5 w-4.5" /> Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <Shield className="h-4.5 w-4.5" /> Security
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'preferences'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <Sliders className="h-4.5 w-4.5" /> Preferences
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-2.5 transition cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
              }`}
            >
              <EyeOff className="h-4.5 w-4.5" /> Privacy
            </button>

            {/* Status indicators */}
            <div className="mt-auto p-3 bg-slate-800 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px] font-medium text-white select-none shadow-inner">
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${twoFactor ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                <span>2-step: {twoFactor ? 'Active' : 'Off'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                <span>Branding: Collab-SYNC</span>
              </div>
            </div>
          </div>

          {/* Tab Body */}
          <div className="flex-1 p-6 overflow-y-auto relative">
            {/* Alerts */}
            {successMsg && (
              <div className="mb-4 py-2 px-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-medium animate-fade-in">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="mb-4 py-2 px-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-medium animate-fade-in">
                {errorMsg}
              </div>
            )}

            {/* TAB CONTENT: PROFILE */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Pic settings with Cover Photo */}
                <div className="relative flex flex-col rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/65 bg-slate-50/50 dark:bg-slate-900/40 pb-4">
                  {/* LinkedIn Style Cover Photo Background */}
                  <div 
                    className="h-20 w-full relative select-none bg-cover bg-center"
                    style={{ backgroundImage: coverUrl ? `url(${coverUrl})` : 'none', backgroundColor: coverUrl ? 'transparent' : '#4f46e5' }}
                  >
                    {!coverUrl && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
                    )}
                    <div className="absolute inset-0 bg-black/10" />
                    
                    {/* Separate Button to Add/Edit Cover Photo */}
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="absolute top-2 right-2 py-1 px-2.5 bg-black/40 hover:bg-black/60 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer z-20"
                    >
                      <Camera className="h-3 w-3" /> Edit Cover
                    </button>
                    <input
                      type="file"
                      ref={coverInputRef}
                      onChange={handleCoverUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Profile Picture & Preset Choices Row */}
                  <div className="relative -mt-10 px-5 flex items-start gap-4">
                    {/* Profile Pic bubble overlapping cover photo */}
                    <div className="relative group cursor-pointer flex-shrink-0 z-10" onClick={() => fileInputRef.current?.click()}>
                      {renderAvatar()}
                      <div className="absolute inset-0 bg-black/40 rounded-full border-4 border-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-155">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Details and buttons next to the profile pic */}
                    <div className="space-y-1 pb-1 mt-10">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Profile Picture</h3>
                      <p className="text-[11px] text-white dark:text-white">Upload custom PNG/JPG, or pick a color preset.</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="py-1 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-805 text-[11px] font-bold text-slate-600 dark:text-slate-300 rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
                        >
                          <Upload className="h-3 w-3" /> Upload Pic
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Color Preset Palette Picker */}
                  <div className="px-5 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">Preset Color Palettes</label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_AVATARS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handlePresetSelect(color)}
                          className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700/60 transition hover:scale-110 cursor-pointer shadow-sm relative flex items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          {avatarUrl === color && <Check className="h-3.5 w-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Username Modification form */}
                <form onSubmit={handleUpdateUsername} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Username</label>
                    <input
                      type="text"
                      required
                      disabled={!!cooldownMsg}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter new username"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 disabled:opacity-50 transition"
                    />
                    {cooldownMsg && (
                      <p className="text-[10px] font-semibold text-rose-500">{cooldownMsg}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!cooldownMsg || username === user.username}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white dark:disabled:text-slate-500 font-semibold text-xs rounded-xl shadow-md shadow-indigo-600/5 transition cursor-pointer"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6 pt-10">
                {/* 2-Step Setup Card */}
                <div className="p-4 glass-subcard rounded-2xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 pr-4 text-left">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-850 dark:text-slate-100">
                        {twoFactor ? (
                          <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
                        ) : (
                          <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                        )}
                        <span>2-Step Verification</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                        Enable dual-factor security. Verifies authorization logs via Gmail and Phone SMS OTPs during login.
                      </p>
                      {twoFactor && user.phoneNumber && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mt-1">
                          Linked Phone: <span className="font-mono">{user.phoneNumber}</span>
                        </p>
                      )}
                    </div>

                    {twoFactor && (
                      <button
                        type="button"
                        onClick={handleDisable2FA}
                        disabled={loading}
                        className="py-1.5 px-3.5 text-xs font-bold rounded-lg border bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 transition cursor-pointer flex-shrink-0"
                      >
                        Disable
                      </button>
                    )}

                    {!twoFactor && setupStep === 'none' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSetupStep('input');
                          setPhoneNumberInput(user.phoneNumber || '');
                        }}
                        className="py-1.5 px-3.5 text-xs font-bold rounded-lg border bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer flex-shrink-0"
                      >
                        Set Up
                      </button>
                    )}
                  </div>

                  {!twoFactor && setupStep === 'input' && (
                    <form onSubmit={handleRequest2FA} className="space-y-3 pt-2 text-left border-t border-slate-100 dark:border-slate-800/60 animate-fade-in">
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Phone Number</label>
                        
                        {/* Country Selection Dialogue Box Overlay */}
                        {showCountryDropdown && (
                          <div className="absolute bottom-full left-0 mb-2 w-60 bg-white/98 dark:bg-slate-900/98 border-2 border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-[100] max-h-36 overflow-y-auto animate-scale-in">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60 pb-1.5 mb-1 select-none">
                              Select Country
                            </div>
                            {COUNTRIES.map((c) => (
                              <button
                                key={c.iso + '-' + c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountryIso(c.iso);
                                  setCountryCode(c.code);
                                  setShowCountryDropdown(false);
                                }}
                                className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-xs flex items-center justify-between text-slate-700 dark:text-slate-200 transition cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span>{c.name}</span>
                                </span>
                                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">{c.code}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {/* Small Box for Country Selector Trigger */}
                          <button
                            type="button"
                            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 min-w-[70px] hover:bg-slate-100 dark:hover:bg-slate-900 transition cursor-pointer text-slate-700 dark:text-slate-200"
                          >
                            <span>{(COUNTRIES.find(c => c.iso === selectedCountryIso) || COUNTRIES[0]).flag}</span>
                            <span className="font-mono">{(COUNTRIES.find(c => c.iso === selectedCountryIso) || COUNTRIES[0]).code}</span>
                          </button>

                          {/* 10-Digit Phone Input Field */}
                          <input
                            type="tel"
                            required
                            value={phoneNumberInput}
                            onChange={(e) => setPhoneNumberInput(e.target.value)}
                            placeholder="XXXXXXXXXX"
                            className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setSetupStep('none')}
                          className="py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Send Verification OTPs
                        </button>
                      </div>
                    </form>
                  )}

                  {!twoFactor && setupStep === 'verify' && (
                    <form onSubmit={handleVerify2FASetup} className="space-y-4 pt-2 text-left border-t border-slate-100 dark:border-slate-800/60 animate-fade-in">
                      {(debugSetupEmailOtp || debugSetupPhoneOtp) && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/40 rounded-xl text-[10px] font-semibold space-y-1 font-mono">
                          <div>MOCK GMAIL OTP: {debugSetupEmailOtp}</div>
                          <div>MOCK PHONE OTP: {debugSetupPhoneOtp}</div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Gmail OTP Code</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={setupEmailOtp}
                            onChange={(e) => setSetupEmailOtp(e.target.value)}
                            placeholder="6-digit code"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Phone OTP Code</label>
                          <input
                            type="text"
                            required
                            maxLength={6}
                            value={setupPhoneOtp}
                            onChange={(e) => setSetupPhoneOtp(e.target.value)}
                            placeholder="6-digit code"
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setSetupStep('none')}
                          className="py-1.5 px-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition cursor-pointer"
                        >
                          Verify & Activate
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Change Password Panel */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Change Password</h3>

                  {!otpSent ? (
                    <div className="p-4 glass-subcard border-dashed rounded-xl space-y-3 text-center">
                      <Key className="h-7 w-7 text-indigo-400 mx-auto" />
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        {user?.phoneNumber ? (
                          <>To change your password, request a verification code sent to your registered Gmail account or your linked Phone: <strong className="font-mono text-indigo-500 dark:text-indigo-400">{user.phoneNumber}</strong>.</>
                        ) : (
                          <>To change your password, request a verification code sent to your registered Gmail account.</>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={loading}
                        className="py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-650 dark:text-indigo-400 font-bold text-xs rounded-lg border border-indigo-100 dark:border-indigo-900/30 transition cursor-pointer"
                      >
                        Request OTP Code
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleConfirmPasswordChange} className="space-y-4">
                      {debugOtp && (
                        <div className="py-2 px-3 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100/40 rounded-xl text-[10px] font-semibold select-all font-mono">
                          MOCK OTP CODE: {debugOtp} (Click to copy code)
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Verification OTP Code</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="Enter 6-digit OTP code"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">New Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new strong password"
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-slate-100 transition"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpCode('');
                            setNewPassword('');
                            setDebugOtp('');
                          }}
                          className="py-2 px-3.5 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer border border-slate-200 dark:border-slate-850"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-md transition cursor-pointer"
                        >
                          Change Password
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                {/* Theme selection panel */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Display Theme</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleThemeChange('light')}
                      className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                        theme === 'light'
                          ? 'border-indigo-500 bg-indigo-50/10 text-indigo-650 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Check className={`h-3 w-3 text-slate-600 ${theme === 'light' ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-xs">Light Mode</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleThemeChange('dark')}
                      className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer ${
                        theme === 'dark'
                          ? 'border-indigo-400 bg-indigo-950/20 text-indigo-400 font-bold shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="h-6 w-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-850">
                        <Check className={`h-3 w-3 text-indigo-400 ${theme === 'dark' ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <span className="text-xs">Dark Mode</span>
                    </button>
                  </div>
                </div>

                {/* Notifications & Sounds */}
                <div className="space-y-4 pt-2">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-555 uppercase tracking-wider">Interface Settings</h3>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium">
                      <Bell className="h-4.5 w-4.5 text-slate-400" />
                      <span>Interface Desktop Notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 font-medium">
                      <Volume2 className="h-4.5 w-4.5 text-slate-400" />
                      <span>Play Board Sound Effects</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sounds}
                        onChange={(e) => setSounds(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: PRIVACY */}
            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fade-in text-left">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Privacy Configurations</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Choose who can view your profile details.</p>
                </div>

                <form onSubmit={handleSavePrivacy} className="space-y-5 text-left">
                  {/* Who can see Profile Picture */}
                  <div className="space-y-1.5 p-4 glass-subcard rounded-xl">
                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-205 uppercase tracking-wider">Who can see your Profile Picture?</label>
                    <select
                      value={privacyAvatar}
                      onChange={(e: any) => setPrivacyAvatar(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-slate-950/20 border border-white/10 dark:border-slate-800/30 backdrop-blur-md rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition cursor-pointer"
                    >
                      <option value="everyone" className="bg-slate-900 text-white">Everyone</option>
                      <option value="friends" className="bg-slate-900 text-white">My Friends (Workspace Members)</option>
                      <option value="none" className="bg-slate-900 text-white">None</option>
                    </select>
                  </div>

                  {/* Who can see Email */}
                  <div className="space-y-1.5 p-4 glass-subcard rounded-xl">
                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-205 uppercase tracking-wider">Who can see your Email address?</label>
                    <select
                      value={privacyEmail}
                      onChange={(e: any) => setPrivacyEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-slate-950/20 border border-white/10 dark:border-slate-800/30 backdrop-blur-md rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition cursor-pointer"
                    >
                      <option value="everyone" className="bg-slate-900 text-white">Everyone</option>
                      <option value="friends" className="bg-slate-900 text-white">My Friends (Workspace Members)</option>
                      <option value="none" className="bg-slate-900 text-white">None</option>
                    </select>
                  </div>

                  {/* Who can see Phone Number */}
                  <div className="space-y-1.5 p-4 glass-subcard rounded-xl">
                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-205 uppercase tracking-wider">Who can see your Phone Number?</label>
                    <select
                      value={privacyPhone}
                      onChange={(e: any) => setPrivacyPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 dark:bg-slate-950/20 border border-white/10 dark:border-slate-800/30 backdrop-blur-md rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-slate-100 transition cursor-pointer"
                    >
                      <option value="everyone" className="bg-slate-900 text-white">Everyone</option>
                      <option value="friends" className="bg-slate-900 text-white">My Friends (Workspace Members)</option>
                      <option value="none" className="bg-slate-900 text-white">None</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                  >
                    Save Privacy Changes
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
