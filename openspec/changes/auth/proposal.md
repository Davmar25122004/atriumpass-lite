# Proposal: auth

## Summary
JWT authentication system with role-based access control (superadmin/admin/usuario), login/register/me endpoints, AuthContext for frontend, Layout with Vivaldi sidebar+topbar, protected routes.

## Verification
- Login admin/admin123 → JWT token
- GET /api/auth/me with Bearer → user data
- Sidebar shows items by role
- Dark/light toggle works
