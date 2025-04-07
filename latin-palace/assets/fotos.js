import { SHEETDB_FOTOS, IMGUR_CLIENT_ID } from './config.js';

document.getElementById('fotoForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('submitFotoBtn');
    btnSubmit.disabled = true;

    const progressBar = document.getElementById('progressBar');
    const progressContainer = document.getElementById('progressBarContainer');
    progressContainer.style.display = 'block';

    try {
        const fileInput = document.getElementById('archivoFoto');
        if (!fileInput.files[0]) {
            throw new Error('Por favor selecciona una foto');
        }

        const formData = new FormData();
        formData.append('image', fileInput.files[0]);

        const imgurResponse = await fetch('https://api.imgur.com/3/image', {
            method: 'POST',
            headers: {
                'Authorization': `Client-ID ${IMGUR_CLIENT_ID}`
            },
            body: formData
        });

        const imgurData = await imgurResponse.json();

        if (!imgurData.success) {
            throw new Error(imgurData.data.error || 'Error al subir la imagen');
        }

        progressBar.style.width = '50%';

        const fotoData = {
            nombre_usuario: document.getElementById('nombreFoto').value,
            email_usuario: document.getElementById('emailFoto').value,
            url_foto: imgurData.data.link,
            descripcion: document.getElementById('descripcionFoto').value,
            fecha_subida: new Date().toISOString(),
            aprobada: "Pendiente"
        };

        const response = await fetch(SHEETDB_FOTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [fotoData] })
        });

        progressBar.style.width = '100%';

        document.getElementById('fotoForm').reset();
        document.getElementById('mensajeFotoExito').style.display = 'block';

        setTimeout(() => {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalFoto'));
            modal.hide();
            document.getElementById('mensajeFotoExito').style.display = 'none';
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
        }, 3000);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al subir la foto: ' + error.message);
    } finally {
        btnSubmit.disabled = false;
    }
});
