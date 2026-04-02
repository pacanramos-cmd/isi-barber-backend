  // Panel.jsx — Panel de administración del barbero
  import { useState, useEffect } from "react";

  const API = "http://localhost:4000/api";

  const peso = v =>
    new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", minimumFractionDigits:0 }).format(v);

  // ── Login ─────────────────────────────────────────────────────
  function Login({ onLogin }) {
    const [email, setEmail]   = useState("");
    const [pass,  setPass]    = useState("");
    const [error, setError]   = useState("");
    const [carga, setCarga]   = useState(false);

    const entrar = async () => {
      setCarga(true); setError("");
      try {
        const res  = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password: pass }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        localStorage.setItem("isi_token",  data.token);
        localStorage.setItem("isi_nombre", data.nombre);
        onLogin(data.token, data.nombre);
      } catch (e) {
        setError(e.message);
      } finally {
        setCarga(false);
      }
    };

    return (
      <div style={{
        minHeight:"100vh", background:"#060606",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontFamily:"Lato, sans-serif",
      }}>
        <div style={{
          background:"#111", border:"1px solid #c9a84c30",
          borderRadius:16, padding:"40px 36px", width:360,
          boxShadow:"0 20px 60px #00000080",
        }}>
          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ fontSize:48, marginBottom:8 }}>💈</div>
            <h1 style={{ color:"#c9a84c", fontFamily:"Playfair Display, serif", fontSize:24, margin:0 }}>The Isi Barber Shop</h1>
            <p style={{ color:"#666", fontSize:13, marginTop:6 }}>Panel del Barbero</p>
          </div>

          {error && (
            <div style={{ background:"#2a0a0a", border:"1px solid #e74c3c40", borderRadius:8, padding:"10px 14px", marginBottom:16, color:"#e74c3c", fontSize:13 }}>
              ❌ {error}
            </div>
          )}

          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", color:"#888", fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Correo electrónico
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="barbero@gmail.com"
              style={{ width:"100%", padding:"12px 16px", background:"#0f0f0f", border:"2px solid #1e1e1e", borderRadius:10, color:"#e8e8e8", fontSize:15, outline:"none", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#c9a84c"}
              onBlur={e => e.target.style.borderColor="#1e1e1e"}
            />
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", color:"#888", fontSize:12, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>
              Contraseña
            </label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && entrar()}
              style={{ width:"100%", padding:"12px 16px", background:"#0f0f0f", border:"2px solid #1e1e1e", borderRadius:10, color:"#e8e8e8", fontSize:15, outline:"none", boxSizing:"border-box" }}
              onFocus={e => e.target.style.borderColor="#c9a84c"}
              onBlur={e => e.target.style.borderColor="#1e1e1e"}
            />
          </div>

          <button onClick={entrar} disabled={carga} style={{
            width:"100%", padding:"14px", background:"linear-gradient(135deg,#c9a84c,#e8c96a)",
            color:"#0a0a0a", border:"none", borderRadius:10, fontSize:16, fontWeight:700,
            cursor: carga ? "not-allowed" : "pointer", opacity: carga ? 0.7 : 1,
          }}>
            {carga ? "Entrando..." : "Entrar al panel"}
          </button>
        </div>
      </div>
    );
  }

  // ── Panel principal ───────────────────────────────────────────
  function Panel({ token, nombre, onLogout }) {
    const [citas,  setCitas]  = useState([]);
    const [filtro, setFiltro] = useState("todas");
    const [fecha,  setFecha]  = useState("");
    const [carga,  setCarga]  = useState(false);

    const cargarCitas = async () => {
      setCarga(true);
      try {
        let url = `${API}/citas?`;
        if (filtro !== "todas") url += `estado=${filtro}&`;
        if (fecha) url += `fecha=${fecha}`;
        const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setCitas(data);
      } catch (e) { console.error(e); }
      finally { setCarga(false); }
    };

    useEffect(() => { cargarCitas(); }, [filtro, fecha]);

    const cambiarEstado = async (id, estado) => {
      await fetch(`${API}/citas/${id}/estado`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ estado }),
      });
      cargarCitas();
    };

    const coloresEstado = {
      pendiente:  { bg:"#1a1200", color:"#f39c12", border:"#f39c1240" },
      confirmada: { bg:"#0a1a10", color:"#2ecc71", border:"#2ecc7140" },
      atendida:   { bg:"#0a0a1a", color:"#3498db", border:"#3498db40" },
      cancelada:  { bg:"#1a0a0a", color:"#e74c3c", border:"#e74c3c40" },
    };

    return (
      <div style={{ minHeight:"100vh", background:"#060606", fontFamily:"Lato, sans-serif" }}>
        {/* Header */}
        <header style={{ background:"#0f0f0f", borderBottom:"1px solid #c9a84c30", padding:"0 24px" }}>
          <div style={{ maxWidth:1100, margin:"0 auto", height:64, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>💈</span>
              <div>
                <div style={{ color:"#c9a84c", fontFamily:"Playfair Display, serif", fontSize:18, fontWeight:700, lineHeight:1 }}>The Isi Barber Shop</div>
                <div style={{ color:"#666", fontSize:11, letterSpacing:"0.2em" }}>PANEL DEL BARBERO</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <span style={{ color:"#888", fontSize:14 }}>👋 {nombre}</span>
              <button onClick={onLogout} style={{
                padding:"8px 16px", background:"transparent", border:"1px solid #333",
                borderRadius:8, color:"#888", fontSize:13, cursor:"pointer",
              }}>Salir</button>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ maxWidth:1100, margin:"0 auto", padding:"28px 24px" }}>

          {/* Estadísticas rápidas */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:14, marginBottom:28 }}>
            {[
              { label:"Pendientes",  val: citas.filter(c => c.estado === "pendiente").length,  color:"#f39c12" },
              { label:"Confirmadas", val: citas.filter(c => c.estado === "confirmada").length, color:"#2ecc71" },
              { label:"Atendidas",   val: citas.filter(c => c.estado === "atendida").length,   color:"#3498db" },
              { label:"Total citas", val: citas.length,                                         color:"#c9a84c" },
            ].map(s => (
              <div key={s.label} style={{ background:"#111", border:`1px solid ${s.color}30`, borderRadius:12, padding:"16px 20px" }}>
                <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:"Playfair Display, serif" }}>{s.val}</div>
                <div style={{ fontSize:12, color:"#666", textTransform:"uppercase", letterSpacing:"0.1em" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap", alignItems:"center" }}>
            {["todas","pendiente","confirmada","atendida","cancelada"].map(f => (
              <button key={f} onClick={() => setFiltro(f)} style={{
                padding:"8px 16px", borderRadius:8, fontSize:13, cursor:"pointer",
                background: filtro === f ? "#c9a84c" : "#111",
                color:      filtro === f ? "#0a0a0a" : "#888",
                border:     filtro === f ? "1px solid #c9a84c" : "1px solid #222",
                fontWeight: filtro === f ? 700 : 400,
                textTransform:"capitalize",
              }}>{f}</button>
            ))}
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}
              style={{ padding:"8px 12px", background:"#111", border:"1px solid #222", borderRadius:8, color:"#e8e8e8", fontSize:13, outline:"none" }}
            />
            {fecha && <button onClick={() => setFecha("")} style={{ color:"#888", background:"transparent", border:"none", cursor:"pointer", fontSize:13 }}>✕ Limpiar fecha</button>}
          </div>

          {/* Lista de citas */}
          {carga ? (
            <div style={{ textAlign:"center", color:"#666", padding:40 }}>Cargando citas...</div>
          ) : citas.length === 0 ? (
            <div style={{ textAlign:"center", color:"#444", padding:60, fontSize:18 }}>
              💈 No hay citas para mostrar
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {citas.map(c => {
                const est = coloresEstado[c.estado] || coloresEstado.pendiente;
                return (
                  <div key={c.id} style={{
                    background:"#111", border:`1px solid ${est.border}`,
                    borderLeft:`4px solid ${est.color}`,
                    borderRadius:12, padding:"18px 20px",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
                      {/* Info cita */}
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                          <span style={{ color:"#e8e8e8", fontWeight:700, fontSize:16 }}>👤 {c.cliente_nombre}</span>
                          <span style={{ color:"#888", fontSize:13 }}>📱 {c.cliente_telefono}</span>
                        </div>
                        <div style={{ color:"#c9a84c", fontSize:14, marginBottom:4 }}>✂️ {c.servicios}</div>
                        <div style={{ color:"#aaa", fontSize:13, display:"flex", gap:16, flexWrap:"wrap" }}>
                          <span>📅 {c.fecha}</span>
                          <span>🕐 {c.hora}</span>
                          <span>📍 {c.modalidad === "presencial" ? "Presencial" : `Domicilio — ${c.zona}`}</span>
                          {c.direccion && <span>🏠 {c.direccion}</span>}
                        </div>
                        {c.color_tinte && (
                          <div style={{ color:"#aaa", fontSize:13, marginTop:4 }}>🎨 {c.color_tinte} ({c.genero_tinte})</div>
                        )}
                        <div style={{ marginTop:8, display:"flex", gap:12, alignItems:"center" }}>
                          <span style={{ color:"#c9a84c", fontWeight:700, fontSize:16 }}>{peso(c.precio_final)}</span>
                          <span style={{ color:"#888", fontSize:12 }}>💳 {c.metodo_pago}</span>
                        </div>
                      </div>

                      {/* Estado + acciones */}
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:10 }}>
                        <span style={{
                          background:est.bg, color:est.color, border:`1px solid ${est.border}`,
                          borderRadius:20, padding:"4px 14px", fontSize:12, fontWeight:700,
                          textTransform:"uppercase", letterSpacing:"0.1em",
                        }}>{c.estado}</span>
                        <div style={{ display:"flex", gap:8 }}>
                          {c.estado === "pendiente" && (
                            <button onClick={() => cambiarEstado(c.id, "confirmada")} style={{
                              padding:"6px 14px", background:"#0a2010", border:"1px solid #2ecc7140",
                              borderRadius:8, color:"#2ecc71", fontSize:12, cursor:"pointer", fontWeight:700,
                            }}>✅ Confirmar</button>
                          )}
                          {c.estado === "confirmada" && (
                            <button onClick={() => cambiarEstado(c.id, "atendida")} style={{
                              padding:"6px 14px", background:"#0a0a20", border:"1px solid #3498db40",
                              borderRadius:8, color:"#3498db", fontSize:12, cursor:"pointer", fontWeight:700,
                            }}>✔ Atendida</button>
                          )}
                          {c.estado !== "cancelada" && c.estado !== "atendida" && (
                            <button onClick={() => cambiarEstado(c.id, "cancelada")} style={{
                              padding:"6px 14px", background:"#1a0a0a", border:"1px solid #e74c3c40",
                              borderRadius:8, color:"#e74c3c", fontSize:12, cursor:"pointer",
                            }}>✕ Cancelar</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    );
  }

  // ── App Panel ─────────────────────────────────────────────────
  export default function PanelApp() {
    const [token,  setToken]  = useState(() => localStorage.getItem("isi_token") || "");
    const [nombre, setNombre] = useState(() => localStorage.getItem("isi_nombre") || "");

    const handleLogin = (t, n) => { setToken(t); setNombre(n); };
    const handleLogout = () => {
      localStorage.removeItem("isi_token");
      localStorage.removeItem("isi_nombre");
      setToken(""); setNombre("");
    };

    if (!token) return <Login onLogin={handleLogin} />;
    return <Panel token={token} nombre={nombre} onLogout={handleLogout} />;
  }
