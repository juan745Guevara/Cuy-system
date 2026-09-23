const { ok, fail, fromError } = require('../../../shared/kernel/ServiceResult');

function createCatalogsService({ repository, audit }) {
  async function especieDeGranja(farmId) {
    return repository.getEspecieGranja(farmId);
  }

  return {
    async listBreeds(farmId) {
      const idEspecie = await especieDeGranja(farmId);
      return ok(await repository.listRazas(idEspecie));
    },

    async createBreed({ farmId, userId, body }) {
      const { nombre } = body || {};
      if (!nombre) return fail('name is required');
      const idEspecie = await especieDeGranja(farmId);
      try {
        const raza = await repository.insertRaza(idEspecie, nombre);
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'raza',
          idEntidad: raza.id,
          despues: raza,
          detalle: `Breed created: ${raza.nombre}`,
        });
        return ok(raza, 201);
      } catch (err) {
        if (err.code === '23505') return fail('Breed already exists', 409);
        return fromError(err);
      }
    },

    async listCategories(farmId) {
      const idEspecie = await especieDeGranja(farmId);
      return ok(await repository.listCategorias(idEspecie));
    },

    async createCategory({ farmId, userId, body }) {
      const { nombre, proposito_area } = body || {};
      if (!nombre) return fail('name is required');
      const idEspecie = await especieDeGranja(farmId);
      try {
        const categoria = await repository.insertCategoria(idEspecie, nombre, proposito_area);
        await audit.write({
          userId,
          farmId,
          accion: 'crear',
          entidad: 'categoria',
          idEntidad: categoria.id,
          despues: categoria,
          detalle: `Category created: ${categoria.nombre}`,
        });
        return ok(categoria, 201);
      } catch (err) {
        if (err.code === '23505') return fail('Category already exists', 409);
        return fromError(err);
      }
    },

    async listSpecies() {
      return ok(await repository.listEspecies());
    },

    async deactivateRaza({ farmId, userId, id }) {
      const idEspecie = await especieDeGranja(farmId);
      const raza = await repository.deactivateRaza(id, idEspecie);
      if (!raza) return fail('Breed not found', 404);
      await audit.write({
        userId,
        farmId,
        accion: 'deactivate',
        entidad: 'raza',
        idEntidad: raza.id,
        despues: raza,
        detalle: `Breed deactivated: ${raza.nombre}`,
      });
      return ok(raza);
    },

    async deactivateCategoria({ farmId, userId, id }) {
      const idEspecie = await especieDeGranja(farmId);
      const categoria = await repository.deactivateCategoria(id, idEspecie);
      if (!categoria) return fail('Category not found', 404);
      await audit.write({
        userId,
        farmId,
        accion: 'deactivate',
        entidad: 'categoria',
        idEntidad: categoria.id,
        despues: categoria,
        detalle: `Category deactivated: ${categoria.nombre}`,
      });
      return ok(categoria);
    },

    async getTransitions(farmId) {
      const conf = await repository.getAlertaConfig(farmId);
      const byTipo = Object.fromEntries(conf.map((c) => [c.tipo, c.dias]));
      const edadRecria = Number(byTipo.edad_recria) || 21;
      const edadEmpadre = Number(byTipo.edad_empadre) || 90;

      const idEspecie = await especieDeGranja(farmId);
      const cats = await repository.listCategorias(idEspecie);
      const findCat = (fn) => cats.find((c) => fn(c.nombre.toLowerCase()))?.id || null;
      const idRecria = findCat((n) => n.includes('recr') || n.includes('reemplazo'));
      const idReproductora = findCat((n) => n.includes('reproductora'));
      const idReproductor = findCat((n) => n.includes('reproductor'));

      const rows = await repository.getAnimalesConCategoria(farmId);
      const hoy = new Date();
      const propuestas = [];

      for (const an of rows) {
        const edadDias = Math.floor(
          (hoy - new Date(`${String(an.fecha_nacimiento).slice(0, 10)}T00:00:00`)) / 86400000
        );
        const cat = String(an.categoria || '').toLowerCase();
        let propuesta = null;
        if (idRecria && (cat.includes('gazapo') || cat.includes('cria')) && edadDias >= edadRecria) {
          propuesta = { categorias: idRecria, nombre: cats.find((c) => c.id === idRecria).nombre };
        } else if ((cat.includes('recr') || cat.includes('reemplazo')) && edadDias >= edadEmpadre) {
          const target = an.sexo === 'H' ? idReproductora : idReproductor;
          if (target) {
            propuesta = { categorias: target, nombre: cats.find((c) => c.id === target).nombre };
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
    },
  };
}

module.exports = { createCatalogsService };
