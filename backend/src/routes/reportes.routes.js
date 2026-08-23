const express = require('express');
const ExcelJS = require('exceljs');
const { pool } = require('../config/database');
const { asyncHandler } = require('../utils/helpers');
const { authRequired, loadUserFarms, requireFarmAccess } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired, loadUserFarms, requireFarmAccess);

async function workbookResponse(res, filename, build) {
  const wb = new ExcelJS.Workbook();
  await build(wb);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

// NUC-36 genérico + CUY-22 hembras
router.get(
  '/hembras',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.codigo, a.fecha_nacimiento, r.nombre AS raza, c.nombre AS categoria,
              j.codigo AS jaula, ar.nombre AS area
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       WHERE a.id_granja = $1 AND a.sexo = 'H' AND a.estado = 'activo'
       ORDER BY a.codigo`,
      [req.granjaId]
    );

    await workbookResponse(res, 'registro-hembras.xlsx', async (wb) => {
      const ws = wb.addWorksheet('Hembras');
      ws.addRow(['Código', 'Nacimiento', 'Raza', 'Categoría', 'Área', 'Jaula']);
      rows.forEach((r) =>
        ws.addRow([r.codigo, r.fecha_nacimiento, r.raza, r.categoria, r.area, r.jaula])
      );
    });
  })
);

// CUY-23
router.get(
  '/machos',
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT a.codigo, a.fecha_nacimiento, r.nombre AS raza, c.nombre AS categoria,
              j.codigo AS jaula, ar.nombre AS area
       FROM animales a
       LEFT JOIN razas r ON r.id = a.id_raza
       LEFT JOIN categorias c ON c.id = a.id_categoria
       LEFT JOIN jaulas j ON j.id = a.id_jaula
       LEFT JOIN areas ar ON ar.id = j.id_area
       WHERE a.id_granja = $1 AND a.sexo = 'M' AND a.estado = 'activo'
       ORDER BY a.codigo`,
      [req.granjaId]
    );

    await workbookResponse(res, 'registro-machos.xlsx', async (wb) => {
      const ws = wb.addWorksheet('Machos');
      ws.addRow(['Código', 'Nacimiento', 'Raza', 'Categoría', 'Área', 'Jaula']);
      rows.forEach((r) =>
        ws.addRow([r.codigo, r.fecha_nacimiento, r.raza, r.categoria, r.area, r.jaula])
      );
    });
  })
);

// CUY-24 + NUC-36 inventario mensual
router.get(
  '/inventario-mensual',
  asyncHandler(async (req, res) => {
    const year = Number(req.query.anio) || new Date().getFullYear();
    const month = Number(req.query.mes) || new Date().getMonth() + 1;

    const pob = await pool.query(
      `SELECT COALESCE(c.nombre,'sin_categoria') AS categoria, a.sexo, COUNT(*)::int AS n
       FROM animales a LEFT JOIN categorias c ON c.id = a.id_categoria
       WHERE a.id_granja = $1 AND a.estado = 'activo'
       GROUP BY c.nombre, a.sexo`,
      [req.granjaId]
    );
    const mov = await pool.query(
      `SELECT
         (SELECT COALESCE(SUM(vivos_m+vivos_h),0) FROM partos
           WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha_parto)=$2 AND EXTRACT(MONTH FROM fecha_parto)=$3) AS nacimientos,
         (SELECT COALESCE(SUM(cantidad),0) FROM mortalidad
           WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3) AS mortalidad,
         (SELECT COALESCE(SUM(cantidad),0) FROM ventas
           WHERE id_granja=$1 AND EXTRACT(YEAR FROM fecha)=$2 AND EXTRACT(MONTH FROM fecha)=$3) AS ventas`,
      [req.granjaId, year, month]
    );

    await workbookResponse(res, `inventario-${year}-${month}.xlsx`, async (wb) => {
      const ws = wb.addWorksheet('Inventario');
      ws.addRow([`Inventario mensual ${month}/${year}`]);
      ws.addRow([]);
      ws.addRow(['Nacimientos', mov.rows[0].nacimientos]);
      ws.addRow(['Mortalidad', mov.rows[0].mortalidad]);
      ws.addRow(['Ventas', mov.rows[0].ventas]);
      ws.addRow([]);
      ws.addRow(['Categoría', 'Sexo', 'Cantidad']);
      pob.rows.forEach((r) => ws.addRow([r.categoria, r.sexo, r.n]));
    });
  })
);

module.exports = router;
