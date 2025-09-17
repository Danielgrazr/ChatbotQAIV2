// 1. Importar las librerías que instalamos
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// 2. Configuración inicial
const app = express();
const PORT = process.env.PORT || 3000; // El puerto donde se ejecutará la API

// 3. Middlewares
app.use(cors()); // Habilita CORS para permitir peticiones desde el chatbot
app.use(express.json()); // Permite a la API entender JSON

// 4. Conectar a la base de datos SQLite
// Asegúrate de que tu archivo .sqlite esté en la misma carpeta
const db = new sqlite3.Database('./chatbot_db_V2.sqlite', (err) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err.message);
    } else {
        console.log("Conectado a la base de datos SQLite.");
    }
});

// --- DEFINICIÓN DE LOS ENDPOINTS DE LA API ---

// 5. Endpoint para obtener las categorías (Paso 2.1 de la guía)
app.get('/categorias', (req, res) => {
    const { padre_id } = req.query; // Obtiene el id_padre de la URL, si existe

    let sql;
    const params = [];

    if (padre_id) {
        sql = 'SELECT * FROM Categorias WHERE id_padre = ? ORDER BY grupo_orden, posicion_orden';
        params.push(padre_id);
    } else {
        sql = 'SELECT * FROM Categorias WHERE id_padre IS NULL ORDER BY grupo_orden, posicion_orden';
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});

// 6. Endpoint para obtener la información final (Paso 2.2 de la guía)
app.get('/informacion', (req, res) => {
    const { categoria_id } = req.query;

    if (!categoria_id) {
        return res.status(400).json({ "error": "Falta el parámetro categoria_id" });
    }

    const sql = 'SELECT * FROM Informacion WHERE id_categoria = ? ORDER BY tipo_info, titulo';
    
    db.all(sql, [categoria_id], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json(rows);
    });
});


// 7. Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});