# 👤 User Profile Architecture (User Profile Feature)

මෙම ලේඛනය මඟින් iCrowd පද්ධතියේ User Profile feature එකෙහි Backend & Frontend Architecture එක, Endpoints, Custom Hooks සහ Dumb Components පිළිබඳ විස්තර සපයයි.

---

## 🎯 Features Implemented

1. **Profile Overview**:
   - පරිශීලකයාගේ මූලික තොරතුරු (First Name, Last Name, Email, Phone) සහ Delivery Address (Street Address, City, District) පිළිවෙළට පෙන්වීම.
   - User Initial Avatar සහ Account Role Badge (`Customer` / `Admin`).

2. **Edit Profile Information**:
   - Personal details (First Name, Last Name, Phone Number) සහ Delivery Address (Address, City, District) update කිරීම.
   - Primary Email එක authentication integrity සඳහා Read-only ලෙස තබා ඇත.
   - Profile එක update වූ පසු global `AuthContext` සහ Navbar එක ස්වයංක්‍රීයව sync වේ.

3. **Secure Change Password**:
   - Current password verify කර නව password එකක් hash කර ඇතුළත් කිරීම.
   - Client-side validation (matching confirm password, min 6 chars) සහ Backend BCrypt verification.

4. **Dynamic Navbar Integration**:
   - User login වී ඇති විට Navbar හි Profile link සහ Logout button පෙන්වීම.
   - User logout වී ඇති විට Sign In සහ Register links පෙන්වීම.

---

## 📁 Folder Structure

```
src/features/user/
├── api/
│   └── userApi.js             # API calls (fetchUserProfile, updateUserProfile, changePassword)
├── hooks/
│   ├── useUserProfile.js      # Logic hook for profile retrieval & updates
│   └── useChangePassword.js   # Logic hook for password changes & validation
├── components/
│   ├── ProfileHeader.jsx      # [Dumb UI] User Avatar, Name, Email, Role badge & Tabs
│   ├── ProfileInfoCard.jsx    # [Dumb UI] Overview card displaying personal & delivery data
│   ├── EditProfileForm.jsx    # [Dumb UI] Profile editing form
│   └── ChangePasswordForm.jsx # [Dumb UI] Password changing form
├── pages/
│   └── ProfilePage.jsx        # Protected profile page with tab navigation
└── README.md                  # User Profile Documentation
```

---

## 🌐 Backend Endpoints (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/profile` | Logged-in user ගේ profile data ලබා ගැනීම | ✅ (JWT Bearer) |
| `PUT` | `/api/users/profile` | Profile details (name, phone, address) update කිරීම | ✅ (JWT Bearer) |
| `PUT` | `/api/users/change-password` | Current password check කර new password hash කර save කිරීම | ✅ (JWT Bearer) |
