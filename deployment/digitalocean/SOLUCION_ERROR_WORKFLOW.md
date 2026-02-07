# 🔧 Solución: Error de Personal Access Token sin scope `workflow`

## ❌ Error que estás viendo:

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token 
to create or update workflow `.github/workflows/deploy.yml` without `workflow` scope)
```

## 📝 ¿Qué significa?

GitHub requiere un permiso especial llamado `workflow` en tu Personal Access Token para poder:
- Crear archivos en `.github/workflows/`
- Actualizar workflows existentes
- Modificar cualquier archivo relacionado con GitHub Actions

Tu token actual **NO tiene este permiso**, por eso GitHub rechaza el push.

---

## ✅ SOLUCIÓN (3 pasos)

### Paso 1: Crear un nuevo Personal Access Token con scope `workflow`

1. Ve a GitHub.com
2. Click en tu **avatar** (arriba derecha) > **Settings**
3. En el menú lateral izquierdo: **Developer settings**
4. Click en **Personal access tokens** > **Tokens (classic)**
5. Click en **"Generate new token"** > **"Generate new token (classic)"**

6. Configuración del token:
   - **Note**: `CoopControl Deployment - Full Access`
   - **Expiration**: Elige una fecha (o "No expiration" si prefieres)
   - **Scopes**: Marca estos permisos:
     - ✅ **repo** (todos los permisos de repositorio)
     - ✅ **workflow** (⚠️ ESTE ES EL IMPORTANTE)
     - ✅ **write:packages** (si usas GitHub Packages)
     - ✅ **read:packages** (si usas GitHub Packages)

7. Scroll hacia abajo y click en **"Generate token"**

8. **⚠️ COPIA EL TOKEN INMEDIATAMENTE** (solo se muestra una vez)
   - Ejemplo: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Paso 2: Actualizar Git para usar el nuevo token

Tienes dos opciones:

#### Opción A: Actualizar la URL del remote (Recomendado)

```bash
# Ver tu remote actual
git remote -v

# Actualizar con el nuevo token
git remote set-url origin https://TU_NUEVO_TOKEN@github.com/concordesoftware-ui/coopcontrol360.git

# Verificar
git remote -v
```

**Ejemplo:**
```bash
git remote set-url origin https://ghp_abc123xyz@github.com/concordesoftware-ui/coopcontrol360.git
```

#### Opción B: Usar Git Credential Manager (Más seguro)

```bash
# Eliminar credenciales guardadas
git credential reject <<EOF
protocol=https
host=github.com
EOF

# Intentar push de nuevo (te pedirá credenciales)
git push origin main
# Usuario: tu-usuario-de-github
# Contraseña: TU_NUEVO_TOKEN (no tu contraseña real)
```

### Paso 3: Intentar push de nuevo

```bash
git push origin main
```

**Ahora debería funcionar** ✅

---

## 🔍 Verificar que funciona

```bash
# Hacer un cambio pequeño
echo "# Test" >> README.md
git add README.md
git commit -m "Test workflow permissions"
git push origin main
```

Si el push funciona sin errores, ¡está solucionado!

---

## 🛡️ Alternativa: Usar SSH en lugar de HTTPS

Si prefieres no usar tokens, puedes usar SSH:

### 1. Verificar si tienes SSH key

```bash
ls -al ~/.ssh
# Debe mostrar id_rsa y id_rsa.pub (o id_ed25519)
```

### 2. Si NO tienes SSH key, crear una

```bash
ssh-keygen -t ed25519 -C "tu-email@example.com"
# Presiona Enter para usar ubicación por defecto
# Ingresa una contraseña (o déjala vacía)
```

### 3. Agregar SSH key a GitHub

```bash
# Ver tu clave pública
cat ~/.ssh/id_ed25519.pub
# (o cat ~/.ssh/id_rsa.pub si usaste RSA)
```

1. Copia TODO el contenido (empieza con `ssh-ed25519` o `ssh-rsa`)
2. Ve a GitHub > Settings > SSH and GPG keys
3. Click en **"New SSH key"**
4. **Title**: `Mi Laptop` (o el nombre que prefieras)
5. **Key**: Pega la clave pública
6. Click en **"Add SSH key"**

### 4. Cambiar remote a SSH

```bash
# Cambiar de HTTPS a SSH
git remote set-url origin git@github.com:concordesoftware-ui/coopcontrol360.git

# Verificar
git remote -v
```

### 5. Probar conexión

```bash
ssh -T git@github.com
# Debe decir: "Hi TU_USUARIO! You've successfully authenticated..."
```

### 6. Hacer push

```bash
git push origin main
```

---

## 📋 Resumen de Soluciones

| Método | Pros | Contras |
|--------|------|---------|
| **Token con scope `workflow`** | Fácil, rápido | Token en la URL (menos seguro) |
| **Git Credential Manager** | Más seguro | Requiere configuración |
| **SSH** | Más seguro, no expira | Requiere configuración inicial |

---

## ⚠️ IMPORTANTE: Seguridad

### Si usas Token en la URL:

**NO compartas** tu repositorio con el token visible:
```bash
# ❌ MAL - Token visible en la URL
git remote set-url origin https://ghp_abc123@github.com/user/repo.git

# ✅ BIEN - Usar Git Credential Manager o SSH
git remote set-url origin https://github.com/user/repo.git
```

### Mejor práctica:

1. Usa **SSH** para desarrollo local
2. Usa **Git Credential Manager** para almacenar tokens de forma segura
3. **Nunca** commitees tokens o secrets al repositorio

---

## 🆘 Si aún no funciona

### Verificar permisos del token:

1. Ve a GitHub > Settings > Developer settings > Personal access tokens
2. Verifica que tu token tiene:
   - ✅ `repo` (todos)
   - ✅ `workflow`

### Verificar que el token no expiró:

```bash
# Intentar hacer una operación simple
git fetch origin
```

### Verificar permisos del repositorio:

1. Ve a tu repositorio en GitHub
2. Settings > Collaborators
3. Verifica que tienes permisos de **Write** o **Admin**

### Limpiar credenciales guardadas:

**Windows (PowerShell):**
```powershell
# Eliminar credenciales de Windows
cmdkey /list
cmdkey /delete:git:https://github.com
```

**Linux/Mac:**
```bash
# Eliminar de Git credential store
git credential-cache exit
# O
git config --global --unset credential.helper
```

---

## ✅ Checklist

- [ ] Token creado con scope `workflow`
- [ ] Remote actualizado con nuevo token
- [ ] Push funciona correctamente
- [ ] Workflow se puede crear/actualizar

---

**¿Sigue sin funcionar?** Verifica:
1. El token tiene el scope `workflow` ✅
2. El token no expiró ✅
3. Tienes permisos en el repositorio ✅
4. La URL del remote está correcta ✅

