import { Injectable } from '@nestjs/common';
import { ProcesosRepositoryPort } from '../../domain/ports/procesos.repository.port';
import { CuyesDepsService } from '../../application/cuyes-deps.service';

@Injectable()
export class ProcesosRepository extends ProcesosRepositoryPort {
  constructor(private readonly cuyesDeps: CuyesDepsService) {
    super();
  }

  private get db() {
    return this.cuyesDeps.toDeps().db;
  }

  async resumenFases(farmId: number) {
    const [
      crianza,
      reproduccion,
      ventas,
    ] = await Promise.all([
      this.db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM partos p
             WHERE p.id_granja = $1
               AND date_trunc('month', p.fecha_parto) = date_trunc('month', CURRENT_DATE)) AS nacimientos_mes,
           (SELECT COUNT(*)::int FROM destetes d
             JOIN partos p ON p.id = d.id_parto
             WHERE p.id_granja = $1
               AND date_trunc('month', d.fecha_destete) = date_trunc('month', CURRENT_DATE)) AS destetes_mes,
           (SELECT COALESCE(SUM(m.cantidad),0)::int FROM mortalidad m
             WHERE m.id_granja = $1
               AND date_trunc('month', m.fecha) = date_trunc('month', CURRENT_DATE)) AS mortalidad_mes,
           (SELECT COUNT(*)::int FROM animales a
             LEFT JOIN categorias c ON c.id = a.id_categoria
             WHERE a.id_granja = $1 AND a.estado = 'activo'
               AND LOWER(COALESCE(c.nombre,'')) NOT LIKE '%reproduct%') AS crias_en_crianza`,
        [farmId],
      ),
      this.db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM animales a
             LEFT JOIN categorias c ON c.id = a.id_categoria
             WHERE a.id_granja = $1 AND a.estado = 'activo'
               AND LOWER(COALESCE(c.nombre,'')) LIKE '%reproduct%') AS reproductoras,
           (SELECT COUNT(*)::int FROM empadres e
             WHERE e.id_granja = $1
               AND date_trunc('month', e.fecha_empadre) = date_trunc('month', CURRENT_DATE)) AS empadres_mes,
           (SELECT COUNT(*)::int FROM empadre_hembras eh
             JOIN empadres e ON e.id = eh.id_empadre
             WHERE e.id_granja = $1 AND eh.resultado = 'prenez') AS hembras_prenadas,
           (SELECT COUNT(*)::int FROM partos p
             WHERE p.id_granja = $1
               AND date_trunc('month', p.fecha_parto) = date_trunc('month', CURRENT_DATE)) AS partos_mes`,
        [farmId],
      ),
      this.db.query(
        `SELECT
           (SELECT COUNT(*)::int FROM ventas v
             WHERE v.id_granja = $1
               AND date_trunc('month', v.fecha) = date_trunc('month', CURRENT_DATE)) AS ventas_mes,
           (SELECT COALESCE(SUM(v.cantidad),0)::int FROM ventas v
             WHERE v.id_granja = $1
               AND date_trunc('month', v.fecha) = date_trunc('month', CURRENT_DATE)) AS cuyes_vendidos_mes,
           (SELECT COALESCE(SUM(v.precio),0) FROM ventas v
             WHERE v.id_granja = $1
               AND date_trunc('month', v.fecha) = date_trunc('month', CURRENT_DATE)) AS ingresos_mes,
           (SELECT COUNT(*)::int FROM animales a
             WHERE a.id_granja = $1 AND a.estado = 'descarte') AS descartes_pendientes`,
        [farmId],
      ),
    ]);

    return {
      fase_crianza: crianza.rows[0],
      fase_reproduccion: reproduccion.rows[0],
      fase_ventas: ventas.rows[0],
    };
  }
}
