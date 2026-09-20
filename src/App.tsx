  }

  function resetDay() {
    if (!confirm(`¿Borrar todos los datos del día ${date}? Esta acción no se puede deshacer.`)) return;
    const next = structuredClone(state);
    const p = next.profiles.find(x => x.id === active.id)!;
    delete p.days[date];
    commit(next);
  }

  function resetAll() {
    if (!confirm('¿Borrar TODOS los perfiles y datos de NutriControl? Esta acción no se puede deshacer.')) return;
    localStorage.removeItem(key);
    localStorage.removeItem('nutricontrol-v2');
    const fresh = makeProfile('Yo');
    const next = { profiles: [fresh], activeProfileId: fresh.id };
    setState(next);
    setTab('hoy');
    setSetupOpen(true);
    setSetupNewProfile(false);
  }

  async function analyze() {
    if (!photo) return;
    setAiBusy(true); setAiError(''); setAiFoods([]); setAiSelected([]);

    try {
      const prepared = await image.resizeIfNeeded(photo, {
        maxDimension: 1600,
        maxPixels: 2000000,
        quality: 0.82,
        mimeType: 'image/jpeg',
      });

      let lastError: unknown = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const r = await api.post('/api/analyze-food', {
            image: prepared.data,
            mimeType: prepared.mimeType,
          });
          const foods = Array.isArray(r.data?.foods) ? r.data.foods : [];
          if (foods.length > 0) {
            setAiFoods(foods.map(normalizeFood));
            return;
          }
          lastError = new Error('La IA no devolvió alimentos en este intento.');
        } catch (error) {
          lastError = error;
        }
      }

      throw (lastError || new Error('No fue posible analizar la foto.'));
    } catch (e) {
      setAiError(e instanceof Error
        ? `No pude completar el análisis después de varios intentos: ${e.message}`
        : 'No pude completar el análisis después de varios intentos.');
    } finally {
      setAiBusy(false);
    }
  }

  async function addExercise() {
    if (!active || exerciseDuration <= 0) return;
    const baseMet = exerciseTypes.find(x => x[0] === exerciseType)?.[1] || 5;
    const intensityFactor = { suave: 0.8, moderada: 1, alta: 1.2 }[exerciseIntensity];
    const kcal = Math.round(baseMet * intensityFactor * active.weight * (exerciseDuration / 60));
    let attachment: string | undefined;
    if (exercisePhoto) {
      const prepared = await image.resizeIfNeeded(exercisePhoto, { maxDimension: 480, maxPixels: 230000, quality: 0.5, mimeType: 'image/jpeg' });
      attachment = `data:${prepared.mimeType};base64,${prepared.data}`;
    }
    updateDay(d => d.exercises.push({ id: id(), type: exerciseType, duration: exerciseDuration, kcal, image: attachment }));
    setExercisePhoto(null);
    setExerciseOpen(false);
  }

  function deleteExercise(exerciseId: string) {
    updateDay(d => { d.exercises = d.exercises.filter(e => e.id !== exerciseId); });
  }