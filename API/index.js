// index.js - VERSIÓN FINAL
// 1. Importar librerías
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// 2. Configuración
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

// 3. Conexión a la Base de Datos
const db = new sqlite3.Database('./databaseV2.sqlite', (err) => {
    if (err) {
        return console.error("Error al conectar a la DB:", err.message);
    }
    console.log("Conexión exitosa a la base de datos SQLite.");
});

// 4. Endpoint de Categorías (El motor de la conversación)
app.get('/categorias', (req, res) => {
    // Usaremos 'padre_id' para ser consistentes
    const { padre_id } = req.query;

    if (padre_id) {
        // Busca los hijos de un padre específico
        const sqlChildren = 'SELECT * FROM Categorias WHERE id_padre = ? ORDER BY grupo_orden, posicion_orden';
        const sqlParent = 'SELECT pregunta FROM Categorias WHERE id_categoria = ?';
        
        db.get(sqlParent, [padre_id], (err, parentRow) => {
            if (err) return res.status(500).json({ "error": err.message });

            const question = (parentRow && parentRow.pregunta) ? parentRow.pregunta : "Selecciona una opción:";
            
            db.all(sqlChildren, [padre_id], (err, childrenRows) => {
                if (err) return res.status(500).json({ "error": err.message });
                
                // Transformamos la lista a "Nombre (ID: X)"
                const formattedChildren = childrenRows.map(row => `${row.nombre} (ID: ${row.id_categoria})`);
                res.json({ question: question, children: formattedChildren });
            });
        });
    } else {
        // Busca las categorías raíz si no hay padre_id
        const sqlRoot = 'SELECT * FROM Categorias WHERE id_padre IS NULL ORDER BY grupo_orden, posicion_orden';
        db.all(sqlRoot, [], (err, childrenRows) => {
            if (err) return res.status(500).json({ "error": err.message });
            
            // Transformamos la lista a "Nombre (ID: X)"
            const formattedChildren = childrenRows.map(row => `${row.nombre} (ID: ${row.id_categoria})`);
            res.json({ question: "¡Hola! Soy Quali, tu asistente de calidad. Puedo ayudarte a resolver las dudas más frecuentes. Para empezar, selecciona el área que deseas consultar.", children: formattedChildren });
        });
    }
});

// 5. Endpoint de Información (El final del camino)
app.get('/informacion', (req, res) => {
    const { categoria_id } = req.query;
    if (!categoria_id) return res.status(400).json({ "error": "Falta el categoria_id" });

    const sql = 'SELECT * FROM Informacion WHERE id_categoria = ? ORDER BY tipo_info, titulo';
    db.all(sql, [categoria_id], (err, rows) => {
        if (err) return res.status(500).json({ "error": err.message });
        res.json(rows);
    });
});

// 6. Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Servidor de API corriendo en el puerto ${PORT}`);
});