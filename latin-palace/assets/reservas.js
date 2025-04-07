import { SHEETDB_RESERVAS } from './config.js';

document.getElementById('reservaForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const btnSubmit = this.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;

    const reservaData = {
        nombre: document.getElementById('nombre').value,
        telefono: document.getElementById('telefono').value,
        fecha: document.getElementById('fecha').value,
        personas: document.getElementById('personas').value,
        comentarios: document.getElementById('comentarios').value,
        fecha_registro: new Date().toISOString(),
        estado: "pendiente"
    };

    try {
        const response = await fetch(SHEETDB_RESERVAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [reservaData] })
        });

        const mensaje = document.getElementById('reservaMensaje');
        mensaje.textContent = "¡Reserva enviada con éxito! Te contactaremos pronto.";
        mensaje.style.display = 'block';

        this.reset();

        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 5000);

    } catch (error) {
        console.error('Error:', error);
        alert('Error al enviar la reserva. Por favor, inténtalo de nuevo o contáctanos por WhatsApp.');
    } finally {
        btnSubmit.disabled = false;
    }
});
