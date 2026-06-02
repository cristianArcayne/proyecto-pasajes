import React from "react";

const MapaAsientos = ({ asientos, nroAsientoSeleccionado, onSelectAsiento }) => {
  if (!asientos || asientos.length === 0) return null;

  const esBusGrande = asientos.length > 35; // Más de 35 = Bus Grande (2-2 layout, 5 cols)
  const columnas = esBusGrande ? 5 : 4;
  const pasilloIndex = esBusGrande ? 2 : 1; // Columna central vs columna 2da
  const asientosOrdenados = [...asientos].sort((x, y) => x.nro_asiento - y.nro_asiento);

  const elementosGrilla = [];
  let seatIdx = 0;
  while (seatIdx < asientosOrdenados.length) {
    for (let col = 0; col < columnas; col++) {
      if (col === pasilloIndex) {
        elementosGrilla.push({ tipo: "pasillo", id: `pas-${seatIdx}-${col}` });
      } else {
        if (seatIdx < asientosOrdenados.length) {
          elementosGrilla.push({ tipo: "asiento", datos: asientosOrdenados[seatIdx] });
          seatIdx++;
        }
      }
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columnas}, 1fr)`,
        gap: "8px",
        marginTop: "12px",
        background: "#fafbfc",
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #edf0f2",
        boxSizing: "border-box",
      }}
    >
      {elementosGrilla.map((el) => {
        if (el.tipo === "pasillo") {
          return (
            <div
              key={el.id}
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#94a3b8",
                fontSize: "11px",
                fontWeight: "bold",
                opacity: 0.5,
              }}
            >
              ||
            </div>
          );
        }
        const a = el.datos;
        const isSelected = nroAsientoSeleccionado === a.nro_asiento;
        const bg = a.ocupado ? "#fee2e2" : isSelected ? "#502bc0" : "#dcfce7";
        const col = a.ocupado ? "#dc2626" : isSelected ? "#fff" : "#16a34a";
        const border = a.ocupado
          ? "1px solid #fecaca"
          : isSelected
          ? "1px solid #502bc0"
          : "1px solid #bbf7d0";

        return (
          <button
            key={a.nro_asiento}
            type="button"
            disabled={a.ocupado}
            onClick={() => onSelectAsiento(a.nro_asiento)}
            style={{
              backgroundColor: bg,
              color: col,
              border: border,
              padding: "10px 0",
              borderRadius: "6px",
              cursor: a.ocupado ? "not-allowed" : "pointer",
              fontWeight: "bold",
              transition: "0.2s",
            }}
          >
            {a.nro_asiento}
          </button>
        );
      })}
    </div>
  );
};

export default MapaAsientos;
