// src/services/duckduckgo.js
import axios from 'axios';
import * as cheerio from 'cheerio';


/**
 * Busca en DuckDuckGo y devuelve la URL del primer resultado (sitio web oficial).
 * (Esta función ya la tienes, hemos corregido el caso 'uddg=' en mensajes anteriores.)
 */
export async function buscarUrlRestaurante(query) {
  try {
    const res = await axios.get('https://duckduckgo.com/html/', {
      params: { q: query },
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
      }
    });
    const html = res.data;
    const $ = cheerio.load(html);
    let href = $('a.result__a').first().attr('href') || '';
    if (!href) return '';
    // Si comienza con DuckDuckGo redirect, extraer uddg
    if (href.startsWith('//duckduckgo.com/l/') || href.startsWith('/l/?uddg=')) {
      const m = href.match(/[?&]uddg=([^&]+)/);
      if (m && m[1]) {
        const decoded = decodeURIComponent(m[1]);
        if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
          return decoded;
        }
      }
      return '';
    }
    // Si ya es URL absoluta
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return href;
    }
    return '';
  } catch (err) {
    console.error('Error buscando URL en DuckDuckGo:', err);
    return '';
  }
}

/**
 * Dado un URL de restaurante (por ejemplo, "https://cheddarsburger.cl/"),
 * hace scraping de la página para obtener la imagen principal (og:image).
 * Retorna la URL de la imagen (p. ej. "https://cheddarsburger.cl/og-image.jpg"),
 * o cadena vacía "" si no se encuentra nada.
 */
export async function buscarImagenRestaurante(urlWeb) {
  try {
    // Petición HTTP a la página principal del restaurante
    const res = await axios.get(urlWeb, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
      },
      timeout: 5000
    });
    const html = res.data;
    const $ = cheerio.load(html);

    // 1) Buscar meta[property="og:image"]
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage && (ogImage.startsWith('http://') || ogImage.startsWith('https://'))) {
      return ogImage;
    }

    // 2) Si no hay og:image, intentar <link rel="image_src">
    const imageSrc = $('link[rel="image_src"]').attr('href');
    if (imageSrc && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://'))) {
      return imageSrc;
    }

    // 3) Si tampoco, buscar <meta name="twitter:image">
    const twitterImage = $('meta[name="twitter:image"]').attr('content');
    if (twitterImage && (twitterImage.startsWith('http://') || twitterImage.startsWith('https://'))) {
      return twitterImage;
    }

    // 4) En último caso, devolver cadena vacía para usar un placeholder posteriormente
    return '';
  } catch (err) {
    console.error('Error al hacer scraping para la imagen del restaurante:', err.message);
    return '';
  }
}
