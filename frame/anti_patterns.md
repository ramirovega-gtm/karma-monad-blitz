---
id: anti_patterns
type: frame
tags: [frame, hackathon, anti-patterns]
related: [[evaluation_frame]], [[monad_tech]], [[CLAUDE]]
status: Canonical
last_updated: 2026-05-28
---

# Anti-patterns — ideas de hackatón Monad

Trampas que matan ideas de hackatón. Pasar cada idea candidata por esta lista ANTES de armar el boceto de arquitectura.

1. **Monad-decorado.** El proyecto correría idéntico en cualquier EVM; Monad está solo porque era requisito. Mata el eje 1. → Reformular para que una capacidad de Monad sea load-bearing, o descartar.

2. **El clon premiado.** Otro DEX / lending / yield aggregator / NFT-mint / token launcher. Ya ganó 50 hackatones; el jurado lo vio mil veces. Sin un ángulo no obvio, mata el eje 5.

3. **Wow invisible.** El valor técnico es real pero no se ve en una demo de 3 minutos (ej: mejora de backend que el jurado no puede percibir en vivo). Mata el eje 3.

4. **Scope de startup, no de hackatón.** Idea que necesita 3 meses para tener algo mostrable. En 72h llega a medio hacer y la demo falla. Mata el eje 2. → Recortar a la rebanada demo-able más fina que prueba el concepto.

5. **Dependencia de lo no liberado.** Depende de una feature de Monad, un SDK o un dato que `[verificar]` no está disponible al momento del hackatón. Riesgo fatal sin plan B. Mata el eje 6.

6. **Demo sin happy-path.** No hay un guion de 3 minutos donde algo se ve funcionar de punta a punta. Si no podés escribir el guion de la demo, la idea no está lista.

7. **Sobre-ingeniería on-chain.** Meter todo on-chain por purismo cuando parte podría ser off-chain y la demo sería más sólida. El jurado premia que funcione, no la pureza.

8. **Narrativa huérfana.** No encaja en ningún track ni en lo que Monad quiere mostrar. Buena tech, cero contexto de por qué a este hackatón le importa. Mata el eje 4.

9. **Contaminación del raíz.** Evaluar la idea por durabilidad 5-10yr, potencial de empresa, LatAm-first o filtro Ramiro. Eso es el repo padre, no acá. Si aparece, es ruido — descartarlo.

## Regla

Si una idea matchea **≥2 anti-patterns sin mitigación**, KILL. Si matchea 1, documentar la mitigación explícita antes de avanzar a boceto de arquitectura.

## Related

- [[evaluation_frame]]
- [[monad_tech]]
- [[CLAUDE]]

---

**Status:** Canonical
**Last Updated:** 2026-05-28
