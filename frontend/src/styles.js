// styles.js
// Contiene el objeto de estilos compartido para todos los componentes de la UI.

export const styles = {
    body: { fontFamily: "sans-serif", backgroundColor: "#f0f2f5", padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" },
    container: { maxWidth: "800px", width: "100%", backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", marginBottom: "20px" },
    header: { borderBottom: "1px solid #ccc", paddingBottom: "10px", marginBottom: "20px", display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    title: { margin: 0 },
    video: { width: "100%", backgroundColor: "black", borderRadius: "4px", marginTop: '20px' },
    button: { padding: "10px 16px", borderRadius: "4px", border: "none", color: "white", cursor: "pointer", backgroundColor: "#007bff", fontSize: '14px' },
    buttonDanger: { backgroundColor: '#dc3545' },
    buttonSuccess: { backgroundColor: '#28a745' },
    input: { flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc", minWidth: '100px' },
    wsControls: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" },
    statusBox: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', marginTop: '15px' },
    status: { flex: 1, padding: "10px", borderRadius: "4px", textAlign: "center", fontWeight: "bold", color: "white" },
    select: { width: "100%", padding: "8px", marginTop: "20px", borderRadius: "4px", border: "1px solid #ccc" },
    connectionStep: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginTop: '20px' },
    stepTitle: { marginTop: '0', borderBottom: '1px solid #eee', paddingBottom: '10px' },
    stepDescription: { fontSize: '14px', color: '#666', marginTop: '5px' },
    buttonGroup: { display: 'flex', gap: '10px', alignItems: 'center', marginTop: '15px' },
    
    // --- NUEVO: Estilo para el banner de desactivación de cámara ---
    deactivationBanner: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        padding: '10px', // Usamos padding para que el texto sea visible
        boxSizing: 'border-box',
        backgroundColor: 'rgba(40, 40, 40, 0.85)',
        color: 'white',
        textAlign: 'center',
        zIndex: 2000, // Debe estar por encima de otros elementos
        fontSize: '16px',
        fontWeight: 'bold',
    },
};