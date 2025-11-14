// js/main.js

document.addEventListener('DOMContentLoaded', function() {
    async function atualizarNavegacao() {
        try {
            const res = await fetch('../php/verificar_sessao.php', { cache: 'no-store' });
            const session = await res.json();
            const nav = document.querySelector('header nav');
            if (!nav) return;

            let links = `<a href="index.html">Início</a>`;

            // Exibir 'Agendar' apenas se for cliente
            if (session.logado && session.role === 'cliente') {
                links += `<a href="agendamento.html">Agendar</a>`;
            }

            if (session.logado) {
                // Mostrar 'Meus Agendamentos' apenas para cliente
                if (session.role === 'cliente') {
                    links += `<a href="meus-agendamentos.html">Meus Agendamentos</a>`;
                }
                if (session.role === 'admin') {
                    links += `<a href="admin-agendamentos.html">Painel Admin</a>`;
                }
                links += `<a href="#" id="logout-link">Sair</a>`;
            } else {
                links += `
                    <a href="auth.html">Login</a>
                    <a href="auth.html">Cadastrar</a>
                `;
            }
            nav.innerHTML = links;
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
        }
    }

    async function handleLogoutClick(event) {
        const target = event.target;
        if (!target || target.id !== 'logout-link') return;
        event.preventDefault();
        try {
            const res = await fetch('../php/logout.php', { method: 'POST' });
            if (res.ok) {
                await atualizarNavegacao();
                window.location.href = 'index.html';
            } else {
                alert('Erro ao tentar sair');
            }
        } catch (e) {
            console.error('Erro no logout:', e);
            alert('Erro de comunicação ao tentar sair.');
        }
    }

    // Inicialização
    atualizarNavegacao();
    document.body.addEventListener('click', handleLogoutClick);
});
