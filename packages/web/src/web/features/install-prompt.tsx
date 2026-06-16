import { useEffect, useState } from "react";

const KEY = "cc_install_dismissed";

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(KEY);
    // standalone = já está instalado na tela inicial
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-ignore iOS
      window.navigator.standalone === true;
    if (!dismissed && !standalone) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  function close() {
    localStorage.setItem(KEY, "1");
    setShow(false);
  }

  if (!show) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={close}
    >
      <div
        className="cc-fade w-full max-w-[480px] p-5"
        style={{ background: "var(--cc-card)", borderRadius: "24px 24px 0 0", border: "1px solid var(--cc-border)", paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#16C784,#0e9e68)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Use como aplicativo</div>
            <div style={{ fontSize: 13, color: "var(--cc-text2)" }}>Adicione na tela inicial e use offline</div>
          </div>
        </div>

        {isIOS ? (
          <ol style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 4, listStyle: "none" }}>
            <li><b style={{ color: "var(--cc-good)" }}>1.</b> Toque no botão <b>Compartilhar</b> <span style={{ fontSize: 13, color: "var(--cc-text2)" }}>(quadrado com seta ↑, embaixo no Safari)</span></li>
            <li><b style={{ color: "var(--cc-good)" }}>2.</b> Role e toque em <b>"Adicionar à Tela de Início"</b></li>
            <li><b style={{ color: "var(--cc-good)" }}>3.</b> Toque em <b>"Adicionar"</b> no canto</li>
            <li style={{ color: "var(--cc-text2)", fontSize: 13, marginTop: 6 }}>Pronto! Vai aparecer o ícone do Corrida Certa igual um app.</li>
          </ol>
        ) : (
          <ol style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 4, listStyle: "none" }}>
            <li><b style={{ color: "var(--cc-good)" }}>1.</b> Abra o menu do navegador <b>(⋮)</b></li>
            <li><b style={{ color: "var(--cc-good)" }}>2.</b> Toque em <b>"Instalar app"</b> ou <b>"Adicionar à tela inicial"</b></li>
            <li><b style={{ color: "var(--cc-good)" }}>3.</b> Confirme</li>
          </ol>
        )}

        <button className="cc-btn w-full mt-4" onClick={close} style={{ background: "var(--cc-good)", color: "#06281c" }}>
          Entendi
        </button>
      </div>
    </div>
  );
}
