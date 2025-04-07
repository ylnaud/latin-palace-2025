import './config.js';
import './tooltips.js';
import './scroll.js';
import { cargarFotosAprobadas } from './galeria.js';
import './reservas.js';
import './fotos.js';

document.addEventListener('DOMContentLoaded', () => {
    cargarFotosAprobadas();
});
