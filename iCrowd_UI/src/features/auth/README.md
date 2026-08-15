# 🔐 Authentication & User Profile Architecture (Auth Feature)

මෙම ලේඛනය මඟින් iCrowd පද්ධතියේ Auth feature එකෙහි සිදුකළ වෙනස්කම්, Architecture එක සහ Smart Hooks / Dumb Components වෙන්කිරීම පිළිබඳ සම්පූර්ණ විස්තරයක් සපයයි.

---

## 🎯 සිදුකරන ලද ප්‍රධාන වෙනස්කම් (Key Changes Made)

1. **පොදු ලියාපදිංචි වීමෙන් Role තේරීම ඉවත් කිරීම (Customer-Only Registration)**:
   - සාමාන්‍ය Register පිටුවෙන් (`/register`) user හට Customer හෝ Admin ලෙස තේරීමට තිබූ Dropdown එක ඉවත් කරන ලදී.
   - පොදු registration එකෙන් create විය හැක්කේ **Customer (`role: 'USER'`)** ගිණුම් පමණි.
   
2. **Admin ගිණුම් සෑදීම Admin හට පමණක් සීමා කිරීම (Admin Creation Component & Hook)**:
   - අලුතින් Admin කෙනෙකු add කළ හැකි reusable hook එක (`useAdminRegisterForm`) සහ form component එක (`AdminRegisterForm`) සකස් කර ඇත.

3. **Logic (Custom Hooks) සහ Dumb (UI/Presentational) Components වෙන් කිරීම**:
   - සියලුම state management, validation, form submission logic වෙනම Custom Hooks (`hooks/`) තුළට වෙන් කරන ලදී.
   - UI කොටස් (Inputs, Buttons, Alert banners) කිසිදු API logic එකක් නැති Reusable **Dumb Components** බවට පත් කරන ලදී.

---

## 📁 Folder Structure & File Responsibilities

```
src/features/auth/
├── api/
│   └── authApi.js               # Axios API calls (login, register, getCurrentUser)
├── context/
│   └── AuthContext.jsx          # Global Auth state provider (user, login, logout, isAdmin)
├── hooks/
│   ├── useAuth.js               # Hook to access AuthContext
│   ├── useLoginForm.js          # Logic hook for Login form handling & role navigation
│   ├── useRegisterForm.js       # Logic hook for Customer registration (Role locked to USER)
│   └── useAdminRegisterForm.js  # Logic hook for Admin adding other Admins (Role: ADMIN)
├── component/
│   ├── AuthInput.jsx            # [Dumb UI] Reusable styled Input field with error labels
│   ├── AuthButton.jsx           # [Dumb UI] Reusable Button with loading spinner & variants
│   ├── AuthAlert.jsx            # [Dumb UI] Reusable Error/Success message banner
│   ├── LoginForm.jsx            # Login form UI (Consumes useLoginForm + Dumb UI)
│   ├── RegisterForm.jsx         # Customer register UI (Consumes useRegisterForm + Dumb UI)
│   ├── AdminRegisterForm.jsx    # Admin creation form UI (Consumes useAdminRegisterForm)
│   └── ProtectedRoute.jsx       # Route guard with Role-based protection (allowedRoles)
├── pages/
│   ├── LoginPage.jsx            # Login page wrapper
│   └── RegisterPage.jsx         # Customer Register page wrapper
└── README.md                    # Auth Feature Documentation
```

---

## 🧠 1. Smart Hooks vs. Dumb Components Pattern

### Smart Hooks (`src/features/auth/hooks/`)
සියලුම business logic, input changes handling, validation, සහ API requests මෙම hooks මඟින් සිදු කරයි:
- **`useLoginForm()`**:
  - `email`, `password` state තබා ගැනීම
  - Submit කිරීමෙන් පසු user ගේ role එක අනුව `/admin` හෝ `/` වෙත redirect කිරීම
  - Error handling
- **`useRegisterForm()`**:
  - Form fields පාලනය
  - Role එක ස්ථිරවම `USER` (Customer) ලෙස තබා ගැනීම
  - සාර්ථක වූ විට `/login` වෙත redirect කිරීම
- **`useAdminRegisterForm()`**:
  - Admin කෙනෙකු add කිරීමේ logic එක (Role: `ADMIN`)

### Dumb Components (`src/features/auth/component/`)
UI එක render කිරීම පමණක් සිදු කරන අතර, props හරහා දත්ත ලබා ගනී:
- **`AuthInput`**: `label`, `type`, `value`, `onChange`, `error` භාරගෙන styled input එකක් render කරයි.
- **`AuthButton`**: `loading`, `loadingText`, `children`, `variant` භාරගෙන button එකක් render කරයි.
- **`AuthAlert`**: `type ('error' | 'success' | 'info')` සහ `message` භාරගෙන styled alert banner එකක් render කරයි.
