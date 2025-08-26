-- scripts/create-user-profile-trigger.sql
-- Función para crear un perfil de usuario cuando un nuevo usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Asegúrate de que el username se inserte en minúsculas si se pasa en los metadatos
  INSERT INTO public.user_profiles (id, username, email)
  VALUES (NEW.id, LOWER(NEW.raw_user_meta_data->>'username'), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el disparador existente si ya existe para evitar conflictos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Disparador para llamar a la función después de que un nuevo usuario es creado en auth.users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Opcional: Ajustar políticas RLS en user_profiles si es necesario,
-- pero con el trigger, la inserción ya no es un problema de RLS para el cliente.
-- Asegúrate de que las políticas de SELECT y UPDATE sigan siendo correctas.
-- Por ejemplo, para que los usuarios puedan ver y actualizar su propio perfil:
-- DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
-- CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT TO authenticated USING (auth.uid() = id);
-- DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
-- CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
