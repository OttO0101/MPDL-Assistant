-- scripts/drop-user-auth-components.sql

-- 1. Eliminar el disparador (trigger) si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Eliminar la función asociada al disparador si existe
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Eliminar la tabla user_profiles si existe (CASCADE eliminará cualquier dependencia de FK)
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 4. Eliminar políticas RLS relacionadas con user_profiles (si no se eliminaron con DROP TABLE CASCADE)
-- Asegúrate de que estas políticas no afecten a otras tablas si las has modificado manualmente
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for registration" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anon select user profiles for login" ON public.user_profiles;
DROP POLICY IF EXISTS "Service role can do everything on user_profiles" ON public.user_profiles;
