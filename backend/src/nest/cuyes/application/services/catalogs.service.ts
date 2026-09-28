import { Injectable } from '@nestjs/common';
import { ok, fail, fromError } from '../../../shared/kernel/service-result.kernel';
import { CatalogsRepositoryPort } from '../../domain/ports/catalogs.repository.port';
import { CuyesDepsService } from '../cuyes-deps.service';

@Injectable()
export class CatalogsService {
  constructor(
    private readonly repository: CatalogsRepositoryPort,
    private readonly cuyesDeps: CuyesDepsService,
  ) {}

  private get audit() {
    return this.cuyesDeps.toDeps().audit;
  }

  private async especieDeGranja(farmId: number) {
    return this.repository.getEspecieGranja(farmId);
  }

  async listBreeds(farmId: number) {
    const idEspecie = await this.especieDeGranja(farmId);
    return ok(await this.repository.listRazas(idEspecie!));
  }

  async createBreed({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const { nombre } = body || {};
    if (!nombre) return fail('name is required');
    const idEspecie = await this.especieDeGranja(farmId);
    try {
      const raza = await this.repository.insertRaza(idEspecie!, String(nombre));
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'raza',
        idEntidad: raza.id,
        despues: raza,
        detalle: `Breed created: ${raza.nombre}`,
      });
      return ok(raza, 201);
    } catch (err: any) {
      if (err.code === '23505') return fail('Breed already exists', 409);
      return fromError(err);
    }
  }

  async listCategories(farmId: number) {
    const idEspecie = await this.especieDeGranja(farmId);
    return ok(await this.repository.listCategorias(idEspecie!));
  }

  async createCategory({
    farmId,
    userId,
    body,
  }: {
    farmId: number;
    userId: number;
    body: Record<string, unknown>;
  }) {
    const { nombre, proposito_area } = body || {};
    if (!nombre) return fail('name is required');
    const idEspecie = await this.especieDeGranja(farmId);
    try {
      const categoria = await this.repository.insertCategoria(
        idEspecie!,
        String(nombre),
        proposito_area ? String(proposito_area) : undefined,
      );
      await this.audit.write({
        userId,
        farmId,
        accion: 'crear',
        entidad: 'categoria',
        idEntidad: categoria.id,
        despues: categoria,
        detalle: `Category created: ${categoria.nombre}`,
      });
      return ok(categoria, 201);
    } catch (err: any) {
      if (err.code === '23505') return fail('Category already exists', 409);
      return fromError(err);
    }
  }

  async deactivateRaza({
    farmId,
    userId,
    id,
  }: {
    farmId: number;
    userId: number;
    id: string;
  }) {
    const idEspecie = await this.especieDeGranja(farmId);
    const raza = await this.repository.deactivateRaza(Number(id), idEspecie!);
    if (!raza) return fail('Breed not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'deactivate',
      entidad: 'raza',
      idEntidad: raza.id,
      despues: raza,
      detalle: `Breed deactivated: ${raza.nombre}`,
    });
    return ok(raza);
  }

  async deactivateCategoria({
    farmId,
    userId,
    id,
  }: {
    farmId: number;
    userId: number;
    id: string;
  }) {
    const idEspecie = await this.especieDeGranja(farmId);
    const categoria = await this.repository.deactivateCategoria(
      Number(id),
      idEspecie!,
    );
    if (!categoria) return fail('Category not found', 404);
    await this.audit.write({
      userId,
      farmId,
      accion: 'deactivate',
      entidad: 'categoria',
      idEntidad: categoria.id,
      despues: categoria,
      detalle: `Category deactivated: ${categoria.nombre}`,
    });
    return ok(categoria);
  }

  async getTransitions(farmId: number) {
    const conf = await this.repository.getAlertaConfig(farmId);
    const byTipo = Object.fromEntries(conf.map((c) => [c.tipo, c.dias]));
    const edadRecria = Number(byTipo.edad_recria) || 21;
    const edadEmpadre = Number(byTipo.edad_empadre) || 90;

    const idEspecie = await this.especieDeGranja(farmId);
    const cats = await this.repository.listCategorias(idEspecie!);
    const findCat = (fn: (n: string) => boolean) =>
      cats.find((c) => fn(c.nombre.toLowerCase()))?.id || null;
    const idRecria = findCat((n) => n.includes('recr') || n.includes('reemplazo'));
    const idReproductora = findCat((n) => n.includes('reproductora'));
    const idReproductor = findCat((n) => n.includes('reproductor'));

    const rows = (await this.repository.getAnimalesConCategoria(farmId)) as any[];
    const hoy = new Date();
    const propuestas: unknown[] = [];

    for (const an of rows) {
      const edadDias = Math.floor(
        (hoy.getTime() -
          new Date(`${String(an.fecha_nacimiento).slice(0, 10)}T00:00:00`).getTime()) /
          86400000,
      );
      const cat = String(an.categoria || '').toLowerCase();
      let propuesta: { categorias: number; nombre: string } | null = null;
      if (
        idRecria &&
        (cat.includes('gazapo') || cat.includes('cria')) &&
        edadDias >= edadRecria
      ) {
        propuesta = {
          categorias: idRecria,
          nombre: cats.find((c) => c.id === idRecria)!.nombre,
        };
      } else if (
        (cat.includes('recr') || cat.includes('reemplazo')) &&
        edadDias >= edadEmpadre
      ) {
        const target = an.sexo === 'H' ? idReproductora : idReproductor;
        if (target) {
          propuesta = {
            categorias: target,
            nombre: cats.find((c) => c.id === target)!.nombre,
          };
        }
      }
      if (propuesta) {
        propuestas.push({
          id_animal: an.id,
          codigo: an.codigo,
          sexo: an.sexo,
          jaula: an.jaula,
          categoria_actual: an.categoria,
          categoria_propuesta_id: propuesta.categorias,
          categoria_propuesta: propuesta.nombre,
          edad_dias: edadDias,
        });
      }
    }

    return ok({
      plazos: { edad_recria: edadRecria, edad_empadre: edadEmpadre },
      total: propuestas.length,
      propuestas,
    });
  }
}
