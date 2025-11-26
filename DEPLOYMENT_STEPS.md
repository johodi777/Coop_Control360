# 🚀 Pasos para Deployment - Resumen Ejecutivo

Guía rápida de referencia para el deployment.

## ⚡ INICIO RÁPIDO (5 pasos)

### 1️⃣ Subir código a GitHub

```bash
git init  # Si no es repositorio
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/coopcontrol360.git
git push -u origin main
```

### 2️⃣ Configurar DigitalOcean

```bash
# Instalar doctl
# Autenticar
doctl auth init -t TU_TOKEN

# Crear registry
doctl registry create coopcontrol-registry
doctl registry login
```

### 3️⃣ Configurar GitHub Secrets

En GitHub > Settings > Secrets > Actions, agregar:
- `DO_REGISTRY_USERNAME`
- `DO_REGISTRY_TOKEN`
- `DO_REGISTRY_NAME`
- `DO_SSH_PRIVATE_KEY`
- `DO_DROPLET_IP` (después del deployment)
- `DO_SSH_USER` = `root`
- `DOMAIN`
- `VITE_API_URL`

### 4️⃣ Deployment Inicial

```bash
./deployment/digitalocean/deploy-digitalocean.sh \
    clienteA \
    clienteA.com \
    dop_v1_tu_token
```

### 5️⃣ Activar CI/CD

En GitHub > Actions > "Run workflow"

---

## 📚 DOCUMENTACIÓN COMPLETA

Ver: `deployment/digitalocean/GUIA_COMPLETA_DEPLOYMENT.md`

---

## ✅ CHECKLIST

- [ ] Código en GitHub
- [ ] DigitalOcean configurado
- [ ] GitHub Secrets configurados
- [ ] Deployment inicial completado
- [ ] SSL funcionando
- [ ] Aplicación accesible

---

**¿Problemas?** Ver `deployment/digitalocean/GUIA_COMPLETA_DEPLOYMENT.md` sección Troubleshooting

