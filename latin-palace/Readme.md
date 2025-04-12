# Certificados SSL

Para desarrollo local, generar certificados con:
```bash
mkcert localhost 127.0.0.1 ::1
mv localhost+2-key.pem key.pem
mv localhost+2.pem cert.pem
