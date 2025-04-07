import { SHEETDB_FOTOS } from './config.js';

export async function cargarFotosAprobadas() {
    try {
        const response = await fetch(`${SHEETDB_FOTOS}?search[aprobada]=Aprobada`);
        const fotos = await response.json();

        const galeria = document.getElementById('galeriaFotos');
        if (fotos.length > 0) {
            galeria.innerHTML = '';

            fotos.forEach(foto => {
                galeria.innerHTML += `
                    <div class="col-md-4 col-sm-6">
                        <img src="${foto.url_foto}" alt="${foto.descripcion || 'Foto de Latin Palace'}" class="img-fluid gallery-img">
                        <p class="mt-2"><strong>${foto.nombre_usuario}</strong>: ${foto.descripcion || ''}</p>
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error al cargar fotos:', error);
    }
}
