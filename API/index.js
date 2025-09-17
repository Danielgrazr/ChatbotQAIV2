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
    const { padre_id } = req.query;

    if (padre_id) {
        // Busca los hijos Y la pregunta del padre
        const sqlChildren = 'SELECT * FROM Categorias WHERE id_padre = ? ORDER BY grupo_orden, posicion_orden';
        const sqlParent = 'SELECT tipo_pregunta_hijos FROM Categorias WHERE id_categoria = ?';
        
        db.get(sqlParent, [padre_id], (err, parentRow) => {
            if (err) return res.status(500).json({ "error": err.message });

            const question = (parentRow && parentRow.tipo_pregunta_hijos) ? parentRow.tipo_pregunta_hijos : "Selecciona una opción:";
            
            db.all(sqlChildren, [padre_id], (err, childrenRows) => {
                if (err) return res.status(500).json({ "error": err.message });
                res.json({ question: question, children: childrenRows });
            });
        });
    } else {
        // Busca las categorías raíz (el inicio de la conversación)
        const sqlRoot = 'SELECT * FROM Categorias WHERE id_padre IS NULL ORDER BY grupo_orden, posicion_orden';
        db.all(sqlRoot, [], (err, childrenRows) => {
            if (err) return res.status(500).json({ "error": err.message });
            // La primera pregunta siempre es la misma
            res.json({ question: "Hola, ¿Qué área deseas consultar?", children: childrenRows });
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